/**
 * ==============================================================================
 * GILGAMESH PROFILER - MASTER ORCHESTRATOR (ES6)
 * ==============================================================================
 * The primary entry point. Coordinates the UI, Map, and Analytics modules, 
 * and executes the asynchronous concurrency pipeline against the Flask API.
 * ==============================================================================
 */

import { getRegionsRegistry } from './config.js';
import { DOM } from './dom.js';
import { initUIBindings, openTelemetryDrawer, updateSystemStatus } from './ui.js';
import { initMapNodes, updateNodeState, updateNodeLabel } from './map.js';
import { updateExecutiveSummary } from './analytics.js';
import { initCameraPhysics } from './camera.js'; 

// ==============================================================================
// GLOBAL STATE
// ==============================================================================
const REGIONS_REGISTRY = getRegionsRegistry();
let currentTelemetryResults = [];
let isRunning = false;
let globalSystemHealth = 'READY'; // Tracks HUD lifecycle

// Initialize tactile UX elements and the Pan/Zoom Camera
initUIBindings(REGIONS_REGISTRY);
initCameraPhysics();

// ==============================================================================
// ASYNCHRONOUS API PIPELINE
// ==============================================================================

/**
 * Fires the REST API payload to the Flask backend and updates the Map Physics.
 */
async function pingRegion(model, region, maxTokens) {
    updateNodeState(region, 'testing');
    
    try {
        const response = await fetch('/api/v1/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                region: region,
                api_version: 'v1',
                max_tokens: maxTokens
            })
        });
        
        // INTERCEPT HTTP 429 RATE LIMITS & FAULTS
        // Modifies the globalSystemHealth state so the HUD permanently reflects 
        // the degraded status even if other concurrent requests succeed.
        if (response.status === 429) {
            globalSystemHealth = 'RATE_LIMITED';
            updateSystemStatus(globalSystemHealth);
            throw new Error("HTTP 429 (TOO MANY REQUESTS): Mesh Profiler internal rate limit exceeded. Please wait before initiating another sweep.");
        }
        if (!response.ok && response.headers.get("content-type")?.indexOf("application/json") === -1) {
             globalSystemHealth = 'OFFLINE';
             updateSystemStatus(globalSystemHealth);
             throw new Error(`HTTP ${response.status}: Internal Server Error (Non-JSON payload detected).`);
        }

        const result = await response.json();
        
        const telemetryObj = {
            region: region,
            success: result.success,
            tps: result.velocity || 0,
            min: result.min_lat || 0,
            avg: result.avg_lat || 0,
            url: result.rest_url || '',
            error: result.error || ''
        };
        currentTelemetryResults.push(telemetryObj);

        if (result.success) {
            updateNodeState(region, 'success');
            updateNodeLabel(region, `${region} [${telemetryObj.tps} TPS]`);
        } else {
            const state = result.error.includes('50') ? 'warning' : 'error';
            updateNodeState(region, state);
        }

    } catch (error) {
        // MEMORY PROTECTION ALGORITHM
        // Truncates catastrophic error payloads to prevent DOM/GPU Out Of Memory (OOM) faults.
        const safeErrorMsg = error.message.length > 200 
            ? error.message.substring(0, 200) + "... [Truncated for memory safety]"
            : error.message;
            
        console.error(`Fetch failed for ${region}:`, safeErrorMsg);
        
        currentTelemetryResults.push({
            region: region,
            success: false,
            tps: 0, min: 0, avg: 0, url: 'Internal Profiler API',
            error: safeErrorMsg
        });
        
        updateNodeState(region, 'error');
    }
}

// ==============================================================================
// BATCH EXECUTION ORCHESTRATOR
// ==============================================================================

DOM.btnInitiate.addEventListener('click', async () => {
    if (isRunning) return;
    
    // 1. Gather Inputs
    const model = DOM.modelSelect.value;
    const scope = document.querySelector('input[name="scope"]:checked').value;
    const maxTokens = parseInt(DOM.tokenSlider.value);
    let selectedRegions = [];

    if (scope === 'single') {
        selectedRegions.push(DOM.regionSelect.value);
    } else if (scope === 'group') {
        const groupName = DOM.regionSelect.value;
        selectedRegions = REGIONS_REGISTRY[groupName];
    } else {
        selectedRegions = Object.values(REGIONS_REGISTRY).flat();
    }

    selectedRegions = [...new Set(selectedRegions)];

    // 2. Lock UI & Bind Initial HUD State
    isRunning = true;
    globalSystemHealth = 'SCANNING';
    updateSystemStatus(globalSystemHealth);
    
    DOM.btnInitiate.disabled = true;
    DOM.btnInitiate.classList.add('btn-scanning');
    DOM.btnInitiate.textContent = 'SCANNING MESH...';
    currentTelemetryResults = [];
    
    // 3. Setup Map
    initMapNodes(selectedRegions, (regionClicked) => openTelemetryDrawer(regionClicked, currentTelemetryResults));

    // Auto-Pan/Zoom Camera
    if (typeof window.focusCameraOnRegions === 'function') {
        window.focusCameraOnRegions(selectedRegions);
    }

    // 4. Batch Execution
    const BATCH_SIZE = 4;
    for (let i = 0; i < selectedRegions.length; i += BATCH_SIZE) {
        const batch = selectedRegions.slice(i, i + BATCH_SIZE);
        const promises = batch.map(region => pingRegion(model, region, maxTokens));
        
        await Promise.all(promises);
        
        // Pass the callback to the Analytics Engine so it can route clicks back to the Map Drawer
        updateExecutiveSummary(currentTelemetryResults, selectedRegions, (regionClicked) => openTelemetryDrawer(regionClicked, currentTelemetryResults));
    }

    // 5. Unlock UI & Resolve Final HUD State
    isRunning = false;
    DOM.btnInitiate.disabled = false;
    DOM.btnInitiate.classList.remove('btn-scanning');
    DOM.btnInitiate.textContent = 'INITIATE PROFILER';
    
    // If the system survived the sweep without hitting limits or offline errors, return to READY
    if (globalSystemHealth === 'SCANNING') {
        globalSystemHealth = 'READY';
        updateSystemStatus(globalSystemHealth);
    }
    
    // 6. Single Scope Auto-Drawer Friction Reduction
    // Automatically pops the telemetry drawer if the operator only targeted one datacenter
    if (scope === 'single' && selectedRegions.length === 1) {
        openTelemetryDrawer(selectedRegions[0], currentTelemetryResults);
    }
});