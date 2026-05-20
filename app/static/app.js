/**
 * ==============================================================================
 * VERTEX AI MESH PROFILER - FRONTEND ORCHESTRATOR
 * ==============================================================================
 * This Vanilla JS module governs the interactive Web UI. It handles DOM 
 * manipulation, asynchronous API fetching, state management for the SVG 
 * geospatial nodes, and dynamic percentile-based summary rendering.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. STATE & CONFIGURATION
    // ==========================================================================
    
    // Parse the Python dictionary injected into the DOM via Jinja2
    const regionsDataRaw = document.getElementById('regions-data').textContent;
    const REGIONS_REGISTRY = JSON.parse(regionsDataRaw);

    // Recalibrated Geospatial coordinates (X, Y percentages) for rendering nodes.
    // Artificially spread out to prevent overlapping in dense regions (EU / US East).
    const GEO_MAP = {
        // Macro-Regions (Control Plane)
        // Moved 'global' to the deep Pacific Ocean (top left) to act as a distinct routing node
        'global': { x: 10, y: 15 },
        'us': { x: 25, y: 20 },
        'eu': { x: 55, y: 15 },
        
        // North America
        'us-west1': { x: 14, y: 30 }, 'us-west2': { x: 14, y: 36 }, 'us-west3': { x: 17, y: 32 },
        'us-west4': { x: 18, y: 36 }, 'us-central1': { x: 23, y: 32 }, 'us-south1': { x: 23, y: 40 },
        'us-east1': { x: 28, y: 35 }, 'us-east4': { x: 29, y: 32 }, 'us-east5': { x: 26, y: 31 },
        'northamerica-northeast1': { x: 31, y: 25 }, 'northamerica-northeast2': { x: 28, y: 27 },
        
        // Europe
        'europe-north1': { x: 55, y: 20 }, 'europe-west4': { x: 49, y: 25 }, 'europe-west1': { x: 48, y: 28 },
        'europe-west2': { x: 45, y: 26 }, 'europe-west9': { x: 47, y: 31 }, 'europe-southwest1': { x: 44, y: 36 },
        'europe-west3': { x: 51, y: 29 }, 'europe-west6': { x: 50, y: 32 }, 'europe-west12': { x: 52, y: 34 },
        'europe-west8': { x: 54, y: 35 }, 'europe-central2': { x: 55, y: 27 },
        
        // Asia Pacific
        'asia-south1': { x: 68, y: 46 }, 'asia-south2': { x: 70, y: 42 },
        'asia-southeast1': { x: 76, y: 55 }, 'asia-southeast2': { x: 78, y: 60 },
        'asia-east1': { x: 80, y: 44 }, 'asia-east2': { x: 78, y: 42 },
        // Shifted NE Asia cluster further left onto the coast
        'asia-northeast1': { x: 82, y: 31 }, 'asia-northeast2': { x: 80, y: 34 }, 'asia-northeast3': { x: 77, y: 32 },
        
        // Australia
        // Aligned Australia nodes perfectly horizontally and shifted up
        'australia-southeast1': { x: 85, y: 75 }, 'australia-southeast2': { x: 88, y: 75 },
        
        // Middle East & Africa
        'me-central1': { x: 64, y: 44 }, 'me-central2': { x: 62, y: 46 }, 'me-west1': { x: 60, y: 42 },
        // Shifted Africa UP
        'africa-south1': { x: 54, y: 62 },
        
        // South America
        // Shifted SA East and West UP to align with the continent
        'southamerica-east1': { x: 34, y: 60 }, 'southamerica-west1': { x: 29, y: 64 }
    };

    // State aggregator for the current run
    let currentTelemetryResults = [];
    let isRunning = false;

    // DOM Elements
    const dom = {
        scopeRadios: document.querySelectorAll('input[name="scope"]'),
        regionSelect: document.getElementById('region-select'),
        tokenSlider: document.getElementById('token-slider'),
        tokenDisplay: document.getElementById('token-display'),
        profileExplanation: document.getElementById('profile-explanation'),
        btnInitiate: document.getElementById('btn-initiate'),
        mapLayer: document.getElementById('geo-nodes-layer'),
        drawer: document.getElementById('telemetry-drawer'),
        drawerClose: document.getElementById('close-drawer')
    };

    // ==========================================================================
    // 2. UI EVENT LISTENERS & PHYSICS ENGINE
    // ==========================================================================

    // Handle Regional Scope toggling (Single vs Group vs Sweep)
    function updateRegionDropdown() {
        const scope = document.querySelector('input[name="scope"]:checked').value;
        dom.regionSelect.innerHTML = '';
        dom.regionSelect.disabled = false;

        if (scope === 'single') {
            // Flatten all regions
            const allRegions = Object.values(REGIONS_REGISTRY).flat();
            allRegions.forEach(r => dom.regionSelect.add(new Option(r, r)));
        } else if (scope === 'group') {
            // Show Macro Groups
            Object.keys(REGIONS_REGISTRY).forEach(g => dom.regionSelect.add(new Option(g, g)));
        } else if (scope === 'sweep') {
            // Lock the dropdown
            dom.regionSelect.add(new Option("Worldwide Matrix Scan Locked", "sweep"));
            dom.regionSelect.disabled = true;
        }
    }

    dom.scopeRadios.forEach(radio => radio.addEventListener('change', updateRegionDropdown));
    updateRegionDropdown(); // Initialize

    // Handle Dynamic Load Profile (The Edges)
    dom.tokenSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        
        // Reset classes
        dom.profileExplanation.className = 'info-box';
        
        if (val <= 50) {
            // Tier 1: White
            dom.tokenDisplay.textContent = val;
            dom.tokenDisplay.style.color = '#ffffff';
            dom.tokenSlider.style.accentColor = '#ffffff'; // Updates the slider thumb/track
            dom.profileExplanation.classList.add('diagnostic-box');
            dom.profileExplanation.innerHTML = `<strong>Diagnostic Ping</strong><br>Measuring Network Latency and TTFT. Sustained TPS will appear mathematically lower due to handshake overhead.`;
        } else if (val <= 500) {
            // Tier 2: Neon Green
            dom.tokenDisplay.textContent = val;
            dom.tokenDisplay.style.color = 'var(--highlight)';
            dom.tokenSlider.style.accentColor = 'var(--highlight)';
            dom.profileExplanation.classList.add('standard-box');
            dom.profileExplanation.innerHTML = `<strong>Standard Payload</strong><br>Forcing moderate computational load. Provides a balanced measurement of real-world API responsiveness and sustained Token Velocity (TPS).`;
        } else {
            // Tier 3: Yellow
            dom.tokenDisplay.textContent = val;
            dom.tokenDisplay.style.color = 'var(--warning-text)';
            dom.tokenSlider.style.accentColor = 'var(--warning-text)';
            dom.profileExplanation.classList.add('stress-box');
            dom.profileExplanation.innerHTML = `<strong>Stress Test</strong><br>Injecting complex prompt to force maximum GPU/TPU utilization. Exposes absolute sustained Token Velocity (TPS) and hardware throttling limits.`;
        }
    });

    // Handle Drawer Close
    dom.drawerClose.addEventListener('click', () => {
        dom.drawer.classList.add('hidden');
    });

    // ==========================================================================
    // 3. MAP RENDERING ENGINE
    // ==========================================================================

    function initMapNodes(regionsArray) {
        dom.mapLayer.innerHTML = ''; // Clear previous map
        dom.drawer.classList.add('hidden');

        regionsArray.forEach(region => {
            const coords = GEO_MAP[region] || { x: 50, y: 50 }; // Fallback to center if missing
            
            const node = document.createElement('div');
            node.className = 'geo-node';
            node.id = `node-${region}`;
            node.style.left = `${coords.x}%`;
            node.style.top = `${coords.y}%`;
            
            node.innerHTML = `
                <div class="node-dot"></div>
                <div class="node-label">${region}</div>
            `;
            
            // Add hover listener for detailed telemetry drawer
            node.addEventListener('mouseenter', () => openTelemetryDrawer(region));
            dom.mapLayer.appendChild(node);
        });
    }

    function updateNodeState(region, stateClass) {
        const node = document.getElementById(`node-${region}`);
        if (node) {
            // Remove previous state classes
            node.classList.remove('state-testing', 'state-success', 'state-error', 'state-warning');
            node.classList.add(`state-${stateClass}`);
        }
    }

    function openTelemetryDrawer(region) {
        const data = currentTelemetryResults.find(r => r.region === region);
        if (!data) return; // Node hasn't been tested yet

        document.getElementById('drawer-region-name').textContent = region;
        document.getElementById('drawer-tps').textContent = data.success ? data.tps : 'FAIL';
        document.getElementById('drawer-min').textContent = data.success ? `${data.min}s` : '--';
        document.getElementById('drawer-avg').textContent = data.success ? `${data.avg}s` : '--';
        document.getElementById('drawer-url').value = data.url;

        const diagBox = document.getElementById('drawer-diagnosis');
        if (!data.success) {
            // UX FIX: Regex to wrap URLs inside the raw error payload into clickable anchor tags
            const urlRegex = /(https?:\/\/[^\s"']+)/g;
            let linkedText = data.error.replace(urlRegex, function(url) {
                const cleanUrl = url.replace(/["',]+$/, ''); // Strip trailing punctuation
                return `<a href="${cleanUrl}" target="_blank" class="drawer-link">${cleanUrl}</a>`;
            });
            diagBox.innerHTML = `Diagnosis: ${linkedText}`;
            diagBox.classList.remove('hidden');
        } else {
            diagBox.classList.add('hidden');
        }

        dom.drawer.classList.remove('hidden');
    }

    // Copy URL to Clipboard
    const btnCopy = document.getElementById('btn-copy-url');
    btnCopy.addEventListener('click', () => {
        const urlInput = document.getElementById('drawer-url');
        navigator.clipboard.writeText(urlInput.value).then(() => {
            // Visual feedback
            btnCopy.innerHTML = '<i class="fas fa-check"></i>';
            btnCopy.style.color = 'var(--highlight)';
            setTimeout(() => {
                btnCopy.innerHTML = '<i class="fas fa-copy"></i>';
                btnCopy.style.color = 'var(--muted-color)';
            }, 2000);
        });
    });

    // ==========================================================================
    // 4. API ORCHESTRATION & CONCURRENCY
    // ==========================================================================

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
            
            // Store result for Executive Summary
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

            // Update node physics based on strict HTTP error profiling
            if (result.success) {
                updateNodeState(region, 'success');
                // Dynamically append the TPS to the map label
                const label = document.querySelector(`#node-${region} .node-label`);
                if (label) label.textContent = `${region} [${telemetryObj.tps} TPS]`;
            } else {
                // If it's a 4xx, it's a hard error (Red). If it's 5xx, it's a warning (Yellow).
                const state = result.error.includes('50') ? 'warning' : 'error';
                updateNodeState(region, state);
            }

        } catch (error) {
            console.error(`Fetch failed for ${region}:`, error);
            updateNodeState(region, 'error');
        }
    }

    // ==========================================================================
    // 5. EXECUTIVE SUMMARY (Percentile Heuristics)
    // ==========================================================================

    function updateExecutiveSummary(selectedRegions) {
        const listPrimary = document.getElementById('list-primary');
        const listSecondary = document.getElementById('list-secondary');
        const listAnomalies = document.getElementById('list-anomalies');
        const cardAnomalies = document.getElementById('card-anomalies');

        listPrimary.innerHTML = '';
        listSecondary.innerHTML = '';
        listAnomalies.innerHTML = '';

        const successful = currentTelemetryResults.filter(r => r.success);
        const failures = currentTelemetryResults.filter(r => !r.success);

        // 1. Process Anomalies
        if (failures.length > 0) {
            cardAnomalies.classList.remove('hidden');
            failures.forEach(f => {
                const li = document.createElement('li');
                // Extract just the HTTP code for brevity
                const shortErr = f.error.split(':')[0] || 'ERROR'; 
                li.innerHTML = `<span>${f.region}</span> <span>${shortErr}</span>`;
                listAnomalies.appendChild(li);
            });
        } else {
            cardAnomalies.classList.add('hidden');
        }

        // 2. Process Percentile Engine
        if (successful.length === 0) {
            listPrimary.innerHTML = '<li class="muted">None</li>';
            listSecondary.innerHTML = '<li class="muted">None</li>';
            return;
        }

        // Sort by TPS descending
        successful.sort((a, b) => b.tps - a.tps);

        // UI FIX: Detect if we are running a model that ONLY exists on macro-regions (like Claude)
        const isMacroOnly = selectedRegions.every(r => ['global', 'us', 'eu'].includes(r));
        const standardSuccessful = successful.filter(h => !['global', 'us', 'eu'].includes(h.region));
        
        let hubsToRank = [];
        
        // Architectural Fix: If physical standard datacenters successfully responded, rank them.
        // If ALL standard datacenters failed (Regional Desert), fallback to ranking the Macro-regions.
        if (standardSuccessful.length > 0) {
            hubsToRank = isMacroOnly ? successful : standardSuccessful;
        } else {
            hubsToRank = successful; 
        }
        
        // Math: Top 33% (Minimum 1)
        const topN = hubsToRank.length > 1 ? Math.max(1, Math.floor(hubsToRank.length / 3)) : 1;

        let champions = [];
        let secondary = [];

        hubsToRank.forEach((hub, index) => {
            if (index < topN) champions.push(hub);
            else secondary.push(hub);
        });

        // Render Champions
        if (champions.length > 0) {
            champions.forEach(c => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${c.region}</span> <span class="tps-val">${c.tps} TPS</span>`;
                listPrimary.appendChild(li);
            });
        } else {
            listPrimary.innerHTML = '<li class="muted">None</li>';
        }

        // Render Secondary
        if (secondary.length > 0) {
            secondary.forEach(c => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${c.region}</span> <span class="tps-val">${c.tps} TPS</span>`;
                listSecondary.appendChild(li);
            });
        } else {
            listSecondary.innerHTML = '<li class="muted">None</li>';
        }
    }

    // ==========================================================================
    // 6. EXECUTION PIPELINE
    // ==========================================================================

    dom.btnInitiate.addEventListener('click', async () => {
        if (isRunning) return;
        
        // 1. Gather Inputs
        const model = document.getElementById('model-select').value;
        const scope = document.querySelector('input[name="scope"]:checked').value;
        const maxTokens = parseInt(dom.tokenSlider.value);
        let selectedRegions = [];

        if (scope === 'single') {
            selectedRegions.push(dom.regionSelect.value);
        } else if (scope === 'group') {
            const groupName = dom.regionSelect.value;
            selectedRegions = REGIONS_REGISTRY[groupName];
        } else {
            selectedRegions = Object.values(REGIONS_REGISTRY).flat();
        }

        // Deduplicate
        selectedRegions = [...new Set(selectedRegions)];

        // 2. Lock UI & Animate Button
        isRunning = true;
        dom.btnInitiate.disabled = true;
        dom.btnInitiate.classList.add('btn-scanning');
        dom.btnInitiate.textContent = 'SCANNING MESH...';
        currentTelemetryResults = [];
        
        // 3. Setup Map
        initMapNodes(selectedRegions);

        // 4. Batch Execution (Concurrency Control)
        // We ping 4 datacenters simultaneously to speed up global sweeps 
        // without tripping anti-DDoS firewalls.
        const BATCH_SIZE = 4;
        for (let i = 0; i < selectedRegions.length; i += BATCH_SIZE) {
            const batch = selectedRegions.slice(i, i + BATCH_SIZE);
            const promises = batch.map(region => pingRegion(model, region, maxTokens));
            
            // Wait for the current batch of 4 to finish before starting the next 4
            await Promise.all(promises);
            
            // Update the Executive Summary incrementally
            updateExecutiveSummary(selectedRegions);
        }

        // 5. Unlock UI & Stop Animation
        isRunning = false;
        dom.btnInitiate.disabled = false;
        dom.btnInitiate.classList.remove('btn-scanning');
        dom.btnInitiate.textContent = 'INITIATE PROFILER';
    });

});