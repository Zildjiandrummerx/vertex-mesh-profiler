/**
 * ==============================================================================
 * MODULE: CAMERA PHYSICS ENGINE (PAN & ZOOM)
 * ==============================================================================
 * Handles the CSS transformation of the map anchor to allow for infinite
 * zooming and panning without breaking the relative X/Y node percentages.
 * 
 * ARCHITECTURAL FIX (INVERSE SCALING):
 * When the map zooms in, the child nodes mathematically multiply in size. 
 * We apply a real-time inverse scale to the nodes so they maintain their 
 * exact pixel dimensions regardless of how deep the camera zooms.
 * ==============================================================================
 */

import { DOM } from './dom.js';

export function initCameraPhysics() {
    const mapAnchor = document.querySelector('.map-anchor');
    const mapContainer = document.querySelector('.map-container');

    // Camera State
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false;
    let startX, startY;

    // Apply the CSS Transform to the Parent and Inverse to the Children
    function updateTransform() {
        // 1. Zoom the master map container
        mapAnchor.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        // 2. Inverse Scale the Nodes to prevent them from becoming giant suns
        const inverseScale = 1 / scale;
        const nodes = document.querySelectorAll('.geo-node');
        
        nodes.forEach(node => {
            // We must preserve the translation (-50%, -50%) that centers the dot,
            // while applying the inverse scale to its size.
            node.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;
        });
    }

    // 1. ZOOM PHYSICS (Mouse Wheel)
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault(); // Stop the whole page from scrolling
        
        const zoomSpeed = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        scale += direction * zoomSpeed;

        // Clamp the zoom levels (1x to 5x)
        scale = Math.max(1, Math.min(5, scale));
        
        updateTransform();
    });

    // 2. PAN PHYSICS (Mouse Drag)
    mapContainer.addEventListener('mousedown', (e) => {
        // Prevent panning if the user is dragging a node in God-Mode
        if (e.target.closest('.geo-node')) return;

        isPanning = true;
        mapContainer.style.cursor = 'grabbing';
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener('mouseup', () => {
        isPanning = false;
        mapContainer.style.cursor = 'default';
    });
    
    // Safety Catch: If mouse leaves the map area while dragging, stop panning
    mapContainer.addEventListener('mouseleave', () => {
        if (isPanning) {
            isPanning = false;
            mapContainer.style.cursor = 'default';
        }
    });
}