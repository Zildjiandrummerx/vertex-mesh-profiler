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

# Dual-Routing check to map model propagation across Production and Preview.
API_VERSIONS = ["v1", "v1beta1"]

# ============================================================================
# DYNAMIC LOAD PROFILES (THE PHYSICS ENGINE)
# ============================================================================
# To accurately measure Token Velocity (TPS), the complexity of the prompt 
# must scale linearly with the requested max_output_tokens. If a user requests 
# a 1000-token stress test but the prompt is too simple, the LLM will stop 
# generating at 10 tokens, mathematically invalidating the sustained benchmark.

# TIER 1 (1-50 Tokens): Optimized for raw Time-To-First-Token (TTFT) and API routing checks.
PROMPT_DIAGNOSTIC = "Why is the sky blue? Answer in exactly 5 words."

# TIER 2 (51-500 Tokens): Standard API responsiveness and moderate inference load.
PROMPT_STANDARD = (
    "Write a comprehensive 3-paragraph executive summary explaining the difference "
    "between horizontal and vertical scaling in cloud architecture. Ensure the response "
    "is detailed and uses technical terminology."
)

# TIER 3 (501+ Tokens): Forces maximum GPU/TPU utilization to expose true sustained hardware throughput.
PROMPT_STRESS = (
    "Write a highly detailed, 10-paragraph technical essay comparing the internal "
    "mechanics of Kubernetes control planes (etcd, kube-apiserver) to Docker Swarm. "
    "Include examples of YAML deployments, advanced networking considerations (eBPF vs iptables), "
    "and strict security best practices for Zero Trust environments. Do not stop generating "
    "until you have provided an exhaustive analysis."
)

# ============================================================================
# TERMINAL AESTHETICS (ANSI SECURE CODES)
# ============================================================================
CYAN = '\033[0;36m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'