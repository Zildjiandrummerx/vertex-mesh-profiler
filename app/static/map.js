/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: MAP RENDERING ENGINE
 * ==============================================================================
 * Responsible for the real-time DOM manipulation of the geospatial map overlay.
 * Handles the instantiation of routing nodes, lifecycle state transitions, 
 * and data binding for the visual telemetry labels.
 * ==============================================================================
 */

import { DOM } from './dom.js';
import { GEO_MAP } from './config.js';

/**
 * Initializes the geospatial overlay by clearing existing artifacts and 
 * rendering fresh DOM elements based on the operator's targeted scope.
 * 
 * @param {Array<string>} regionsArray - The list of datacenters to render.
 * @param {Function} onNodeClickCallback - Triggered to invoke the telemetry drawer.
 */
export function initMapNodes(regionsArray, onNodeClickCallback) {
    // Purge the previous rendering cycle and hide existing UI overlays
    DOM.mapLayer.innerHTML = ''; 
    DOM.drawer.classList.add('hidden');

    regionsArray.forEach(region => {
        // Retrieve the calibrated CSS percentages, defaulting to absolute center
        const coords = GEO_MAP[region] || { x: 50, y: 50 }; 
        
        const node = document.createElement('div');
        node.className = 'geo-node';
        node.id = `node-${region}`;
        node.style.left = `${coords.x}%`;
        node.style.top = `${coords.y}%`;
        
        node.innerHTML = `
            <div class="node-dot"></div>
            <div class="node-label">${region}</div>
        `;
        
        // Bind the interactive telemetry callback to the physical node
        node.addEventListener('click', () => onNodeClickCallback(region));
        DOM.mapLayer.appendChild(node);
    });
}

/**
 * Mutates the CSS state of a specific datacenter node to visually reflect
 * its current lifecycle phase during the asynchronous API execution.
 * 
 * @param {string} region - The unique identifier of the datacenter.
 * @param {string} stateClass - The target lifecycle state (testing, success, error, warning).
 */
export function updateNodeState(region, stateClass) {
    const node = document.getElementById(`node-${region}`);
    if (node) {
        // Strip existing lifecycle states to prevent CSS class collisions
        node.classList.remove('state-testing', 'state-success', 'state-error', 'state-warning');
        node.classList.add(`state-${stateClass}`);
    }
}

/**
 * Appends diagnostic metrics directly to the node's visual label upon 
 * the successful completion of an execution cycle.
 * 
 * @param {string} region - The unique identifier of the datacenter.
 * @param {string} text - The formatted string to display (e.g., 'us-central1 [45.2 TPS]').
 */
export function updateNodeLabel(region, text) {
    const label = document.querySelector(`#node-${region} .node-label`);
    if (label) {
        label.textContent = text;
    }
}