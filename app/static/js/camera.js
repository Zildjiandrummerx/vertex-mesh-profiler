/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: CAMERA PHYSICS ENGINE (CINEMATIC TRACKING)
 * ==============================================================================
 * Handles the mathematical bounds, automatic focal points, manual zooming,
 * and elastic snap-back physics of the SVG projection map.
 * ==============================================================================
 */

import { GEO_MAP, getRegionsRegistry } from './config.js';

// Global baseline targets for the elastic snap-back physics
let targetScale = 1.00;
let targetTranslateX = 0;
let targetTranslateY = 0;

export function initCameraPhysics() {
    const mapAnchor = document.querySelector('.map-anchor');
    const mapContainer = document.querySelector('.map-container');

    // ==========================================================================
    // CAMERA STATE MATRIX
    // ==============================================================================
    let currentScale = 1;
    let currentTranslateX = 0;
    let currentTranslateY = 0;
    
    let isPanning = false;
    let startX, startY;

    // Establishes baseline smooth CSS transitions for cinematic panning execution
    mapAnchor.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';

    function applyTransform(x, y, s) {
        // Core CSS transform execution
        mapAnchor.style.transform = `translate(${x}px, ${y}px) scale(${s})`;

        // Inverse scaling applied to nodes to maintain absolute optical pixel dimensions
        const inverseScale = 1 / s;
        const nodes = document.querySelectorAll('.geo-node');
        nodes.forEach(node => {
            node.style.transform = `translate(-50%, -50%) scale(${inverseScale})`;
        });
    }

    // ==========================================================================
    // MANUAL ZOOM PHYSICS
    // ==============================================================================
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault(); 
        
        const zoomSpeed = 0.10;
        const direction = e.deltaY > 0 ? -1 : 1;
        const newScale = Math.max(1, Math.min(5, currentScale + (direction * zoomSpeed)));
        
        // Dynamically recalculate translation to prevent optical drifting
        currentTranslateX = (currentTranslateX / currentScale) * newScale;
        currentTranslateY = (currentTranslateY / currentScale) * newScale;
        
        currentScale = newScale;

        // Updates the global target state so elastic snap-back respects the manual zoom depth
        targetScale = currentScale;
        targetTranslateX = currentTranslateX;
        targetTranslateY = currentTranslateY;

        // Disables transition for instant 1:1 hardware-accelerated wheel response
        mapAnchor.style.transition = 'none';
        applyTransform(currentTranslateX, currentTranslateY, currentScale);
    });

    // ==========================================================================
    // ELASTIC PANNING (Drag & Snap-Back)
    // ==============================================================================
    mapContainer.addEventListener('mousedown', (e) => {
        // Intercept propagation: Prevents camera panning if interacting with a datacenter node
        if (e.target.closest('.geo-node')) return;

        isPanning = true;
        mapContainer.style.cursor = 'grabbing';
        
        // Disables transition during active drag for precise pointer tracking
        mapAnchor.style.transition = 'none';
        
        startX = e.clientX - currentTranslateX;
        startY = e.clientY - currentTranslateY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        currentTranslateX = e.clientX - startX;
        currentTranslateY = e.clientY - startY;
        applyTransform(currentTranslateX, currentTranslateY, currentScale);
    });

    // Re-enables cinematic transition and returns map to the mathematical target
    const snapBackToTarget = () => {
        if (!isPanning) return;
        isPanning = false;
        mapContainer.style.cursor = 'default';
        
        mapAnchor.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        currentTranslateX = targetTranslateX;
        currentTranslateY = targetTranslateY;
        applyTransform(targetTranslateX, targetTranslateY, targetScale);
    };

    window.addEventListener('mouseup', snapBackToTarget);
    
    mapContainer.addEventListener('mouseleave', () => {
        if (isPanning) {
            snapBackToTarget();
        }
    });

    // Exposes the camera controller globally to the orchestration layer
    window.focusCameraOnRegions = executeCameraCalibration;
    
    // ==========================================================================
    // HARDCODED CAMERA CALIBRATION (Focal Viewports)
    // ==============================================================================
    /**
     * Identifies the parent group of any selected node and applies the exact 
     * Scale, X, and Y Cartesian coordinates required for perfect UI framing.
     */
    function executeCameraCalibration(selectedRegions) {
        if (selectedRegions.length === 0) return;

        // Reset to global origin for comprehensive sweeps
        if (selectedRegions.length > 20) {
            targetScale = 1.00;
            targetTranslateX = 0;
            targetTranslateY = 0;
        } else {
            // Reverse-lookup the parent group of the first targeted region
            const registry = getRegionsRegistry();
            let targetGroup = 'global';
            
            for (const [groupName, regions] of Object.entries(registry)) {
                if (regions.includes(selectedRegions[0])) {
                    targetGroup = groupName;
                    break;
                }
            }

            // Apply strict manually calibrated focal points
            switch (targetGroup) {
                case 'Asia Pacific & Middle East':
                    targetScale = 1.90;
                    targetTranslateX = -495.65;
                    targetTranslateY = -78.64;
                    break;
                case 'Canada, Mexico & South America':
                    targetScale = 1.90;
                    targetTranslateX = 470.13;
                    targetTranslateY = -26.55;
                    break;
                case 'Europe & Africa':
                    targetScale = 2.00;
                    targetTranslateX = -80.71;
                    targetTranslateY = 76.75;
                    break;
                case 'Macro-Regions (Global Load Balanced)':
                    targetScale = 2.00;
                    targetTranslateX = 490.79;
                    targetTranslateY = 226.49;
                    break;
                case 'United States':
                    targetScale = 4.30;
                    targetTranslateX = 1456.16;
                    targetTranslateY = 514.30;
                    break;
                default:
                    targetScale = 1.00;
                    targetTranslateX = 0;
                    targetTranslateY = 0;
                    break;
            }
        }

        // Apply calculated targets to state execution
        currentScale = targetScale;
        currentTranslateX = targetTranslateX;
        currentTranslateY = targetTranslateY;
        
        mapAnchor.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        applyTransform(targetTranslateX, targetTranslateY, targetScale);
    }
}