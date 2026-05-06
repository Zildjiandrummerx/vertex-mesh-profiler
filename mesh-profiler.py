"""
==============================================================================
VERTEX AI MESH PROFILER (ENTERPRISE EDITION)
==============================================================================
An enterprise-grade diagnostic tool for evaluating Google Cloud Vertex AI 
model latency, token velocity, and regional endpoint availability.

Architecture:
- Utilizes the modern `google-genai` SDK for pure HTTP/gRPC inference.
- Employs a custom ASCII daemon thread to provide animated UX feedback without 
  blocking the synchronous network calls.
- Aggregates Min/Max/Avg latency to establish accurate regional baselines.
- Includes strict data-type safety nets to handle regional metadata inconsistencies.
==============================================================================
"""

import sys
import time
import threading
from typing import List, Dict
from google import genai
from google.genai.errors import APIError
from google.genai.types import HttpOptions, GenerateContentConfig

# ============================================================================
# CONFIGURATION CONSTANTS
# ============================================================================
PROJECT_ID = "jgaldamez-dev"
DEFAULT_PROMPT = "Explain the concept of multi-region cloud architecture in two sentences."
API_VERSIONS = ["v1", "v1beta1"]

# Terminal Colors
CYAN = '\033[0;36m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'

# ----------------------------------------------------------------------------
# MODEL REGISTRY
# ----------------------------------------------------------------------------
MODELS = {
    "Gemini (Pro)": [
        "gemini-3.1-pro-preview", "gemini-3-pro-preview", 
        "gemini-3-pro-image-preview", "gemini-2.5-pro"
    ],
    "Gemini (Flash)": [
        "gemini-3.1-flash-image-preview", "gemini-3-flash-preview", 
        "gemini-2.5-flash", "gemini-2.5-flash-image", 
        "gemini-live-2.5-flash-native-audio", 
        "gemini-2.0-flash-001", # Requires strict -001 suffix for Multi-Region
        "gemini-1.5-flash-002"  # Reliable fallback for v1 Multi-Region testing
    ],
    "Gemini (Flash-Lite)": [
        "gemini-3.1-flash-lite-preview", "gemini-2.5-flash-lite", 
        "gemini-2.0-flash-lite-001" # Requires strict -001 suffix for Multi-Region
    ],
    "Embeddings": [
        "text-embedding-005", "text-multilingual-embedding-002"
    ]
}

# ----------------------------------------------------------------------------
# DATACENTER REGISTRY
# ----------------------------------------------------------------------------
REGIONS = {
    "Macro-Regions (Global Load Balanced)": ["us", "eu", "global"],
    "United States": [
        "us-east5", "us-south1", "us-central1", "us-west4", 
        "us-west2", "us-east1", "us-east4", "us-west1", "us-west3"
    ],
    "Canada & South America": [
        "northamerica-northeast1", "northamerica-northeast2", 
        "southamerica-west1", "southamerica-east1"
    ],
    "Europe & Africa": [
        "africa-south1", "europe-west1", "europe-north1", "europe-west3", 
        "europe-west2", "europe-southwest1", "europe-west8", "europe-west4", 
        "europe-west9", "europe-west12", "europe-central2", "europe-west6"
    ],
    "Asia Pacific & Middle East": [
        "asia-east2", "asia-southeast2", "australia-southeast2", "asia-south1", 
        "asia-south2", "asia-northeast2", "asia-northeast3", "asia-southeast1", 
        "australia-southeast1", "asia-east1", "asia-northeast1",
        "me-central2", "me-central1", "me-west1"
    ]
}

# ============================================================================
# UX ANIMATION ENGINE
# ============================================================================
class ProgressVisualizer:
    """
    A non-blocking ASCII spinner that updates the terminal line in real-time.
    Runs on a background daemon thread to prevent freezing during HTTP calls.
    """
    def __init__(self, location, api_version, total_runs):
        self.location = location
        self.api_version = api_version
        self.total_runs = total_runs
        self.current_run = 1
        self.running = False
        self.thread = None

    def animate(self):
        chars = ['|', '/', '-', '\\']
        idx = 0
        while self.running:
            # \r forcefully overwrites the current terminal line
            sys.stdout.write(f"\r{CYAN}[*]{NC} Testing [ {YELLOW}{self.location}{NC} ] via [ {YELLOW}{self.api_version}{NC} ] ... {chars[idx % 4]} (Run {self.current_run}/{self.total_runs})")
            sys.stdout.flush()
            idx += 1
            time.sleep(0.1)

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self.animate, daemon=True)
        self.thread.start()

    def set_run(self, run_number):
        self.current_run = run_number

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        # Wipe the line clean so the final success/failure printout can take its place
        sys.stdout.write("\r" + " " * 80 + "\r")
        sys.stdout.flush()


# ============================================================================
# CORE TELEMETRY ENGINE
# ============================================================================
class TelemetryEngine:
    
    @staticmethod
    def test_endpoint(model_id: str, location: str, api_version: str, prompt: str, runs: int = 3) -> Dict:
        latencies = []
        token_count = 0
        success = False
        error_msg = ""
        
        # Start the background UI visualizer
        spinner = ProgressVisualizer(location, api_version, runs)
        spinner.start()
        
        try:
            client = genai.Client(
                vertexai=True, 
                project=PROJECT_ID, 
                location=location,
                http_options=HttpOptions(api_version=api_version)
            )

            # TOKEN CAP: Force the model to stop after 20 tokens to exponentially speed up the test loop
            config = GenerateContentConfig(max_output_tokens=20)

            for i in range(runs):
                spinner.set_run(i + 1) # Update the UI thread
                
                start_time = time.time()
                response = client.models.generate_content(
                    model=model_id,
                    contents=prompt,
                    config=config
                )
                end_time = time.time()
                
                latencies.append(end_time - start_time)
                
                # Safely extract token counts. SDK metadata structures can vary by model and region.
                try:
                    tokens = response.usage_metadata.candidates_token_count
                    # Google sometimes returns the object but leaves the value as None.
                    if tokens is not None:
                        token_count += tokens
                    else:
                        token_count += 20 # Fallback estimate
                except AttributeError:
                    token_count += 20 # Fallback estimate if metadata is blocked entirely
                
                time.sleep(1) # Prevent 429 self-throttling

            success = True
            
        except APIError as e:
            error_msg = f"HTTP {getattr(e, 'code', 'Error')}: {getattr(e, 'message', str(e))}"
        except Exception as e:
            error_msg = str(e)
            
        spinner.stop() # Kill the UI thread

        # Math Aggregations
        if success and latencies:
            avg_latency = sum(latencies) / len(latencies)
            min_latency = min(latencies)
            max_latency = max(latencies)
            avg_tokens = token_count / runs
            velocity = avg_tokens / avg_latency if avg_latency > 0 else 0.0
        else:
            avg_latency = min_latency = max_latency = velocity = 0.0

        return {
            "success": success,
            "min_lat": round(min_latency, 2),
            "max_lat": round(max_latency, 2),
            "avg_lat": round(avg_latency, 2),
            "velocity": round(velocity, 2),
            "error": error_msg
        }

# ============================================================================
# COMMAND LINE INTERFACE
# ============================================================================
def run_cli():
    print(f"\n{CYAN}============================================================{NC}")
    print(f"{CYAN}       VERTEX AI MESH PROFILER (ENTERPRISE EDITION){NC}")
    print(f"{CYAN}============================================================{NC}")
    
    # 1. Model Selection
    print("\n[+] Available Models:")
    all_models = [m for group in MODELS.values() for m in group]
    for idx, m in enumerate(all_models):
        print(f" {idx + 1}) {m}")
    m_idx = int(input("\n[?] Select Model Number: ")) - 1
    selected_model = all_models[m_idx]

    # 2. Regional Scope Selection
    print("\n[+] Regional Targeting Scope:")
    print(" 1) Test a single specific region")
    print(" 2) Test an entire geographical continent/group")
    print(" 3) Test EVERY region globally (Comprehensive Scan)")
    r_mode = input("\n[?] Select mode (1/2/3): ")

    selected_locations = []
    if r_mode == "1":
        all_regions = [r for group in REGIONS.values() for r in group]
        for idx, r in enumerate(all_regions):
            print(f" {idx + 1}) {r}")
        r_idx = int(input("\n[?] Select Region Number: ")) - 1
        selected_locations.append(all_regions[r_idx])
    elif r_mode == "2":
        groups = list(REGIONS.keys())
        for idx, g in enumerate(groups):
            print(f" {idx + 1}) {g}")
        g_idx = int(input("\n[?] Select Group Number: ")) - 1
        selected_locations = REGIONS[groups[g_idx]]
    else:
        selected_locations = [r for group in REGIONS.values() for r in group]

    # 3. Print Methodology Disclaimer
    print(f"\n{YELLOW}============================================================{NC}")
    print(f"{YELLOW} BENCHMARK METHODOLOGY & PHYSICS{NC}")
    print(f"{YELLOW}============================================================{NC}")
    print(f" [+] Inference Cap : Output restricted to 20 tokens to ensure rapid global polling.")
    print(f" [+] Latency Math  : Averages 3 distinct API calls to mitigate cold-start anomalies.")
    print(f" [+] Telemetry     : Captures Absolute Min, Max, and Average latency in seconds.")
    print(f" [+] Token Velocity: Measured as Output Tokens Per Second (TPS) across the run.")
    print(f" [+] Dual-Routing  : Tests both v1 and v1beta1 endpoints to map model propagation.")
    print(f"{YELLOW}============================================================{NC}\n")

    # 4. Execution & Logging Loop
    for loc in selected_locations:
        for api_ver in API_VERSIONS:
            res = TelemetryEngine.test_endpoint(selected_model, loc, api_ver, DEFAULT_PROMPT)
            
            if res["success"]:
                print(f"{GREEN}[SUCCESS]{NC} {loc:<25} ({api_ver:<7}) | Latency (s) -> Min: {res['min_lat']:<4} | Max: {res['max_lat']:<4} | Avg: {res['avg_lat']:<4} || Velocity: {res['velocity']} TPS")
            else:
                print(f"{RED}[FAILED]{NC}  {loc:<25} ({api_ver:<7}) | {res['error']}")
    
    print(f"\n{CYAN}[+] PROFILING COMPLETE.{NC}\n")

if __name__ == "__main__":
    run_cli()