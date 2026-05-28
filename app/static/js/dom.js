/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: DOM ELEMENT CACHE
 * ==============================================================================
 * Centralized cache for all DOM elements to prevent redundant querying 
 * and drastically improve JavaScript rendering performance.
 * ==============================================================================
 */

export const DOM = {
    // Inputs & Controls
    scopeRadios: document.querySelectorAll('input[name="scope"]'),
    regionSelect: document.getElementById('region-select'),
    tokenSlider: document.getElementById('token-slider'),
    tokenDisplay: document.getElementById('token-display'),
    profileExplanation: document.getElementById('profile-explanation'),
    btnInitiate: document.getElementById('btn-initiate'),
    modelSelect: document.getElementById('model-select'),
    
    // Header & HUD
    systemStatusText: document.getElementById('system-status-text'),
    
    // Map Engine
    mapLayer: document.getElementById('geo-nodes-layer'),
    
    // Telemetry Drawer
    drawer: document.getElementById('telemetry-drawer'),
    drawerClose: document.getElementById('close-drawer'),
    drawerRegionName: document.getElementById('drawer-region-name'),
    drawerTps: document.getElementById('drawer-tps'),
    drawerMin: document.getElementById('drawer-min'),
    drawerAvg: document.getElementById('drawer-avg'),
    drawerUrl: document.getElementById('drawer-url'),
    drawerDiagnosis: document.getElementById('drawer-diagnosis'),
    btnCopyUrl: document.getElementById('btn-copy-url'),
    
    // Executive Summary / Analytics
    listPrimary: document.getElementById('list-primary'),
    listSecondary: document.getElementById('list-secondary'),
    listAnomalies: document.getElementById('list-anomalies'),
    cardAnomalies: document.getElementById('card-anomalies')
};