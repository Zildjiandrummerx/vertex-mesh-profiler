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

// ==============================================================================
// CONTEXTUAL RUNBOOKS (Error Diagnostics)
// ==============================================================================
// Injected into the telemetry drawer upon capturing specific HTTP fault codes
// to provide operators with immediate, authoritative documentation and context.
const ERROR_CONTEXT = {
    '400': {
        text: "This error is often a 'catch-all' for resource issues. Common reasons a request is rejected before processing include exceeding limits or hardware unavailability.",
        link: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/quotas",
        linkText: "Agent Platform Quotas and Limits"
    },
    '404': {
        text: "The requested model version was not found in this region's local catalog. Specific versions (like -001 or -002) have distinct lifecycles and may not be available in every regional registry even if the parent model is.",
        link: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions",
        linkText: "Agent Platform Model Versions and Lifecycle"
    },
    '501': {
        text: "This error typically occurs when a region is not yet 'onboarded' for Generative AI. The Generative AI Locations page lists exactly which regions support which models. If a region isn't on this list, it will throw a 501.",
        link: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations",
        linkText: "Generative AI on Agent Platform locations"
    }
};

/**
 * Initializes all event listeners for the control panel inputs.
 * @param {object} REGIONS_REGISTRY - The Python-injected geospatial database.
 */
export function initUIBindings(REGIONS_REGISTRY) {
    
    // Updates the DOM state of the region dropdown based on the selected routing scope
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

    // Evaluates model taxonomy to enforce EULA compliance warnings
    DOM.modelSelect.addEventListener('change', () => {
        const selectedOption = DOM.modelSelect.options[DOM.modelSelect.selectedIndex];
        const optgroupLabel = selectedOption.parentElement.label;
        
        // Triggers the compliance warning if a Third-Party or Open-MaaS model is selected
        if (!optgroupLabel.includes('Google Vertex AI')) {
            DOM.eulaWarning.classList.remove('hidden');
        } else {
            DOM.eulaWarning.classList.add('hidden');
        }
    });

    // Mutates slider styling and info-box text to reflect the current load profile
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

    // Invokes the Clipboard API to copy the current REST API path
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
        // Formats generic URLs found within the payload into interactive anchors
        const urlRegex = /(https?:\/\/[^\s"']+)/g;
        let linkedText = data.error.replace(urlRegex, function(url) {
            const cleanUrl = url.replace(/["',]+$/, ''); 
            return `<a href="${cleanUrl}" target="_blank" class="drawer-link">${cleanUrl}</a>`;
        });
        
        // Evaluates HTTP fault codes and injects authoritative documentation context
        let contextHtml = '';
        if (data.error.includes('400')) {
            contextHtml = `<div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);"><strong>Context:</strong> ${ERROR_CONTEXT['400'].text}<br><a href="${ERROR_CONTEXT['400'].link}" target="_blank" class="drawer-link" style="display:inline-block; margin-top:6px;"><i class="fas fa-external-link-alt me-2"></i>${ERROR_CONTEXT['400'].linkText}</a></div>`;
        } else if (data.error.includes('404')) {
            contextHtml = `<div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);"><strong>Context:</strong> ${ERROR_CONTEXT['404'].text}<br><a href="${ERROR_CONTEXT['404'].link}" target="_blank" class="drawer-link" style="display:inline-block; margin-top:6px;"><i class="fas fa-external-link-alt me-2"></i>${ERROR_CONTEXT['404'].linkText}</a></div>`;
        } else if (data.error.includes('501')) {
            contextHtml = `<div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);"><strong>Context:</strong> ${ERROR_CONTEXT['501'].text}<br><a href="${ERROR_CONTEXT['501'].link}" target="_blank" class="drawer-link" style="display:inline-block; margin-top:6px;"><i class="fas fa-external-link-alt me-2"></i>${ERROR_CONTEXT['501'].linkText}</a></div>`;
        }

        DOM.drawerDiagnosis.innerHTML = `<strong>Diagnosis:</strong> ${linkedText} ${contextHtml}`;
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