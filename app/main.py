"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: WEB APPLICATION ROUTING & API LAYER
==============================================================================
This module serves the frontend HTML dashboard and exposes the asynchronous 
REST API required for real-time frontend telemetry orchestration. It acts 
as a bridge to the core TelemetryEngine, ensuring absolute separation 
between the web presentation layer and the core network logic.
==============================================================================
"""

from flask import Blueprint, jsonify, render_template, request
from app.core.telemetry import TelemetryEngine
from app.core.registries import MODELS, REGIONS

main_bp = Blueprint('main', __name__)

# ============================================================================
# FRONTEND PRESENTATION ROUTES
# ============================================================================

@main_bp.route('/', methods=['GET'])
def index():
    """
    Serves the primary Single Page Application (SPA) dashboard.
    Injects the dynamically managed AI models and global datacenter registries 
    directly into the templating engine to build the UI dropdowns seamlessly.
    """
    return render_template(
        'index.html', 
        models=MODELS, 
        regions=REGIONS
    )

# ============================================================================
# DIAGNOSTIC API (AJAX ENDPOINTS)
# ============================================================================

@main_bp.route('/api/v1/ping', methods=['POST'])
def ping_datacenter():
    """
    Receives asynchronous telemetry requests from the frontend JavaScript,
    executes the core network diagnostic engine, and returns standardized JSON.
    
    Expected JSON Payload:
    {
        "model": "gemini-2.5-flash",
        "region": "us-central1",
        "api_version": "v1",
        "max_tokens": 256,
        "prompt": "Dynamic load profile prompt..."
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    # Extract configuration from frontend orchestrator
    model_id = data.get("model")
    location = data.get("region")
    api_version = data.get("api_version", "v1")
    prompt = data.get("prompt", "Ping")
    
    # Safely cast max_tokens to integer
    try:
        max_tokens = int(data.get("max_tokens", 20))
    except (ValueError, TypeError):
        max_tokens = 20

    if not model_id or not location:
        return jsonify({"error": "Missing required parameters: model, region"}), 400

    try:
        # Execute the core telemetry logic.
        # use_cli_spinner=False ensures we don't attempt terminal animations in web logs.
        result = TelemetryEngine.test_endpoint(
            model_id=model_id,
            location=location,
            api_version=api_version,
            prompt=prompt,
            max_tokens=max_tokens,
            runs=3,
            use_cli_spinner=False
        )
        
        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Internal Server Error: {str(e)}"
        }), 500

# ============================================================================
# INFRASTRUCTURE HEALTH
# ============================================================================

@main_bp.route('/health', methods=['GET'])
def health_check():
    """
    Liveness and Readiness probe for load balancers (e.g., Google Cloud Run, 
    Kubernetes). Verifies the WSGI worker is responsive.
    """
    return jsonify({
        "status": "healthy", 
        "engine": "Vertex AI Mesh Profiler API"
    }), 200