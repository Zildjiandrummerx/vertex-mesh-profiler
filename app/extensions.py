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

# ARCHITECTURAL UPDATE: 
# A single "Global Sweep" fires ~45 concurrent API requests.
# The previous limit of "50 per hour" caused instant self-inflicted 429 blockades.
# Limits are now calibrated for high-frequency internal testing.
limiter = Limiter(
    key_func=get_remote_address, 
    default_limits=["5000 per day", "500 per hour", "100 per minute"]
)