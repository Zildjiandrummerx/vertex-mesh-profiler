"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: FLASK APPLICATION FACTORY
==============================================================================
Implements the Application Factory design pattern to initialize the web layer.
This architecture ensures the application is constructed dynamically, allowing
for seamless integration with production WSGI servers (Gunicorn) and preventing 
circular dependency conflicts across the codebase.
==============================================================================
"""

from flask import Flask
from app.extensions import csrf, limiter
from app.main import main_bp

def create_app() -> Flask:
    """
    Instantiates and configures the core Flask web application.
    Injects Zero Trust security extensions and registers the API routing blueprints.
    """
    app = Flask(__name__)
    
    # ========================================================================
    # APPLICATION CONFIGURATION & SECRETS
    # ========================================================================
    # Required by Flask-WTF to cryptographically sign session cookies and 
    # CSRF tokens. Note: In a hardened production environment (e.g., Cloud Run), 
    # this string should ideally be ingested dynamically via Google Secret Manager 
    # or secure environment variables.
    app.config['SECRET_KEY'] = 'enterprise-mesh-profiler-secure-key-2026'
    
    # ========================================================================
    # ZERO TRUST SECURITY EXTENSIONS
    # ========================================================================
    # Explicitly define in-memory storage to silence standard Limiter warnings
    app.config['RATELIMIT_STORAGE_URI'] = 'memory://'
    
    # Initialize Cross-Site Request Forgery (CSRF) protection and the 
    # API Rate Limiter to mitigate potential denial-of-wallet (DoW) attacks.
    csrf.init_app(app)
    limiter.init_app(app)
    
    # ARCHITECTURAL OVERRIDE: API CSRF EXEMPTION
    # Because the `/api/v1/ping` endpoints are consumed asynchronously via 
    # Vanilla JS fetch() operations without relying on stateful session cookies, 
    # we exempt the primary blueprint from strict CSRF token validation to 
    # allow the live dashboard physics to execute seamlessly.
    csrf.exempt(main_bp)

    # ========================================================================
    # ROUTING & BLUEPRINT REGISTRATION
    # ========================================================================
    # Attach the frontend presentation and backend API routes to the main app.
    app.register_blueprint(main_bp)
    
    return app