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
// GEOSPATIAL COORDINATE MATRIX
// ==============================================================================
// These X/Y percentages are calibrated to the SVG background projection.
// Coordinates are aggressively staggered in dense geographical regions 
// (e.g., North America, Europe) to prevent DOM text label collision during rendering.

export const GEO_MAP = {
    // ---------------------------------------------------------
    // MACRO-REGIONS (Control Plane Routing)
    // Parked cleanly in ocean sectors to differentiate logical routing from physical hubs.
    // ---------------------------------------------------------
    'global': { x: 46.77, y: 17.43 }, // Control Plane: Global Load Balancer
    'us': { x: 8.15, y: 33.50 },      // Control Plane: US Multi-Region
    'eu': { x: 43.21, y: 33.75 },     // Control Plane: EU Multi-Region
    
    // ---------------------------------------------------------
    // NORTH AMERICA
    // ---------------------------------------------------------
    'us-west1': { x: 15.45, y: 29.55 }, // The Dalles, Oregon, USA
    'us-west3': { x: 17.15, y: 31.92 }, // Salt Lake City, Utah, USA
    'us-west4': { x: 16.30, y: 34.33 }, // Las Vegas, Nevada, USA
    'us-west2': { x: 14.86, y: 35.73 }, // Los Angeles, California, USA
    'us-central1': { x: 21.65, y: 32.56 }, // Council Bluffs, Iowa, USA
    'us-south1': { x: 20.21, y: 37.61 },   // Dallas, Texas, USA
    'northamerica-northeast1': { x: 28.78, y: 30.43 }, // Montreal, Quebec, Canada
    'northamerica-northeast2': { x: 26.68, y: 32.08 }, // Toronto, Ontario, Canada
    'northamerica-south1': { x: 18.15, y: 41.88 },     // Querétaro, Mexico
    'us-east5': { x: 24.72, y: 34.50 },        // Columbus, Ohio, USA
    'us-east4': { x: 26.30, y: 35.84 },        // Ashburn, Virginia, USA
    'us-east1': { x: 24.83, y: 37.61 },        // Moncks Corner, South Carolina, USA
    
    // ---------------------------------------------------------
    // SOUTH AMERICA
    // ---------------------------------------------------------
    'southamerica-east1': { x: 34.22, y: 65.03 }, // Osasco, São Paulo, Brazil
    'southamerica-west1': { x: 27.74, y: 71.72 }, // Santiago, Chile

    // ---------------------------------------------------------
    // EUROPE & AFRICA
    // ---------------------------------------------------------
    'africa-south1': { x: 56.25, y: 65.87 },      // Johannesburg, South Africa
    'europe-north1': { x: 53.77, y: 23.14 },      // Hamina, Finland
    'europe-north2': { x: 52.02, y: 24.75 },      // Stockholm, Sweden
    'europe-west4': { x: 49.46, y: 29.22 },       // Eemshaven, Netherlands
    'europe-west1': { x: 49.00, y: 29.99 },       // St. Ghislain, Belgium
    'europe-west2': { x: 47.49, y: 29.17 },       // London, United Kingdom
    'europe-west9': { x: 48.30, y: 31.03 },       // Paris, France
    'europe-southwest1': { x: 46.58, y: 35.63 },  // Madrid, Spain
    'europe-west3': { x: 50.19, y: 30.04 },       // Frankfurt, Germany
    'europe-west10': { x: 50.95, y: 28.58 },      // Berlin, Germany
    'europe-west6': { x: 50.07, y: 31.05 },       // Zurich, Switzerland
    'europe-west12': { x: 49.76, y: 32.90 },      // Turin, Italy
    'europe-west8': { x: 50.34, y: 32.36 },       // Milan, Italy
    'europe-central2': { x: 53.12, y: 28.65 },    // Warsaw, Poland

    // ---------------------------------------------------------
    // ASIA PACIFIC & AUSTRALIA
    // ---------------------------------------------------------
    'asia-east1': { x: 82.74, y: 42.22 },         // Changhua County, Taiwan
    'asia-east2': { x: 80.83, y: 42.88 },         // Hong Kong
    'asia-northeast1': { x: 86.71, y: 33.54 },    // Tokyo, Japan
    'asia-northeast2': { x: 85.99, y: 35.07 },    // Osaka, Japan
    'asia-northeast3': { x: 82.51, y: 33.41 },    // Seoul, South Korea
    'asia-south1': { x: 69.44, y: 45.87 },        // Mumbai, India
    'asia-south2': { x: 69.70, y: 40.92 },        // Delhi, India
    'asia-southeast1': { x: 78.24, y: 53.73 },    // Jurong West, Singapore
    'asia-southeast2': { x: 79.71, y: 58.53 },    // Jakarta, Indonesia
    'australia-southeast1': { x: 90.63, y: 73.71 }, // Sydney, Australia
    'australia-southeast2': { x: 87.78, y: 77.33 }, // Melbourne, Australia
    
    // ---------------------------------------------------------
    // MIDDLE EAST
    // ---------------------------------------------------------
    'me-central1': { x: 62.52, y: 43.95 },        // Doha, Qatar
    'me-central2': { x: 61.64, y: 43.02 },        // Dammam, Saudi Arabia
    'me-west1': { x: 57.70, y: 39.16 }            // Tel Aviv, Israel
};

// ==============================================================================
// EXPORT REGISTRY PARSER
// ==============================================================================
/**
 * Extracts and parses the JSON registry injected by Jinja2 in the HTML DOM.
 * @returns {object} The complete datacenter registry matrix.
 */
export function getRegionsRegistry() {
    const raw = document.getElementById('regions-data').textContent;
    return JSON.parse(raw);
}