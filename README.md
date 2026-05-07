# Vertex AI Mesh Profiler

## Overview
The **Vertex AI Mesh Profiler** is an enterprise-grade diagnostic engine designed to map the real-time availability and performance of Google Cloud's Generative AI infrastructure.

When architecting AI applications, choosing a region is not just about proximity; it's about hardware availability and model propagation. This tool allows Cloud Architects to identify "Champion" regions and "Hardware Deserts" before deploying production code.

## Core Objectives
* **Latency Baselines:** Establish Min/Max/Avg latency for specific models across the globe.
* **Capacity Discovery:** Detect regions with `429 Resource Exhausted` or `400 Precondition Failed` (missing TPU/GPU clusters).
* **Deployment Mapping:** Verify if a specific model version (e.g., `gemini-2.5-flash`) has reached a regional registry (`404` check).
* **Compliance Verification:** Test Multi-Region Endpoints (mREPs) for strict Data Residency requirements.

## Prerequisites
Before execution, ensure the following are configured in your Google Cloud environment:
* **Vertex AI API Enabled:** Run `gcloud services enable aiplatform.googleapis.com`.
* **Permissions:** Your identity must have the `roles/aiplatform.user` role.
* **Project ID:** Open `mesh-profiler.py` and set `PROJECT_ID` to your target Google Cloud Project ID.

---

## Installation & Authentication

### Step 1: Authenticate
The profiler uses Application Default Credentials (ADC). Authenticate your local machine to allow the tool to act on your behalf:
```bash
gcloud auth application-default login
```
(Note: If running inside Google Cloud Shell, copy the generated .json file to your local directory as local_keys.json to prevent ephemeral /tmp deletion).

### Step 2: Run the Profiler
Option A: Local Development (Standard)
If you prefer running the script directly in a Python environment:

# Install the modern Google Gen AI SDK
```bash
pip install --upgrade google-genai
```

# Run the profiler
```bash
python mesh-profiler.py
```
Option B: Containerized Deployment (Recommended)
To ensure consistent results across different machines without dependency conflicts, use the provided Docker configuration.

Build the immutable image:
```bash
docker build -t vertex-mesh-profiler .
```
Run the interactive CLI within the container.

For Google Cloud Shell (Using the local_keys.json workaround):

```bash
docker run --rm -it \
  -v $(pwd)/local_keys.json:/tmp/adc.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json \
  vertex-mesh-profiler
```
For macOS/Linux (Standard Local Workstation):

```bash
docker run --rm -it \
  -v $HOME/.config/gcloud/application_default_credentials.json:/tmp/adc.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json \
  vertex-mesh-profiler
```

For Windows (PowerShell):

```bash
docker run --rm -it `
  -v $env:APPDATA\gcloud\application_default_credentials.json:/tmp/adc.json:ro `
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/adc.json `
  vertex-mesh-profiler
```

Interpreting Results

|         Status        |       Diagnosis      |                               Architectural Action                              |
|:---------------------:|:--------------------:|:-------------------------------------------------------------------------------:|
| [SUCCESS]             | High-performance hub | Target for primary production traffic.                                          |
| 404 (Not Found)       | Catalog Lag          | The model isn't in this region yet. Use a different region or wait for rollout. |
| 400 (Bad Request)     | Hardware Desert      | Region lacks the specific accelerators (TPU/GPU) for this model.                |
| 501 (Not Implemented) | Dark Region          | Vertex AI Generative AI services are not yet enabled in this datacenter.        |

### Architectural Best Practices
Use the global Endpoint: For general-purpose apps, the global endpoint offers the highest availability and automatically routes to the healthiest regional cluster.
Use Multi-Region (us / eu) for Residency: Only use the continental endpoints if your security policy mandates that data remains within US or EU borders.
Dual-Version Testing: Always compare v1 (Stable/GA) against v1beta1 (Preview). Preview versions often contain "Experimental" hardware configurations that may yield different latency profiles.

### References
* [Generative AI on Vertex AI Locations](https://docs.cloud.google.com/vertex-ai/docs/general/locations)
* [Vertex AI Data Residency](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/locations)
* [Google Gen AI Python SDK Overview](https://docs.cloud.google.com/python/docs/reference/vertexai/latest)
* [Set up Application Default Credentials](https://docs.cloud.google.com/docs/authentication/provide-credentials-adc)
* [Vertex AI Service Endpoints](https://docs.cloud.google.com/vertex-ai/docs/reference/rest)
* [Gemini Model Versioning](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions)