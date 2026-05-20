# ==============================================================================
# INFRASTRUCTURE - MULTI-MODEL GENAI ENGINE
# ==============================================================================
# MODULE: SECURE CONTAINERIZATION ENGINE
# ==============================================================================
# We use the 'slim' variant of Debian/Python. 
# This drastically reduces the image size (faster Cloud Run deployments) 
# and minimizes the attack surface by stripping unnecessary OS packages.
FROM python:3.11-slim

# ==========================================
# SECURITY: LEAST PRIVILEGE PRINCIPLE
# ==========================================
# Never run a web server as the 'root' Linux user. 
# If a hostile payload breaches the Python layer, the attacker is trapped 
# inside an unprivileged account with zero OS-level permissions.
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set the working directory inside the container
WORKDIR /app

# ==========================================
# DEPENDENCY LAYER CACHING
# ==========================================
# We copy ONLY the requirements.txt file first. 
# Docker caches this step. If we change our Python code but don't change dependencies, 
# Docker skips the 'pip install' step and rebuilds in < 1 second.

# Suppress the "Running pip as root" warning (safe inside an isolated container build).
ENV PIP_ROOT_USER_ACTION=ignore

# Silently upgrade pip to the latest version to prevent warnings.
RUN pip install --no-cache-dir --upgrade pip --quiet

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ==========================================
# APPLICATION ASSEMBLY
# ==========================================
# Copy the rest of the application files into the container
COPY . .

# Ensure the dual-execution router script is executable by the Linux OS.
RUN chmod +x entrypoint.sh

# Transfer ownership of all files to the secure non-root user
RUN chown -R appuser:appuser /app

# Give the unprivileged user a writable home directory for Gunicorn temp files.
# This prevents the [Errno 13] Permission denied error during worker boot.
ENV HOME=/tmp

# Switch Linux context to the secure user
USER appuser

# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================
# PYTHONUNBUFFERED=1 forces Python to instantly stream its logs to stdout.
# This ensures real-time visibility in Google Cloud Logging.
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose the port so the local Docker bridge or Cloud Run Load Balancer can route traffic
EXPOSE 8080

# ==========================================
# DUAL-EXECUTION ROUTER & PRODUCTION SERVER
# ==========================================
# We utilize an entrypoint script to toggle between CLI mode and Web UI mode.
# ENTRYPOINT forces all 'docker run' commands to pass through our router script.
# CMD passes 'webui' as the default argument if nothing else is provided.
# 
# *CRITICAL NOTE ON GUNICORN*: When the router boots Web UI mode, it passes 
# the --timeout 120 flag. Generative AI API calls can take 45-90 seconds. 
# Without this flag, Gunicorn will kill the worker at the default 30 seconds.
ENTRYPOINT ["./entrypoint.sh"]
CMD ["webui"]