/**
 * ==============================================================================
 * MODULE: PERCENTILE HEURISTICS ENGINE
 * ==============================================================================
 * Calculates the Top 33% of datacenters based on Token Velocity (TPS) and 
 * elegantly handles edge cases like Model-as-a-Service hardware deserts.
 * ==============================================================================
 */

import { DOM } from './dom.js';

export function updateExecutiveSummary(currentTelemetryResults, selectedRegions) {
    DOM.listPrimary.innerHTML = '';
    DOM.listSecondary.innerHTML = '';
    DOM.listAnomalies.innerHTML = '';

    const successful = currentTelemetryResults.filter(r => r.success);
    const failures = currentTelemetryResults.filter(r => !r.success);

    // 1. Process Infrastructure Anomalies (Deserts/EULAs)
    if (failures.length > 0) {
        DOM.cardAnomalies.classList.remove('hidden');
        failures.forEach(f => {
            const li = document.createElement('li');
            const shortErr = f.error.split(':')[0] || 'ERROR'; 
            li.innerHTML = `<span>${f.region}</span> <span>${shortErr}</span>`;
            DOM.listAnomalies.appendChild(li);
        });
    } else {
        DOM.cardAnomalies.classList.add('hidden');
    }

    // 2. Process Percentile Engine
    if (successful.length === 0) {
        DOM.listPrimary.innerHTML = '<li class="muted">None</li>';
        DOM.listSecondary.innerHTML = '<li class="muted">None</li>';
        return;
    }

    successful.sort((a, b) => b.tps - a.tps);

    // Detect if we are running a model that ONLY exists on macro-regions (like Claude)
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

    // Render UI Arrays
    if (champions.length > 0) {
        champions.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${c.region}</span> <span class="tps-val">${c.tps} TPS</span>`;
            DOM.listPrimary.appendChild(li);
        });
    } else {
        DOM.listPrimary.innerHTML = '<li class="muted">None</li>';
    }

    if (secondary.length > 0) {
        secondary.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${c.region}</span> <span class="tps-val">${c.tps} TPS</span>`;
            DOM.listSecondary.appendChild(li);
        });
    } else {
        DOM.listSecondary.innerHTML = '<li class="muted">None</li>';
    }
}