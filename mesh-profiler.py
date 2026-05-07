"""
==============================================================================
VERTEX AI MESH PROFILER (ENTERPRISE EDITION)
==============================================================================
An enterprise-grade diagnostic tool for evaluating Google Cloud Vertex AI 
model latency, token velocity, and regional endpoint availability.

Architecture & Features:
- Pure REST/gRPC Inference: Utilizes the modern `google-genai` SDK.
- The M-REP Bypass: Decouples physical DNS routing from logical model catalogs
  to test Multi-Region Endpoints (mREPs) without violating Data Residency.
- Animated UX: Employs a custom ASCII daemon thread for non-blocking feedback.
- Telemetry Aggregation: Calculates Absolute Min, Max, Avg latency, and TPS.
- Heuristic Recommendation Engine: Automatically parses success metrics to 
  designate regional "Champions" and "Hardware Deserts".
==============================================================================
"""

import sys, time, threading
from typing import List, Dict
from google import genai
from google.genai.errors import APIError
from google.genai.types import HttpOptions, GenerateContentConfig

# ============================================================================
# 1. CONFIGURATION CONSTANTS & AESTHETICS
# ============================================================================
# Target GCP Project ID billed for the inference requests.
#PROJECT_ID = "your-target-project-id"
PROJECT_ID = "jgaldamez-dev"

# Standardized prompt to ensure identical computational load across all regions.
DEFAULT_PROMPT = "Explain the concept of multi-region cloud architecture in two sentences."

# Dual-Routing check to map model propagation across both Production and Preview endpoints.
API_VERSIONS = ["v1", "v1beta1"]

# Standard ANSI escape codes for sterile, professional terminal output.
CYAN = '\033[0;36m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'

# ============================================================================
# 2. THE MODEL & DATACENTER REGISTRIES
# ============================================================================

# Model Registry: Categorized for future extensibility (e.g., third-party models).
# Note: Multi-region endpoints often require strict, pinned versions (-001, -002).
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
        "gemini-1.5-flash-002"  # Reliable fallback for legacy multi-region testing
    ],
    "Gemini (Flash-Lite)": [
        "gemini-3.1-flash-lite-preview", "gemini-2.5-flash-lite", 
        "gemini-2.0-flash-lite-001" 
    ],
    "Embeddings": [
        "text-embedding-005", "text-multilingual-embedding-002"
    ]
}

# Datacenter Registry: ISO 3166-1 alpha-2 based location IDs.
# Used to discover "dark regions", hardware deserts, and high-performance hubs.
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
# 3. UX ANIMATION ENGINE (DAEMON THREAD)
# ============================================================================
class ProgressVisualizer:
    """
    A non-blocking ASCII spinner that updates the terminal line in real-time.
    Runs on a background daemon thread to prevent UI freezing during synchronous HTTP calls.
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
            # '\r' forcefully overwrites the current terminal line to create animation
            sys.stdout.write(f"\r{CYAN}[*]{NC} Testing [ {YELLOW}{self.location}{NC} ] via [ {YELLOW}{self.api_version}{NC} ] ... {chars[idx % 4]} (Run {self.current_run}/{self.total_runs})")
            sys.stdout.flush()
            idx += 1
            time.sleep(0.1)

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self.animate, daemon=True)
        self.thread.start()

    def set_run(self, run_number):
        """Updates the loop counter displayed in the UI."""
        self.current_run = run_number

    def stop(self):
        """Kills the thread and wipes the terminal line clean for the final output."""
        self.running = False
        if self.thread:
            self.thread.join()
        sys.stdout.write("\r" + " " * 100 + "\r")
        sys.stdout.flush()


# ============================================================================
# 4. CORE TELEMETRY ENGINE
# ============================================================================
class TelemetryEngine:
    """
    Encapsulates the network calls to Vertex AI. Handles iteration, timing math, 
    and robust error catching to ensure regional outages do not crash the suite.
    """
    
    @staticmethod
    def test_endpoint(model_id: str, location: str, api_version: str, prompt: str, runs: int = 3) -> Dict:
        latencies = []
        token_count = 0
        success = False
        error_msg = ""
         
        # --------------------------------------------------------------------
        # THE M-REP ROUTING BYPASS (Physical vs Logical)
        # --------------------------------------------------------------------
        # Multi-Region Endpoints (mREPs) like 'us' and 'eu' are proxies. 
        # They physically keep data within their respective borders, but logically 
        # require the SDK to request models from the 'global' catalog.
        if location in ["us", "eu"]:
            logical_location = "global"
            base_domain = f"{location}-aiplatform.googleapis.com"
        elif location == "global":
            logical_location = "global"
            base_domain = "aiplatform.googleapis.com"
        else:
            # Standard regional datacenters use matching logical and physical strings
            logical_location = location
            base_domain = f"{location}-aiplatform.googleapis.com"
           
        # Construct the exact REST API URL for developer reference
        rest_url = f"https://{base_domain}/{api_version}/projects/{PROJECT_ID}/locations/{logical_location}/publishers/google/models/{model_id}:generateContent"
         
        # Start the background UI visualizer
        spinner = ProgressVisualizer(location, api_version, runs)
        spinner.start()
         
        try:
            # Initialize the SDK, forcefully overriding the base URL to bypass SDK routing limitations
            client = genai.Client(
                vertexai=True, 
                project=PROJECT_ID, 
                location=logical_location, # Tells the SDK what folder to ask for
                http_options=HttpOptions(
                    api_version=api_version,
                    base_url=f"https://{base_domain}" # Tells the SDK which physical server to hit
                )
            )
            
            # TOKEN CAP: Force the model to stop after 20 tokens to exponentially speed up the test loop
            config = GenerateContentConfig(max_output_tokens=20)

            # Loop the request to establish a true average latency (mitigating cold starts)
            for i in range(runs):
                spinner.set_run(i + 1) 
                 
                start_time = time.time()
                response = client.models.generate_content(
                    model=model_id,
                    contents=prompt,
                    config=config
                )
                end_time = time.time()
                 
                latencies.append(end_time - start_time)
                 
                # Safely extract token counts. SDK metadata structures vary by model and region.
                try:
                    tokens = response.usage_metadata.candidates_token_count
                    # Failsafe: Google sometimes returns the object but leaves the value as None.
                    if tokens is not None:
                        token_count += tokens
                    else:
                        token_count += 20 
                except AttributeError:
                    token_count += 20 # Fallback estimate if metadata is blocked entirely
                 
                # Throttling to prevent triggering HTTP 429 errors from our own aggressive polling
                time.sleep(1) 

            success = True
           
        except APIError as e:
            # Safely extract error properties
            code = getattr(e, 'code', 0)
            base_msg = getattr(e, 'message', str(e))
            
            # Probabilistic Error Diagnosis based on known Google Cloud deployment patterns
            if code == 501:
                error_msg = f"HTTP 501 (NOT IMPLEMENTED): This datacenter may not yet be onboarded to the Generative AI control plane."
            elif code == 400:
                error_msg = f"HTTP 400 (PRECONDITION FAILED): Region might lack required TPU/GPU hardware, or IAM/Org policies restrict access."
            elif code == 404:
                error_msg = f"HTTP 404 (NOT FOUND): The requested model version has likely not propagated to this specific regional catalog yet."
            else:
                error_msg = f"HTTP {code}: {base_msg}"
             
        except Exception as e:
            # Catch-all for network drops or local ADC credential failures
            error_msg = f"SYSTEM EXCEPTION: {str(e)}"
           
        spinner.stop()

        # Mathematical Telemetry Aggregations
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
            "rest_url": rest_url,
            "error": error_msg
        }


# ============================================================================
# 5. COMMAND LINE INTERFACE & RECOMMENDATION ENGINE
# ============================================================================
def run_cli():
    """Executes the suite entirely within standard output streams."""
    print(f"\n{CYAN}===================================================================={NC}")
    print(f"{CYAN}           VERTEX AI MESH PROFILER (ENTERPRISE EDITION){NC}")
    print(f"{CYAN}===================================================================={NC}")
     
    # --- Menu: Model Selection ---
    print("\n[+] Available Models:")
    all_models = [m for group in MODELS.values() for m in group]
    for idx, m in enumerate(all_models):
        print(f" {idx + 1}) {m}")
    m_idx = int(input("\n[?] Select Model Number: ")) - 1
    selected_model = all_models[m_idx]

    # --- Menu: Scope Selection ---
    print("\n[+] Regional Targeting Scope:")
    print(" 1) Test a single specific region")
    print(" 2) Test an entire geographical continent/group")
    print(" 3) Test EVERY region globally (Comprehensive Scan)")
    r_mode = input("\n[?] Select mode [1] [2] [3]: ")

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

    # STRICT DEDUPLICATION LOCK: Prevents overlapping groups from triggering duplicate scans
    selected_locations = list(dict.fromkeys(selected_locations))

    # --- Print Methodology Header ---
    print(f"\n{YELLOW}=================================================================================={NC}")
    print(f"{YELLOW}       BENCHMARK METHODOLOGY & INFRASTRUCTURE DIAGNOSTICS{NC}")
    print(f"{YELLOW}=================================================================================={NC}")
    print(f" [+] Inference Cap : Output restricted to 20 tokens to ensure rapid polling.")
    print(f" [+] Latency Math  : Averages 3 distinct API calls to mitigate cold-starts.")
    print(f" [+] Telemetry     : Captures Absolute Min, Max, and Average latency (sec).")
    print(f" [+] Token Velocity: Output Tokens Per Second (TPS) across the run.")
    print(f" [+] Dual-Routing  : Tests both v1 and v1beta1 endpoints for model propagation.")
    print(f"")
    print(f" [!] DIAGNOSTIC STATUS CODES:")
    print(f"   • 404 (Not Found)       -> Model likely missing from regional catalog.")
    print(f"   • 400 (Precondition)    -> Region may lack required TPU/GPU hardware.")
    print(f"   • 501 (Not Implemented) -> Region lacks GenAI control plane onboarding.")
    print(f"{YELLOW}=================================================================================={NC}\n")

    # Aggregator array used to generate the final Executive Summary
    successful_hubs = []

    # --- Execution Loop ---
    for loc in selected_locations:
        for api_ver in API_VERSIONS:
            res = TelemetryEngine.test_endpoint(selected_model, loc, api_ver, DEFAULT_PROMPT)
             
            if res["success"]:
                # Only log the v1 endpoint for recommendations to avoid clutter, 
                # unless v1 failed and v1beta1 succeeded.
                if api_ver == "v1" or not any(hub['loc'] == loc for hub in successful_hubs):
                    successful_hubs.append({
                        "loc": loc,
                        "tps": res['velocity']
                    })
                     
                print(f"{GREEN}[SUCCESS]{NC} {loc} ({api_ver})")
                print(f" ├─ REST API : {CYAN}{res['rest_url']}{NC}")
                print(f" └─ Telemetry: Min: {res['min_lat']}s | Max: {res['max_lat']}s | Avg: {res['avg_lat']}s | Velocity: {res['velocity']} TPS\n")
            else:
                print(f"{RED}[FAILED]{NC} {loc} ({api_ver})")
                print(f" ├─ REST API : {CYAN}{res['rest_url']}{NC}")
                print(f" └─ Diagnosis: {YELLOW}{res['error']}{NC}\n")
     
    # ========================================================================
    # 6. THE RECOMMENDATION ENGINE (EXECUTIVE SUMMARY)
    # ========================================================================
    if len(selected_locations) > 1:
        print(f"\n{CYAN}==================================================================================================={NC}")
        print(f"{CYAN} EXECUTIVE SUMMARY: HIGH-PERFORMANCE ROUTING MAP ({selected_model}){NC}")
        print(f"{CYAN}==================================================================================================={NC}")
         
        if not successful_hubs:
            print(f"\n {RED}[!] CRITICAL FAILURE: Zero successful connections detected.{NC}")
            print(f"     This model may be completely deprecated, or your GCP project lacks")
            print(f"     fundamental quotas/permissions to access the Generative AI APIs.")
        else:
            # Check if ONLY Macro-Regions were selected so we don't accidentally filter them out
            is_macro_only = all(loc in ['global', 'us', 'eu'] for loc in selected_locations)
            
            if is_macro_only:
                champions = [h['loc'] for h in successful_hubs if h['tps'] >= 15.0]
                secondary = [h['loc'] for h in successful_hubs if h['tps'] < 15.0]
            else:
                # Standard logic: Filter out macro-regions so they don't muddy local datacenter results
                champions = [h['loc'] for h in successful_hubs if h['tps'] >= 15.0 and h['loc'] not in ['global', 'us', 'eu']]
                secondary = [h['loc'] for h in successful_hubs if h['tps'] < 15.0 and h['loc'] not in ['global', 'us', 'eu']]
             
            if champions:
                print(f" {GREEN}[+] Primary Hubs (>15 TPS) :{NC} {', '.join(champions)}")
            
            if secondary:
                print(f" {YELLOW}[~] Secondary Hubs (<15 TPS):{NC} {', '.join(secondary)}")
                
            # THE REGIONAL DESERT FALLBACK
            # If standard regions were tested but ALL failed, explicitly praise the surviving macro-regions
            if not champions and not secondary:
                macro_survivors = [h['loc'] for h in successful_hubs if h['loc'] in ['global', 'us', 'eu']]
                if macro_survivors:
                    print(f" {RED}[!] Regional Desert Detected :{NC} All localized datacenters failed or were filtered.")
                    print(f"                                However, Macro-Regions remained operational: {', '.join(macro_survivors)}")
             
        print(f"\n {CYAN}[!] ARCHITECTURAL GUIDANCE:{NC}")
        print(f"   • Production Stability: Use the 'global' endpoint for the best balance of")
        print(f"    availability and latency unless data residency requirements strictly")
        print(f"    mandate a specific region (e.g., 'us' or 'eu').")
        print(f"   • Versioning: Use 'v1' for stability. Use 'v1beta1' only for cutting-edge")
        print(f"    features (Thinking Mode, Live API) that haven't graduated to general availability yet.")
        print(f"{CYAN}==================================================================================================={NC}\n")

    print(f"{GREEN}[+] PROFILING COMPLETE.{NC}\n")

# Entry Execution
if __name__ == "__main__":
    run_cli()