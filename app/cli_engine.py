"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: COMMAND LINE INTERFACE ORCHESTRATOR
==============================================================================
Handles user input and terminal presentation. Orchestrates the TelemetryEngine
without mutating the core network logic, maintaining pure Separation of Concerns
(Hexagonal Architecture). 

By isolating this presentation layer, the underlying telemetry engine remains
fully compatible with future REST APIs or Flask Web UIs.
==============================================================================
"""

from app.core.config import (
    CYAN, GREEN, YELLOW, RED, NC, API_VERSIONS, 
    PROMPT_DIAGNOSTIC, PROMPT_STANDARD, PROMPT_STRESS
)
from app.core.registries import MODELS, REGIONS
from app.core.telemetry import TelemetryEngine

def run_cli():
    """
    Executes the diagnostic suite entirely within standard output streams.
    Provides an interactive terminal menu for model and regional scope selection.
    """
    
    # ========================================================================
    # 1. INITIALIZATION & BRANDING
    # ========================================================================
    print(f"\n{CYAN}===================================================================={NC}")
    print(f"{CYAN}           ENTERPRISE MULTI-MODEL MESH PROFILER{NC}")
    print(f"{CYAN}===================================================================={NC}")
     
    # ========================================================================
    # 2. DYNAMIC MODEL SELECTION
    # ========================================================================
    # ARCHITECTURAL NOTE: Instead of hardcoding menus, we dynamically flatten
    # the dictionary from `registries.py`. If 50 new models are added to the 
    # registry tomorrow, this menu automatically scales without any code changes.
    print("\n[+] Available Models:")
    
    # Flatten the grouped dictionary into a single sequential list
    all_models = [m for group in MODELS.values() for m in group]
    
    for idx, m in enumerate(all_models):
        print(f" {idx + 1}) {m}")
        
    m_idx = int(input("\n[?] Select Model Number: ")) - 1
    selected_model = all_models[m_idx]

    # ========================================================================
    # 3. REGIONAL SCOPE TARGETING
    # ========================================================================
    # Allows the operator to test a single datacenter, a specific continent,
    # or trigger a massive global benchmark across all physical locations.
    print("\n[+] Regional Targeting Scope:")
    print(" 1) Test a single specific region")
    print(" 2) Test an entire geographical continent/group")
    print(" 3) Test EVERY region globally (Comprehensive Scan)")
    r_mode = input("\n[?] Select mode [1] [2] [3]: ")

    selected_locations = []
    
    if r_mode == "1":
        # Flatten all regions for a single selection
        all_regions = [r for group in REGIONS.values() for r in group]
        for idx, r in enumerate(all_regions):
            print(f" {idx + 1}) {r}")
        r_idx = int(input("\n[?] Select Region Number: ")) - 1
        selected_locations.append(all_regions[r_idx])
        
    elif r_mode == "2":
        # Display high-level continental groups
        groups = list(REGIONS.keys())
        for idx, g in enumerate(groups):
            print(f" {idx + 1}) {g}")
        g_idx = int(input("\n[?] Select Group Number: ")) - 1
        selected_locations = REGIONS[groups[g_idx]]
        
    else:
        # Global Scan: Ingest every single region in the registry
        selected_locations = [r for group in REGIONS.values() for r in group]

    # STRICT DEDUPLICATION LOCK
    # Ensures that if overlapping groups were somehow selected, we never ping 
    # the same datacenter twice in one run, saving API quotas and time.
    selected_locations = list(dict.fromkeys(selected_locations))

    # ========================================================================
    # 3.5. DYNAMIC LOAD PROFILE (THE EDGES)
    # ========================================================================
    # Evaluates user input against specific boundaries to automatically scale 
    # the complexity of the prompt. This ensures the GPU/TPU is actually stressed 
    # rather than just finishing a simple prompt in 2 tokens.
    print(f"\n{YELLOW}[+] Select Inference Load Profile{NC}")
    token_input = input(f"[?] Enter Max Output Tokens [Press ENTER for Default: 20]: ").strip()
    
    # Defaulting mechanism
    if not token_input:
        max_tokens = 20
    else:
        try:
            max_tokens = int(token_input)
        except ValueError:
            print(f"{RED}[!] Invalid input. Defaulting to 20 tokens.{NC}")
            max_tokens = 20

    # Boundary Evaluation (Edges)
    if max_tokens <= 50:
        tier_name = "Diagnostic Ping"
        active_prompt = PROMPT_DIAGNOSTIC
        physics_explanation = "Measuring Network Latency and Time-To-First-Token (TTFT). Sustained Token Velocity (TPS) will be mathematically lower due to HTTP handshake overhead."
    elif max_tokens <= 500:
        tier_name = "Standard Payload"
        active_prompt = PROMPT_STANDARD
        physics_explanation = "Forcing moderate computational load. Provides a balanced measurement of real-world API responsiveness and sustained Token Velocity (TPS)."
    else:
        tier_name = "Stress Test"
        active_prompt = PROMPT_STRESS
        physics_explanation = "Injecting complex prompt to force maximum GPU/TPU utilization. Exposes absolute sustained Token Velocity (TPS) and hardware throttling limits."

    # ========================================================================
    # 4. METHODOLOGY HEADER & EXECUTION
    # ========================================================================
    print(f"\n{YELLOW}=================================================================================={NC}")
    print(f"{YELLOW}       BENCHMARK METHODOLOGY & INFRASTRUCTURE DIAGNOSTICS{NC}")
    print(f"{YELLOW}=================================================================================={NC}")
    print(f" [+] Inference Cap : {CYAN}{max_tokens} Tokens ({tier_name}){NC}")
    print(f" [+] Physics       : {physics_explanation}")
    print(f" [+] Telemetry     : Captures Absolute Min, Max, and Average latency (sec).")
    print(f"{YELLOW}=================================================================================={NC}\n")

    # Aggregator array used to generate the final Executive Summary metrics
    successful_hubs = []

    # Iterates through every chosen location and tests both v1 and v1beta1 endpoints
    for loc in selected_locations:
        for api_ver in API_VERSIONS:
            # Invokes the decoupled Telemetry Engine with the dynamic payload
            res = TelemetryEngine.test_endpoint(
                model_id=selected_model, 
                location=loc, 
                api_version=api_ver, 
                prompt=active_prompt, 
                max_tokens=max_tokens, 
                runs=3, 
                use_cli_spinner=True
            )
             
            if res["success"]:
                # To keep the executive summary clean, we prioritize logging the 'v1' 
                # success. If 'v1' fails but 'v1beta1' succeeds, we log the beta version.
                if api_ver == "v1" or not any(hub['loc'] == loc for hub in successful_hubs):
                    successful_hubs.append({"loc": loc, "tps": res['velocity']})
                     
                print(f"{GREEN}[SUCCESS]{NC} {loc} ({api_ver})")
                print(f" ├─ REST API : {CYAN}{res['rest_url']}{NC}")
                print(f" └─ Telemetry: Min: {res['min_lat']}s | Max: {res['max_lat']}s | Avg: {res['avg_lat']}s | Velocity: {res['velocity']} TPS\n")
            else:
                print(f"{RED}[FAILED]{NC} {loc} ({api_ver})")
                print(f" ├─ REST API : {CYAN}{res['rest_url']}{NC}")
                print(f" └─ Diagnosis: {YELLOW}{res['error']}{NC}\n")
     
    # ========================================================================
    # 5. PERCENTILE HEURISTIC ENGINE (EXECUTIVE SUMMARY)
    # ========================================================================
    # Only triggers if a multi-region scan was performed. Analyzes the aggregated
    # telemetry data using a relative Percentile Baseline to recommend optimal routing.
    if len(selected_locations) > 1:
        print(f"\n{CYAN}==================================================================================================={NC}")
        print(f"{CYAN} EXECUTIVE SUMMARY: HIGH-PERFORMANCE ROUTING MAP ({selected_model}){NC}")
        print(f"{CYAN}==================================================================================================={NC}")
        
        if not successful_hubs:
            print(f"\n {RED}[!] CRITICAL FAILURE: Zero successful connections detected.{NC}")
        else:
            # Sort datacenters by TPS descending to prepare for percentile slicing
            successful_hubs.sort(key=lambda x: x['tps'], reverse=True)
            
            # Check if ONLY Macro-Regions (mREPs) were selected so we don't accidentally filter them out
            is_macro_only = all(loc in ['global', 'us', 'eu'] for loc in selected_locations)
            
            # Percentile Math: Top 33% are Champions (Minimum 1)
            total_hubs = len(successful_hubs)
            top_n = max(1, total_hubs // 3) if total_hubs > 1 else 1
            
            # Segregate datacenters based on their dynamic percentile rank
            champions = [h['loc'] for h in successful_hubs[:top_n] if (is_macro_only or h['loc'] not in ['global', 'us', 'eu'])]
            secondary = [h['loc'] for h in successful_hubs[top_n:] if (is_macro_only or h['loc'] not in ['global', 'us', 'eu'])]
             
            # Static formatting: prints "None" if the array is empty instead of disappearing
            champ_str = ", ".join(champions) if champions else "None"
            sec_str = ", ".join(secondary) if secondary else "None"
            
            print(f" {GREEN}[+] Primary Hubs (Top Percentile)  :{NC} {champ_str}")
            print(f" {YELLOW}[~] Secondary Hubs (Mid/Low Tier)  :{NC} {sec_str}")
                
            # THE REGIONAL DESERT FALLBACK
            # If localized datacenters failed or were unavailable for the model, explicitly highlight
            # surviving Macro-Regions to ensure the operator knows the model is still accessible globally.
            if not champions and not secondary:
                macro_survivors = [h['loc'] for h in successful_hubs if h['loc'] in ['global', 'us', 'eu']]
                if macro_survivors:
                    print(f" {RED}[!] Regional Desert Detected :{NC} Macro-Regions remained operational: {', '.join(macro_survivors)}")
        
        print(f"{CYAN}==================================================================================================={NC}\n")

    print(f"{GREEN}[+] PROFILING COMPLETE.{NC}\n")