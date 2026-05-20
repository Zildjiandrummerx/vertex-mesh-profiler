/**
 * ==============================================================================
 * MODULE: MAP RENDERING ENGINE
 * ==============================================================================
 * Responsible for physically painting the geospatial nodes onto the SVG map
 * and dynamically toggling their CSS states (testing, success, error).
 * ==============================================================================
 */

import { DOM } from './dom.js';
import { GEO_MAP } from './config.js';

/**
 * Clears the map and draws new nodes for the selected scope.
 */
export function initMapNodes(regionsArray, onNodeClickCallback) {
    DOM.mapLayer.innerHTML = ''; 
    DOM.drawer.classList.add('hidden');

    regionsArray.forEach(region => {
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
        
        // Triggers the drawer strictly on click
        node.addEventListener('click', () => onNodeClickCallback(region));
        DOM.mapLayer.appendChild(node);
    });
}

/**
 * Modifies the CSS physics of a node (e.g., pulsing blue -> solid green).
 */
export function updateNodeState(region, stateClass) {
    const node = document.getElementById(`node-${region}`);
    if (node) {
        node.classList.remove('state-testing', 'state-success', 'state-error', 'state-warning');
        node.classList.add(`state-${stateClass}`);
    }
}

/**
 * Appends the final Token Velocity (TPS) to the node's visual label.
 */
export function updateNodeLabel(region, text) {
    const label = document.querySelector(`#node-${region} .node-label`);
    if (label) label.textContent = text;
}