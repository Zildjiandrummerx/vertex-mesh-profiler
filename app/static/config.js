/**
 * ==============================================================================
 * MODULE: CONFIGURATION & GEOSPATIAL REGISTRY
 * ==============================================================================
 * Holds the hardcoded geospatial X/Y coordinates for map rendering and 
 * provides utility functions to extract the Python-injected registries.
 * ==============================================================================
 */

// Recalibrated Geospatial coordinates (X, Y percentages) for rendering nodes.
// Tuned with decimal precision to match exact longitudinal/latitudinal landmass mapping.
export const GEO_MAP = {
    // Macro-Regions (Control Plane - Parked in oceans to denote global routing)
    'global': { x: 28.5, y: 45.0 },
    'us': { x: 23.5, y: 35.0 },
    'eu': { x: 52.0, y: 25.0 },
    
    // North America (Aggressively spaced for UI readability)
    // West Coast (Stretched vertically to separate labels)
    'us-west1': { x: 23.5, y: 29.5 }, // Oregon
    'us-west3': { x: 28.5, y: 29.5 }, // Salt Lake City
    'us-west4': { x: 24.3, y: 33.0 }, // Las Vegas
    'us-west2': { x: 22.6, y: 35.4 }, // Los Angeles
    
    // Central & South (Pushed right into the continent)
    'us-central1': { x: 32.0, y: 31.0 }, // Iowa
    'us-south1': { x: 31.5, y: 37.0 },   // Dallas
    
    // East Coast & Canada (Fanned out along the coast)
    'northamerica-northeast1': { x: 38.0, y: 25.0 }, // Montreal
    'northamerica-northeast2': { x: 36.0, y: 27.5 }, // Toronto
    'us-east5': { x: 34.5, y: 30.0 },                // Ohio
    'us-east4': { x: 36.5, y: 32.5 },                // Virginia
    'us-east1': { x: 35.5, y: 36.5 },                // South Carolina
    
    // Europe
    'europe-north1': { x: 55.5, y: 20.5 }, 'europe-west4': { x: 50.2, y: 24.5 }, 'europe-west1': { x: 49.5, y: 25.5 },
    'europe-west2': { x: 48.5, y: 24.8 }, 'europe-west9': { x: 49.2, y: 27.5 }, 'europe-southwest1': { x: 47.5, y: 31.5 },
    'europe-west3': { x: 51.5, y: 25.8 }, 'europe-west6': { x: 51.2, y: 27.2 }, 'europe-west12': { x: 51.8, y: 29.5 },
    'europe-west8': { x: 52.5, y: 28.5 }, 'europe-central2': { x: 55.2, y: 24.5 },
    
    // Asia Pacific
    'asia-south1': { x: 71.5, y: 46.5 }, 'asia-south2': { x: 72.8, y: 43.5 },
    'asia-southeast1': { x: 79.5, y: 53.5 }, 'asia-southeast2': { x: 80.5, y: 55.8 },
    'asia-east1': { x: 83.5, y: 40.5 }, 'asia-east2': { x: 82.2, y: 42.5 },
    'asia-northeast1': { x: 88.5, y: 33.5 }, 'asia-northeast2': { x: 87.2, y: 35.0 }, 'asia-northeast3': { x: 85.8, y: 34.2 },
    
    // Australia
    'australia-southeast1': { x: 89.5, y: 78.5 }, 'australia-southeast2': { x: 87.8, y: 80.5 },
    
    // Middle East & Africa
    'me-central1': { x: 65.2, y: 40.5 }, 'me-central2': { x: 64.5, y: 41.5 }, 'me-west1': { x: 63.2, y: 39.5 },
    'africa-south1': { x: 56.5, y: 72.5 },
    
    // South America (Strictly preserved user coordinates)
    'southamerica-east1': { x: 38.2, y: 66.1 }, 'southamerica-west1': { x: 33.5, y: 72.0 }
};

/**
 * Extracts and parses the JSON registry injected by Jinja2 in the HTML.
 */
export function getRegionsRegistry() {
    const raw = document.getElementById('regions-data').textContent;
    return JSON.parse(raw);
}