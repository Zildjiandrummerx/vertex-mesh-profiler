from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/health', methods=['GET'])
def health_check():
    """Liveness probe for Google Cloud Run."""
    return jsonify({"status": "healthy", "engine": "N.A.T.H.A.L.I.E. Omni-Cloud Node"}), 200