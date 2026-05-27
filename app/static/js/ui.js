/**
 * ==============================================================================
 * MODULE: USER INTERFACE PHYSICS
 * ==============================================================================
 * Manages all tactile UX elements including the dynamic slider colors, 
 * the scope radio buttons, the clipboard API, and the telemetry drawer states.
 * ==============================================================================
 */

import { DOM } from './dom.js';

/**
 * Initializes all event listeners for the control panel inputs.
 */
export function initUIBindings(REGIONS_REGISTRY) {
    
    // 1. Regional Scope Dropdown Logic
    function updateRegionDropdown() {
        const scope = document.querySelector('input[name="scope"]:checked').value;
        DOM.regionSelect.innerHTML = '';
        DOM.regionSelect.disabled = false;

        if (scope === 'single') {
            const allRegions = Object.values(REGIONS_REGISTRY).flat();
            allRegions.forEach(r => DOM.regionSelect.add(new Option(r, r)));
        } else if (scope === 'group') {
            Object.keys(REGIONS_REGISTRY).forEach(g => DOM.regionSelect.add(new Option(g, g)));
        } else if (scope === 'sweep') {
            DOM.regionSelect.add(new Option("Worldwide Matrix Scan Locked", "sweep"));
            DOM.regionSelect.disabled = true;
        }
    }

    DOM.scopeRadios.forEach(radio => radio.addEventListener('change', updateRegionDropdown));
    updateRegionDropdown(); // Initialize state

    // 2. Dynamic Load Profile Slider (The Edges)
    DOM.tokenSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        DOM.profileExplanation.className = 'info-box';
        
        if (val <= 50) {
            DOM.tokenDisplay.textContent = val;
            DOM.tokenDisplay.style.color = '#ffffff';
            DOM.tokenSlider.style.accentColor = '#ffffff';
            DOM.profileExplanation.classList.add('diagnostic-box');
            DOM.profileExplanation.innerHTML = `<strong>Diagnostic Ping</strong><br>Measuring Network Latency and TTFT. Sustained TPS will appear mathematically lower due to handshake overhead.`;
        } else if (val <= 500) {
            DOM.tokenDisplay.textContent = val;
            DOM.tokenDisplay.style.color = 'var(--highlight)';
            DOM.tokenSlider.style.accentColor = 'var(--highlight)';
            DOM.profileExplanation.classList.add('standard-box');
            DOM.profileExplanation.innerHTML = `<strong>Standard Payload</strong><br>Forcing moderate computational load. Provides a balanced measurement of real-world API responsiveness and sustained Token Velocity (TPS).`;
        } else {
            DOM.tokenDisplay.textContent = val;
            DOM.tokenDisplay.style.color = 'var(--warning-text)';
            DOM.tokenSlider.style.accentColor = 'var(--warning-text)';
            DOM.profileExplanation.classList.add('stress-box');
            DOM.profileExplanation.innerHTML = `<strong>Stress Test</strong><br>Injecting complex prompt to force maximum GPU/TPU utilization. Exposes absolute sustained Token Velocity (TPS) and hardware throttling limits.`;
        }
    });

    // 3. Telemetry Drawer Close Button
    DOM.drawerClose.addEventListener('click', () => {
        DOM.drawer.classList.add('hidden');
    });

    // 4. Copy API URL to Clipboard
    DOM.btnCopyUrl.addEventListener('click', () => {
        navigator.clipboard.writeText(DOM.drawerUrl.value).then(() => {
            DOM.btnCopyUrl.innerHTML = '<i class="fas fa-check"></i>';
            DOM.btnCopyUrl.style.color = 'var(--highlight)';
            setTimeout(() => {
                DOM.btnCopyUrl.innerHTML = '<i class="fas fa-copy"></i>';
                DOM.btnCopyUrl.style.color = 'var(--muted-color)';
            }, 2000);
        });
    });
}

/**
 * Parses telemetry data and populates the slide-up UI Drawer.
 */
export function openTelemetryDrawer(region, currentTelemetryResults) {
    const data = currentTelemetryResults.find(r => r.region === region);
    if (!data) return; // Node hasn't completed testing yet

    DOM.drawerRegionName.textContent = region;
    DOM.drawerTps.textContent = data.success ? data.tps : 'FAIL';
    DOM.drawerMin.textContent = data.success ? `${data.min}s` : '--';
    DOM.drawerAvg.textContent = data.success ? `${data.avg}s` : '--';
    DOM.drawerUrl.value = data.url;

    if (!data.success) {
        // Regex to wrap URLs inside the raw error payload into clickable anchor tags
        const urlRegex = /(https?:\/\/[^\s"']+)/g;
        let linkedText = data.error.replace(urlRegex, function(url) {
            const cleanUrl = url.replace(/["',]+$/, ''); // Strip trailing punctuation
            return `<a href="${cleanUrl}" target="_blank" class="drawer-link">${cleanUrl}</a>`;
        });
        DOM.drawerDiagnosis.innerHTML = `Diagnosis: ${linkedText}`;
        DOM.drawerDiagnosis.classList.remove('hidden');
    } else {
        DOM.drawerDiagnosis.classList.add('hidden');
    }

    DOM.drawer.classList.remove('hidden');
}