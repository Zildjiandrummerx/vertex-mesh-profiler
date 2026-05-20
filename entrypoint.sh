#!/bin/bash
# ==============================================================================
# ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
# MODULE: CONTAINER EXECUTION ROUTER (ENTRYPOINT)
# ==============================================================================
# This script acts as the primary traffic controller for the Docker container.
# It intercepts arguments passed via `docker run` and determines whether to boot
# the interactive CLI engine or the full Gunicorn Web UI.
# ==============================================================================

# Exit immediately if a command exits with a non-zero status, ensuring failures 
# are caught and logged by the container orchestration platform (e.g., Kubernetes).
set -e

# ==============================================================================
# ROUTING LOGIC & SIGNAL HANDLING
# ==============================================================================
# ARCHITECTURAL NOTE ON `exec`: 
# We use `exec` instead of just running the commands natively. `exec` replaces 
# the current bash shell with the target process (Python or Gunicorn). 
# This ensures the target process assumes PID 1, allowing it to correctly receive 
# OS-level SIGTERM signals for graceful shutdowns in Cloud Run or Kubernetes.

if [ "$1" = "cli" ] || [ "$1" = "-cli" ]; then
    # --------------------------------------------------------------------------
    # BRANCH A: COMMAND LINE INTERFACE (CLI)
    # Triggered via: docker run ... multi-model-engine cli
    # --------------------------------------------------------------------------
    echo "[*] Booting Vertex Mesh Profiler in CLI Mode..."
    exec python cli.py

elif [ "$1" = "webui" ] || [ "$1" = "-webui" ]; then
    # --------------------------------------------------------------------------
    # BRANCH B: WEB USER INTERFACE (GUNICORN)
    # Triggered via: docker run ... multi-model-engine webui
    # --------------------------------------------------------------------------
    echo "[*] Booting Vertex Mesh Profiler in Web UI Mode (Gunicorn)..."
    exec gunicorn --bind 0.0.0.0:8080 --workers 1 --threads 8 --timeout 120 wsgi:app

else
    # --------------------------------------------------------------------------
    # BRANCH C: CLOUD RUN NATIVE FALLBACK (DEFAULT)
    # Triggered via: Standard Google Cloud Run deployments which pass no arguments.
    # --------------------------------------------------------------------------
    echo "[*] No execution flag detected. Defaulting to Web UI Mode..."
    exec gunicorn --bind 0.0.0.0:8080 --workers 1 --threads 8 --timeout 120 wsgi:app

fi