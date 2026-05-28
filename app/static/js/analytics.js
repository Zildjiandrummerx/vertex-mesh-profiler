/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: PERCENTILE HEURISTICS ENGINE
 * ==============================================================================
 * Calculates the Top 33% of datacenters based on Token Velocity (TPS) and 
 * elegantly handles edge cases like Model-as-a-Service hardware deserts.
 * Binds cross-component routing to invoke the geospatial telemetry drawer on click.
 * ==============================================================================
 */

import { DOM } from './dom.js';

/**
 * Computes rendering arrays and injects interactive DOM nodes.
 * @param {Array} currentTelemetryResults - The master state array.
 * @param {Array} selectedRegions - The full scope of targeted hubs.
 * @param {Function} onNodeClickCallback - Triggered to route clicks back to the Map drawer.
 */
export function updateExecutiveSummary(currentTelemetryResults, selectedRegions, onNodeClickCallback) {
    DOM.listPrimary.innerHTML = '';
    DOM.listSecondary.innerHTML = '';
    DOM.listAnomalies.innerHTML = '';

    const successful = currentTelemetryResults.filter(r => r.success);
    const failures = currentTelemetryResults.filter(r => !r.success);

    // ==========================================================================
    // 1. PROCESS INFRASTRUCTURE ANOMALIES (Deserts/EULAs)
    // ==========================================================================
    if (failures.length > 0) {
        DOM.cardAnomalies.classList.remove('hidden');
        failures.forEach(f => {
            const li = document.createElement('li');
            
            // Applies CSS Grid formatting to prevent text wrapping, and enables hover interactivity
            li.className = 'anomaly-item interactive-item';
            
            const shortErr = f.error.split(':')[0] || 'ERROR'; 
            li.innerHTML = `<span>${f.region}</span> <span>${shortErr}</span>`;
            
            // Binds cross-component routing back to the central map
            li.addEventListener('click', () => onNodeClickCallback(f.region));
            DOM.listAnomalies.appendChild(li);
        });
    } else {
        DOM.cardAnomalies.classList.add('hidden');
    }

    // ==========================================================================
    // 2. PROCESS PERCENTILE ENGINE
    // ==========================================================================
    if (successful.length === 0) {
        DOM.listPrimary.innerHTML = '<li class="muted">None</li>';
        DOM.listSecondary.innerHTML = '<li class="muted">None</li>';
        return;
    }

    // Sort by Token Velocity (TPS) descending
    successful.sort((a, b) => b.tps - a.tps);

    // Evaluates if the current model payload is strictly confined to macro-regions 
    // (e.g., Partner Models like Anthropic Claude).
    const isMacroOnly = selectedRegions.every(r => ['global', 'us', 'eu'].includes(r));
    const standardSuccessful = successful.filter(h => !['global', 'us', 'eu'].includes(h.region));
    
    let hubsToRank = [];
    
    // Architectural Routing: Prioritizes ranking physical standard datacenters. 
    // If a complete Regional Desert is detected (all standard datacenters fail), 
    // the engine gracefully falls back to ranking the operational Macro-regions.
    if (standardSuccessful.length > 0) {
        hubsToRank = isMacroOnly ? successful : standardSuccessful;
    } else {
        hubsToRank = successful; 
    }
    
    // Mathematics: Extracts the Top 33% (Ensuring a minimum of 1 Champion Hub)
    const topN = hubsToRank.length > 1 ? Math.max(1, Math.floor(hubsToRank.length / 3)) : 1;

    let champions = [];
    let secondary = [];

    hubsToRank.forEach((hub, index) => {
        if (index < topN) champions.push(hub);
        else secondary.push(hub);
    });

    // ==========================================================================
    // 3. RENDER UI ARRAYS
    // ==========================================================================
    
    if (champions.length > 0) {
        champions.forEach(c => {
            const li = document.createElement('li');
            li.className = 'interactive-item';
            li.innerHTML = `<span>${c.region}</span> <span class="tps-val">${c.tps} TPS</span>`;
            li.addEventListener('click', () => onNodeClickCallback(c.region));
            DOM.listPrimary.appendChild(li);
        });
    } else {
        DOM.listPrimary.innerHTML = '<li class="muted">None</li>';
    }

    if (secondary.length > 0) {
        secondary.forEach(c => {
            const li = document.createElement('li');
            li.className = 'interactive-item';
            li.innerHTML = `<span>${c.region}</span> <span class="tps-val">${c.tps} TPS</span>`;
            li.addEventListener('click', () => onNodeClickCallback(c.region));
            DOM.listSecondary.appendChild(li);
        });
    } else {
        DOM.listSecondary.innerHTML = '<li class="muted">None</li>';
    }
}