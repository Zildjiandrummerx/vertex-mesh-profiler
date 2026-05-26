/**
 * ==============================================================================
 * ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
 * MODULE: CONFIGURATION & GEOSPATIAL REGISTRY
 * ==============================================================================
 * Holds the geospatial intelligence for map rendering and provides utility 
 * functions to extract the Python-injected datacenter registries.
 * ==============================================================================
 */

// ==============================================================================
// TRUE GEOSPATIAL COORDINATE MATRIX (MANUALLY CALIBRATED)
// ==============================================================================
// These X/Y percentages are surgically calibrated to the specific SVG background
// image. They are aggressively staggered in dense regions (like the US and EU) 
// so the DOM text labels do not overlap when the UI renders.

export const GEO_MAP = {
  // ---------------------------------------------------------
  // MACRO-REGIONS (Control Plane)
  // ---------------------------------------------------------
  'global': { x: 10.0, y: 40.0 }, // Parked safely in the deep Pacific Ocean
  'us': { x: 28.0, y: 20.0 },     // Hovering in Northern Canada
  'eu': { x: 52.0, y: 15.0 },     // Hovering above the Arctic Circle
   
  // ---------------------------------------------------------
  // NORTH AMERICA (Surgically staggered to prevent label collisions)
  // ---------------------------------------------------------
  // West Coast (Cascading downward)
  'us-west1': { x: 21.5, y: 31.0 }, // Oregon (Top Left)
  'us-west3': { x: 23.5, y: 33.0 }, // Salt Lake City (Inner)
  'us-west4': { x: 23.0, y: 35.0 }, // Las Vegas (Mid-Left)
  'us-west2': { x: 22.0, y: 37.0 }, // Los Angeles (Bottom Left)
   
  // Central & South (Cleared out of the crossfire)
  'us-central1': { x: 28.0, y: 31.5 }, // Iowa
  'us-south1': { x: 28.0, y: 36.5 },   // Dallas (Safely below Iowa's label)
   
  // East Coast & Canada (Fanned wide)
  'northamerica-northeast1': { x: 35.0, y: 26.5 }, // Montreal
  'northamerica-northeast2': { x: 33.0, y: 29.0 }, // Toronto
  'us-east5': { x: 31.5, y: 31.5 },        // Ohio
  'us-east4': { x: 34.0, y: 34.0 },        // Virginia
  'us-east1': { x: 32.5, y: 36.5 },        // South Carolina
   
  // ---------------------------------------------------------
  // SOUTH AMERICA (Strictly preserved user coordinates)
  // ---------------------------------------------------------
  'southamerica-east1': { x: 38.2, y: 66.1 }, 
  'southamerica-west1': { x: 33.5, y: 72.0 },

  // ---------------------------------------------------------
  // EUROPE & AFRICA (Manually fanned across the continent)
  // ---------------------------------------------------------
  'africa-south1': { x: 56.25, y: 65.87 },
  'europe-north1': { x: 53.77, y: 23.14 }, 
  'europe-north2': { x: 52.02, y: 24.75 }, // Stockholm
  'europe-west4': { x: 49.46, y: 29.22 }, 
  'europe-west1': { x: 49.00, y: 29.99 },
  'europe-west2': { x: 47.49, y: 29.17 }, 
  'europe-west9': { x: 48.30, y: 31.03 }, 
  'europe-southwest1': { x: 46.58, y: 35.63 },
  'europe-west3': { x: 50.19, y: 30.04 }, 
  'europe-west10': { x: 50.95, y: 28.58 }, // Berlin
  'europe-west6': { x: 50.07, y: 31.05 }, 
  'europe-west12': { x: 49.76, y: 32.90 },
  'europe-west8': { x: 50.34, y: 32.36 }, 
  'europe-central2': { x: 53.12, y: 28.65 },

  // ---------------------------------------------------------
  // ASIA PACIFIC & AUSTRALIA
  // ---------------------------------------------------------
  'asia-south1': { x: 69.0, y: 46.0 }, 'asia-south2': { x: 71.0, y: 42.0 },
  'asia-southeast1': { x: 77.0, y: 55.0 }, 'asia-southeast2': { x: 79.0, y: 60.0 },
  'asia-east1': { x: 83.0, y: 44.0 }, 'asia-east2': { x: 81.0, y: 46.0 },
  'asia-northeast1': { x: 88.0, y: 33.0 }, 'asia-northeast2': { x: 86.0, y: 36.0 }, 'asia-northeast3': { x: 84.0, y: 34.0 },
  'australia-southeast1': { x: 89.0, y: 78.0 }, 'australia-southeast2': { x: 86.0, y: 78.0 },
   
  // ---------------------------------------------------------
  // MIDDLE EAST
  // ---------------------------------------------------------
  'me-central1': { x: 65.0, y: 43.0 }, 'me-central2': { x: 63.0, y: 45.0 }, 'me-west1': { x: 61.0, y: 41.0 }
};

// ==============================================================================
// EXPORT REGISTRY PARSER
// ==============================================================================
/**
 * Extracts and parses the JSON registry injected by Jinja2 in the HTML.
 */
export function getRegionsRegistry() {
    const raw = document.getElementById('regions-data').textContent;
    return JSON.parse(raw);
}