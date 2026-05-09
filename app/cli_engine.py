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

from app.core.config import CYAN, GREEN, YELLOW, RED, NC, DEFAULT_PROMPT, API_VERSIONS
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
    # 4. METHODOLOGY HEADER & EXECUTION
    # ========================================================================
    print(f"\n{YELLOW}=================================================================================={NC}")
    print(f"{YELLOW}       BENCHMARK METHODOLOGY & INFRASTRUCTURE DIAGNOSTICS{NC}")
    print(f"{YELLOW}=================================================================================={NC}")
    print(f" [+] Inference Cap : Output restricted to 20 tokens for rapid polling.")
    print(f" [+] Telemetry     : Captures Absolute Min, Max, and Average latency (sec).")
    print(f" [+] Token Velocity: Output Tokens Per Second (TPS) across the run.")
    print(f"{YELLOW}=================================================================================={NC}\n")

    # Aggregator array used to generate the final Executive Summary metrics
    successful_hubs = []

    # Iterates through every chosen location and tests both v1 and v1beta1 endpoints
    for loc in selected_locations:
        for api_ver in API_VERSIONS:
            # Invokes the decoupled Telemetry Engine
            res = TelemetryEngine.test_endpoint(selected_model, loc, api_ver, DEFAULT_PROMPT, use_cli_spinner=True)
             
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
    # 5. HEURISTIC RECOMMENDATION ENGINE (EXECUTIVE SUMMARY)
    # ========================================================================
    # Only triggers if a multi-region scan was performed. Analyzes the aggregated
    # telemetry data to recommend optimal routing architectures.
    if len(selected_locations) > 1:
        print(f"\n{CYAN}==================================================================================================={NC}")
        print(f"{CYAN} EXECUTIVE SUMMARY: HIGH-PERFORMANCE ROUTING MAP ({selected_model}){NC}")
        print(f"{CYAN}==================================================================================================={NC}")
        
        if not successful_hubs:
            print(f"\n {RED}[!] CRITICAL FAILURE: Zero successful connections detected.{NC}")
        else:
            # Check if ONLY Macro-Regions (mREPs) were selected so we don't accidentally filter them out
            is_macro_only = all(loc in ['global', 'us', 'eu'] for loc in selected_locations)
            
            # Segregates standard regions based on Token Velocity (TPS)
            champions = [h['loc'] for h in successful_hubs if h['tps'] >= 15.0 and (is_macro_only or h['loc'] not in ['global', 'us', 'eu'])]
            secondary = [h['loc'] for h in successful_hubs if h['tps'] < 15.0 and (is_macro_only or h['loc'] not in ['global', 'us', 'eu'])]
             
            if champions: 
                print(f" {GREEN}[+] Primary Hubs (>15 TPS) :{NC} {', '.join(champions)}")
            if secondary: 
                print(f" {YELLOW}[~] Secondary Hubs (<15 TPS):{NC} {', '.join(secondary)}")
                
            # THE REGIONAL DESERT FALLBACK
            # If localized datacenters failed or were unavailable for the model, explicitly highlight
            # surviving Macro-Regions to ensure the operator knows the model is still accessible globally.
            if not champions and not secondary:
                macro_survivors = [h['loc'] for h in successful_hubs if h['loc'] in ['global', 'us', 'eu']]
                if macro_survivors:
                    print(f" {RED}[!] Regional Desert Detected :{NC} Macro-Regions remained operational: {', '.join(macro_survivors)}")
        
        print(f"{CYAN}==================================================================================================={NC}\n")

    print(f"{GREEN}[+] PROFILING COMPLETE.{NC}\n")