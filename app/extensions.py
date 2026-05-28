"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: SECURITY EXTENSIONS
==============================================================================
Instantiates Zero Trust mechanisms to protect the Web UI and API layer.
==============================================================================
"""

from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

csrf = CSRFProtect()

# Initialize the global rate limiter.
# Base limits are configured for standard HTML payload traffic. 
# Note: High-throughput API routes are explicitly exempted in the application 
# factory to prevent false-positive 429 blockades for clients operating behind 
# a shared NAT or VPN gateway.
limiter = Limiter(
    key_func=get_remote_address, 
    default_limits=["5000 per day", "1000 per hour"]
)