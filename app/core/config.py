"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: CONFIGURATION & AESTHETICS
==============================================================================
Centralizes environmental variables, application constants, and terminal UI
aesthetics. By isolating configurations here, both the CLI and future Web UI 
can securely share state without hardcoding values in operational logic.
==============================================================================
"""

import os

# ============================================================================
# INFRASTRUCTURE STATE
# ============================================================================
# Fetches the Project ID dynamically to prevent hardcoding credentials in Git.
# Falls back to your development environment if the env var is missing.
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "jgaldamez-dev")

# Standardized benchmark prompt for identical computational load.
DEFAULT_PROMPT = "Explain the concept of multi-region cloud architecture in two sentences."

# Dual-Routing check to map model propagation across Production and Preview.
API_VERSIONS = ["v1", "v1beta1"]

# ============================================================================
# TERMINAL AESTHETICS (ANSI SECURE CODES)
# ============================================================================
CYAN = '\033[0;36m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'