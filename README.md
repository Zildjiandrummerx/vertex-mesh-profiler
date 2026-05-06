# Vertex AI Mesh Profiler

## Executive Summary
When architecting enterprise Generative AI applications on Google Cloud, selecting the correct deployment region is critical for minimizing latency, avoiding `429 Resource Exhausted` errors, and maintaining strict data residency compliance.

The **Vertex AI Mesh Profiler** is a dual-interface (CLI + GUI) diagnostic tool designed for Cloud Architects and Data Engineers. It programmatically queries Google Cloud's global datacenters to measure API endpoint availability, response latency, and token generation velocity across multiple regions simultaneously.

## Key Features
* **Global Footprint Mapping:** Tests model availability across North America, South America, Europe, Asia Pacific, and the Middle East.
* **Multi-Region Load Balancing Validation:** Verifies routing logic for specialized macro-regions (e.g., the `us` or `eu` global load balancers).
* **Dual-API Verification:** Automatically tests both the `v1` (Production) and `v1beta1` (Preview) API endpoints to detect version-specific model rollouts.
* **Token Velocity Tracking:** Calculates true Output Tokens Per Second (TPS) by averaging the duration of multiple inference requests.

## Prerequisites
* Python 3.11+
* Authenticated Google Cloud Environment (`gcloud auth application-default login`)
* Target GCP Project with the Vertex AI API enabled.

## Installation

1. **Clone the repository and navigate to the source directory:**
```bash
git clone https://github.com/YOUR_ORG/vertex-mesh-profiler.git
cd vertex-mesh-profiler
```
Initialize a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the Google GenAI SDK:
```bash
pip install -r requirements.txt
```

## Usage
Ensure you are authenticated to your target Google Cloud project before running the suite:
```bash
gcloud auth application-default login --project=YOUR_PROJECT_ID
```
To launch the Graphical User Interface (GUI):
(Note: Requires a local machine environment; will not run in headless Docker containers).

```bash
python mesh-profiler.py
```
To launch the Command Line Interface (CLI):
(Ideal for Cloud Shell, SSH sessions, or headless environments).

```bash
python mesh-profiler.py --cli
```