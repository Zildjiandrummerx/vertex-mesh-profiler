# Vertex AI Mesh Profiler

## Overview
The **Vertex AI Mesh Profiler** is an enterprise-grade diagnostic engine designed to map the real-time availability and performance of Google Cloud's Generative AI infrastructure.

When architecting AI applications, choosing a region is not just about proximity; it's about hardware availability and model propagation. This tool allows Cloud Architects to identify "Champion" regions and "Hardware Deserts" before deploying production code.

## Advanced Diagnostic Engine & Core Objectives
* **Dual-Mode Architecture (Web UI & CLI):** Operates on a Hexagonal Architecture. The core telemetry engine is completely decoupled from the presentation layer, allowing you to run interactive terminal scans (CLI) or launch a highly animated, real-time geospatial dashboard (Web UI).
* **Tri-State Polyglot Execution:** Natively supports routing for Google Gemini, Partner Models (Anthropic), and Open-MaaS models (Meta Llama, Mistral, xAI Grok, DeepSeek).
* **Dynamic Load Profiles:** Intelligently scales prompt complexity based on user-requested token caps to accurately measure **TTFT** (Time-To-First-Token) versus sustained **TPS** (Tokens Per Second).
* **Percentile Heuristic Engine:** Dynamically ranks the Top 33% of datacenters per run to identify champion routing architectures regardless of model size.
* **Capacity Discovery:** Detect regions with `429 Resource Exhausted` or `400 Precondition Failed` (missing TPU/GPU clusters).
* **Deployment Mapping:** Verify if a specific model version has reached a regional registry (`404` check).

## Prerequisites
Before execution, ensure the following are configured in your Google Cloud environment:
* **Vertex AI API Enabled:** Run `gcloud services enable aiplatform.googleapis.com`.
* **Permissions:** Your identity must have the `roles/aiplatform.user` role.
* **Project ID Configuration:** Pass your project ID via the `GOOGLE_CLOUD_PROJECT` environment variable during Docker execution, or set it directly in `app/core/config.py`.
* **Partner Model EULAs (Critical):** If you are testing third-party models (e.g., Anthropic Claude, Meta Llama, Mistral, xAI), you **must** explicitly enable them and accept their End User License Agreement (EULA) in the [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) for your specific project *before* running the script. Failure to do so will result in a false-negative `404 Not Found` error.

---

## Installation & Authentication

### Step 1: Authenticate
The profiler uses Application Default Credentials (ADC). Authenticate your terminal to allow the tool to securely request short-lived tokens on your behalf.

```bash
gcloud auth application-default login
```
(Note: If running inside a browser-based Google Cloud Shell, copy the generated `.json file` to your local directory as `local_keys.json` to prevent ephemeral `/tmp` deletion, the credentials file is often deleted when the ephemeral container spins down). 

Run this exact command immediately after logging in to copy the credentials safely to your project folder:

```bash
cp ~/.config/gcloud/application_default_credentials.json ./local_keys.json
```

---

### Step 2: Run the Profiler (Docker / Recommended)
To ensure consistent results across different machines without dependency conflicts, use the provided Docker configuration. The container uses a smart entrypoint.sh router to toggle between the Web UI and the CLI.

# Build the immutable image:
```bash
docker build -t vertex-mesh-profiler .
```

### Launching Web UI Mode (Real-Time Dashboard)
This mode boots the Gunicorn production server. It requires port 8080 to be mapped to your host. Once running, open your browser to http://localhost:8080 (or use "Web Preview -> Preview on port 8080" in Cloud Shell).

# For Google Cloud Shell (Using the `local_keys.json` workaround):

```bash
docker run --rm -it -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID" \
  -v $(pwd)/local_keys.json:/tmp/adc.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json \
  vertex-mesh-profiler webui
```

# For macOS/Linux (Standard Local Workstation):

```bash
docker run --rm -it -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID" \
  -v $HOME/.config/gcloud/application_default_credentials.json:/tmp/adc.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json \
  vertex-mesh-profiler webui
```

# For Windows (PowerShell):

```bash
docker run --rm -it -p 8080:8080 `
  -e GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID" `
  -v $env:APPDATA\gcloud\application_default_credentials.json:/tmp/adc.json:ro `
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json `
  vertex-mesh-profiler webui
```

---

## Launching CLI Mode (Interactive Terminal)
This mode bypasses the web server and runs the diagnostic engine entirely within standard output streams.

# For Google Cloud Shell:

```bash
docker run --rm -it \
  -e GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID" \
  -v $(pwd)/local_keys.json:/tmp/adc.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json \
  vertex-mesh-profiler cli
```

(For macOS/Linux/Windows CLI execution, use the exact volume mapping -v strings from the Web UI examples above, but remove -p 8080:8080 and replace webui with cli at the end).

---

### Step 3: Run the Profiler (Local Python / Alternative)
If you prefer running the script directly in a Python environment without Docker:

```bash
# 1. Install the required dependency matrix
pip install -r requirements.txt

# 2. To run the CLI Engine:
python cli.py

# 3. To run the Web UI (Development Server):
python wsgi.py
```

---

### Interpreting Results

|         Status        |       Diagnosis      |                               Architectural Action                              |
|:---------------------:|:--------------------:|:-------------------------------------------------------------------------------:|
| [SUCCESS]             | High-performance hub | Target for primary production traffic.                                          |
| 404 (Not Found)       | Catalog Lag          | The model isn't in this region yet. Use a different region or wait for rollout. |
| 400 (Bad Request)     | Hardware Desert      | Region lacks the specific accelerators (TPU/GPU) for this model.                |
| 501 (Not Implemented) | Dark Region          | Vertex AI Generative AI services are not yet enabled in this datacenter.        |

### Architectural Best Practices
* **Use the global Endpoint:** For general-purpose apps, the global endpoint offers the highest availability and automatically routes to the healthiest regional cluster.
* **Use Multi-Region (us / eu) for Residency:** Only use the continental endpoints if your security policy mandates that data remains within US or EU borders.
* **Dual-Version Testing:** Always compare v1 (Stable/GA) against v1beta1 (Preview). Preview versions often contain "Experimental" hardware configurations that may yield different latency profiles.

### References
* [Generative AI on Vertex AI Locations](https://docs.cloud.google.com/vertex-ai/docs/general/locations)
* [Vertex AI Data Residency](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/locations)
* [Google Gen AI Python SDK Overview](https://docs.cloud.google.com/python/docs/reference/vertexai/latest)
* [Set up Application Default Credentials](https://docs.cloud.google.com/docs/authentication/provide-credentials-adc)
* [Vertex AI Service Endpoints](https://docs.cloud.google.com/vertex-ai/docs/reference/rest)
* [Gemini Model Versioning](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions)