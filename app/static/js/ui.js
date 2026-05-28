/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: USER INTERFACE PHYSICS
 * ==============================================================================
 * Manages all tactile UX elements including the dynamic slider colors, 
 * the scope radio buttons, the clipboard API, and the telemetry drawer states.
 * ==============================================================================
 */

import { DOM } from './dom.js';

/**
 * Initializes all event listeners for the control panel inputs.
 * @param {object} REGIONS_REGISTRY - The Python-injected geospatial database.
 */
export function initUIBindings(REGIONS_REGISTRY) {
    
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
    updateRegionDropdown();

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

    DOM.drawerClose.addEventListener('click', () => {
        DOM.drawer.classList.add('hidden');
    });

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
 * @param {string} region - The targeted datacenter.
 * @param {Array} currentTelemetryResults - The master state array.
 */
export function openTelemetryDrawer(region, currentTelemetryResults) {
    const data = currentTelemetryResults.find(r => r.region === region);
    if (!data) return; 

    DOM.drawerRegionName.textContent = region;
    DOM.drawerTps.textContent = data.success ? data.tps : 'FAIL';
    DOM.drawerMin.textContent = data.success ? `${data.min}s` : '--';
    DOM.drawerAvg.textContent = data.success ? `${data.avg}s` : '--';
    DOM.drawerUrl.value = data.url;

    if (!data.success) {
        const urlRegex = /(https?:\/\/[^\s"']+)/g;
        let linkedText = data.error.replace(urlRegex, function(url) {
            const cleanUrl = url.replace(/["',]+$/, ''); 
            return `<a href="${cleanUrl}" target="_blank" class="drawer-link">${cleanUrl}</a>`;
        });
        DOM.drawerDiagnosis.innerHTML = `Diagnosis: ${linkedText}`;
        DOM.drawerDiagnosis.classList.remove('hidden');
    } else {
        DOM.drawerDiagnosis.classList.add('hidden');
    }

    DOM.drawer.classList.remove('hidden');
}

/**
 * Manages the color and messaging of the Header System Status HUD.
 * @param {string} status - The system state enumeration.
 */
export function updateSystemStatus(status) {
    switch(status) {
        case 'READY':
            DOM.systemStatusText.textContent = 'READY';
            DOM.systemStatusText.style.color = 'var(--highlight)';
            break;
        case 'SCANNING':
            DOM.systemStatusText.textContent = 'SCANNING MESH...';
            DOM.systemStatusText.style.color = 'var(--warning-text)';
            break;
        case 'RATE_LIMITED':
            DOM.systemStatusText.textContent = 'RATE LIMITED';
            DOM.systemStatusText.style.color = 'var(--error-text)';
            break;
        case 'OFFLINE':
            DOM.systemStatusText.textContent = 'OFFLINE (CHECK LOGS)';
            DOM.systemStatusText.style.color = 'var(--error-text)';
            break;
    }
}