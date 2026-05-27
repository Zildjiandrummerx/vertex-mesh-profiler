/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: CAMERA PHYSICS ENGINE (PAN & ZOOM)
 * ==============================================================================
 * Manages the CSS transformation layer of the global map projection.
 * Enables infinite zooming and panning capabilities while maintaining 
 * strict geometric constraints for the nested rendering layers.
 * ==============================================================================
 */

import { DOM } from './dom.js';

/**
 * Initializes the camera state and binds mathematical transformations to 
 * standard DOM pointer events.
 */
export function initCameraPhysics() {
    const mapAnchor = document.querySelector('.map-anchor');
    const mapContainer = document.querySelector('.map-container');

    // ==========================================================================
    // CAMERA STATE MATRIX
    // ==============================================================================
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false;
    let startX, startY;

    // ==========================================================================
    // TRANSFORMATION ENGINE
    // ==============================================================================
    /**
     * Executes the hardware-accelerated CSS transformations.
     * Applies standard scaling to the base map, and an inverse mathematical 
     * scale to the child nodes to preserve readability.
     */
    function updateTransform() {
        // 1. Apply primary translation and scale matrix to the base SVG projection
        mapAnchor.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

        // 2. Apply inverse scaling matrix to all child nodes
        // This ensures DOM elements (dots, labels) maintain their fixed optical 
        // pixel dimensions regardless of the parent container's zoom depth.
        const inverseScale = 1 / scale;
        const nodes = document.querySelectorAll('.geo-node');
        
        nodes.forEach(node => {
            // Preserves the coordinate anchoring (-50%, -50%) while scaling
            node.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;
        });
    }

    // ==========================================================================
    // ZOOM EVENT LISTENERS
    // ==============================================================================
    mapContainer.addEventListener('wheel', (e) => {
        // Prevent inherited browser scroll behavior
        e.preventDefault(); 
        
        const zoomSpeed = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        scale += direction * zoomSpeed;

        // Enforce strict optical bounds (1x to 5x magnification)
        scale = Math.max(1, Math.min(5, scale));
        
        updateTransform();
    });

    // ==========================================================================
    // PANNING EVENT LISTENERS
    // ==============================================================================
    mapContainer.addEventListener('mousedown', (e) => {
        // Intercept propagation: Prevent camera panning if the operator is 
        // directly interacting with a specific datacenter node.
        if (e.target.closest('.geo-node')) return;

        isPanning = true;
        mapContainer.style.cursor = 'grabbing';
        
        // Capture initial pointer vectors relative to the current translation
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        
        // Calculate new translation vectors based on pointer delta
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener('mouseup', () => {
        isPanning = false;
        mapContainer.style.cursor = 'default';
    });
    
    mapContainer.addEventListener('mouseleave', () => {
        // Graceful degradation: Terminate panning state if the pointer exits the viewport
        if (isPanning) {
            isPanning = false;
            mapContainer.style.cursor = 'default';
        }
    });
}