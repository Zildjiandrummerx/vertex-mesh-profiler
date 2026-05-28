/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: DOM ELEMENT CACHE
 * ==============================================================================
 * Centralized cache for all parsed DOM elements. 
 * Prevents redundant querying of the Document Object Model during high-frequency 
 * orchestration events, significantly reducing memory overhead and improving 
 * JavaScript rendering performance.
 * ==============================================================================
 */

export const DOM = {
    // ==========================================================================
    // INPUTS & CONTROLS (Column 1)
    // Caches interactive elements required for parameter configuration and payload generation.
    // ==========================================================================
    scopeRadios: document.querySelectorAll('input[name="scope"]'),
    regionSelect: document.getElementById('region-select'),
    tokenSlider: document.getElementById('token-slider'),
    tokenDisplay: document.getElementById('token-display'),
    profileExplanation: document.getElementById('profile-explanation'),
    eulaWarning: document.getElementById('eula-warning'),
    btnInitiate: document.getElementById('btn-initiate'),
    modelSelect: document.getElementById('model-select'),
    
    // ==========================================================================
    // HEADER & HUD
    // Caches elements required for real-time system state and diagnostic telemetry.
    // ==========================================================================
    systemStatusText: document.getElementById('system-status-text'),
    
    // ==========================================================================
    // MAP ENGINE (Column 2)
    // Caches the primary coordinate layer for dynamic node injection.
    // ==========================================================================
    mapLayer: document.getElementById('geo-nodes-layer'),
    
    // ==========================================================================
    // TELEMETRY DRAWER (Column 2 Overlay)
    // Caches the interactive popover elements used to display granular HTTP responses.
    // ==========================================================================
    drawer: document.getElementById('telemetry-drawer'),
    drawerClose: document.getElementById('close-drawer'),
    drawerRegionName: document.getElementById('drawer-region-name'),
    drawerTps: document.getElementById('drawer-tps'),
    drawerMin: document.getElementById('drawer-min'),
    drawerAvg: document.getElementById('drawer-avg'),
    drawerUrl: document.getElementById('drawer-url'),
    drawerDiagnosis: document.getElementById('drawer-diagnosis'),
    btnCopyUrl: document.getElementById('btn-copy-url'),
    
    // ==========================================================================
    // EXECUTIVE SUMMARY / ANALYTICS (Column 3)
    // Caches the list containers used by the Percentile Heuristics Engine.
    // ==========================================================================
    listPrimary: document.getElementById('list-primary'),
    listSecondary: document.getElementById('list-secondary'),
    listAnomalies: document.getElementById('list-anomalies'),
    cardAnomalies: document.getElementById('card-anomalies')
};