/**
 * ==============================================================================
 * MODULE: MAP RENDERING ENGINE (CALIBRATION MODE)
 * ==============================================================================
 * TEMPORARY GOD-MODE: Drag and drop nodes to find their exact X/Y coordinates.
 * ==============================================================================
 */

import { DOM } from './dom.js';
import { GEO_MAP } from './config.js';

let draggedNode = null;

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
        // Temporarily disable CSS transitions so the dot follows the mouse instantly
        node.style.transition = 'none'; 
        node.style.cursor = 'grab';
        node.style.zIndex = '100'; // Keep it above others while dragging
        
        // The label instantly shows the code format you need
        node.innerHTML = `
            <div class="node-dot" style="background-color: #fdbb2d; border-color: #fff; box-shadow: 0 0 10px #fdbb2d;"></div>
            <div class="node-label" id="label-${region}">'${region}': { x: ${coords.x.toFixed(2)}, y: ${coords.y.toFixed(2)} },</div>
        `;
        
        // Mouse Down (Start Dragging)
        node.addEventListener('mousedown', (e) => {
            draggedNode = region;
            e.preventDefault(); // Prevents text highlighting while dragging
        });

        DOM.mapLayer.appendChild(node);
    });

    // Mouse Move (Calculate real-time percentages relative to the map anchor)
    DOM.mapLayer.addEventListener('mousemove', (e) => {
        if (!draggedNode) return;
        
        const rect = DOM.mapLayer.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Clamp to edges
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        const node = document.getElementById(`node-${draggedNode}`);
        node.style.left = `${x.toFixed(2)}%`;
        node.style.top = `${y.toFixed(2)}%`;
        
        // Update label live
        document.getElementById(`label-${draggedNode}`).textContent = `'${draggedNode}': { x: ${x.toFixed(2)}, y: ${y.toFixed(2)} },`;
    });

    // Mouse Up (Stop Dragging & Print to Console)
    window.addEventListener('mouseup', () => {
        if (draggedNode) {
            draggedNode = null;
            printMatrixToConsole();
        }
    });
}

function printMatrixToConsole() {
    let output = "\n\n=== COPY AND PASTE THIS BLOCK INTO CONFIG.JS ===\n\n";
    const nodes = document.querySelectorAll('.geo-node');
    nodes.forEach(node => {
        const id = node.id.replace('node-', '');
        const x = parseFloat(node.style.left).toFixed(2);
        const y = parseFloat(node.style.top).toFixed(2);
        output += `    '${id}': { x: ${x}, y: ${y} },\n`;
    });
    console.log(output);
}

// Stubs to prevent crashes during calibration
export function updateNodeState(region, stateClass) {}
export function updateNodeLabel(region, text) {}