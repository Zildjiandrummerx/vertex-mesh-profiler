/**
 * ==============================================================================
 * VERTEX AI MESH PROFILER - MASTER ORCHESTRATOR (ES6)
 * ==============================================================================
 * The primary entry point. Coordinates the UI, Map, and Analytics modules, 
 * and executes the asynchronous concurrency pipeline against the Flask API.
 * ==============================================================================
 */

import { getRegionsRegistry } from './config.js';
import { DOM } from './dom.js';
import { initUIBindings, openTelemetryDrawer } from './ui.js';
import { initMapNodes, updateNodeState, updateNodeLabel } from './map.js';
import { updateExecutiveSummary } from './analytics.js';
import { initCameraPhysics } from './camera.js'; 

// ==============================================================================
// GLOBAL STATE
// ==============================================================================
const REGIONS_REGISTRY = getRegionsRegistry();
let currentTelemetryResults = [];
let isRunning = false;

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
        console.error(`Fetch failed for ${region}:`, error);
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

    // Deduplicate
    selectedRegions = [...new Set(selectedRegions)];

    // 2. Lock UI & Animate Button
    isRunning = true;
    DOM.btnInitiate.disabled = true;
    DOM.btnInitiate.classList.add('btn-scanning');
    DOM.btnInitiate.textContent = 'SCANNING MESH...';
    currentTelemetryResults = [];
    
    // 3. Setup Map (Passing the UI drawer callback to prevent circular dependencies)
    initMapNodes(selectedRegions, (regionClicked) => openTelemetryDrawer(regionClicked, currentTelemetryResults));

    // 4. Batch Execution (Concurrency Control)
    const BATCH_SIZE = 4;
    for (let i = 0; i < selectedRegions.length; i += BATCH_SIZE) {
        const batch = selectedRegions.slice(i, i + BATCH_SIZE);
        const promises = batch.map(region => pingRegion(model, region, maxTokens));
        
        await Promise.all(promises);
        updateExecutiveSummary(currentTelemetryResults, selectedRegions);
    }

    // 5. Unlock UI & Stop Animation
    isRunning = false;
    DOM.btnInitiate.disabled = false;
    DOM.btnInitiate.classList.remove('btn-scanning');
    DOM.btnInitiate.textContent = 'INITIATE PROFILER';
});