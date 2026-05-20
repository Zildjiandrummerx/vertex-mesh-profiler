"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: WSGI PRODUCTION ENTRY POINT
==============================================================================
Acts as the interface between the core Python application and production-grade
HTTP servers like Gunicorn. This file is the absolute root execution point 
for the Web UI architecture.
==============================================================================
"""

from app import create_app

# ============================================================================
# APPLICATION INSTANTIATION
# ============================================================================
# Gunicorn is explicitly configured in the Dockerfile and entrypoint.sh 
# to look for a module named 'wsgi' and a callable named 'app' (wsgi:app).
# We invoke the Application Factory here to construct that callable natively.
app = create_app()

if __name__ == "__main__":
    # ========================================================================
    # DEVELOPMENT FALLBACK
    # ========================================================================
    # If the file is executed directly via `python wsgi.py` rather than through
    # a production WSGI server, it falls back to Flask's built-in Werkzeug server.
    # Note: This is strictly for local debugging; Werkzeug is not designed to 
    # handle concurrent concurrent traffic or high-latency GenAI network calls.
    app.run(host="0.0.0.0", port=8080)