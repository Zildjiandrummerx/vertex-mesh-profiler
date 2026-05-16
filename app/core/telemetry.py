"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: CORE TELEMETRY ENGINE (BARE-METAL UPGRADE)
==============================================================================
"""

import time
import requests
import google.auth
from google.auth.transport.requests import Request
from typing import Dict
from google import genai
from google.genai import errors as GoogleGenaiErrors
from google.genai.types import HttpOptions, GenerateContentConfig

from .config import PROJECT_ID
from .visualizer import ProgressVisualizer

class TelemetryEngine:

    @staticmethod
    def _get_gcp_token() -> str:
        """Securely retrieves the OAuth2 token for bare-metal REST API calls."""
        credentials, _ = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        credentials.refresh(Request())
        return credentials.token
    
    @staticmethod
    def _resolve_publisher(model_id: str) -> str:
        m = model_id.lower()
        if "claude" in m: return "anthropic"
        if "mistral" in m or "codestral" in m: return "mistralai"
        if "deepseek" in m: return "deepseek-ai"
        if "llama" in m: return "meta"
        return "google"

    @staticmethod
    def test_endpoint(model_id: str, location: str, api_version: str, prompt: str, runs: int = 3, use_cli_spinner: bool = True) -> Dict:
        latencies = []
        token_count = 0
        success = False
        error_msg = ""
         
        publisher = TelemetryEngine._resolve_publisher(model_id)
        
        # ====================================================================
        # TOPOLOGICAL ROUTING MAP
        # ====================================================================
        base_domain = ""
        url_location = location
        effective_location = location
        rest_url = ""
        
        if publisher == "anthropic":
            # 1. ANTHROPIC TOPOLOGY (Strict Multi-Region mREP Routing)
            if location == "global":
                base_domain = "aiplatform.googleapis.com"
            elif location in ["us", "eu"]:
                base_domain = f"aiplatform.{location}.rep.googleapis.com"
            else:
                base_domain = f"{location}-aiplatform.googleapis.com"
                
            full_model_path = f"publishers/{publisher}/models/{model_id}"
            rest_url = f"https://{base_domain}/{api_version}/projects/{PROJECT_ID}/locations/{url_location}/{full_model_path}:rawPredict"
            
        else:
            # 2. STANDARD / GOOGLE TOPOLOGY (generateContent mapping)
            if location == "global":
                # Fixed: Global Endpoint does NOT use a prefix
                base_domain = "aiplatform.googleapis.com"
                url_location = "global"
                effective_location = "global"
            elif location == "us":
                # Fixed: Google US Macro maps to us-central1
                base_domain = "us-central1-aiplatform.googleapis.com"
                url_location = "us-central1"
                effective_location = "us-central1"
            elif location == "eu":
                # Fixed: Google EU Macro maps to europe-west1
                base_domain = "europe-west1-aiplatform.googleapis.com"
                url_location = "europe-west1"
                effective_location = "europe-west1"
            else:
                base_domain = f"{location}-aiplatform.googleapis.com"
                url_location = location
                effective_location = location

            full_model_path = f"publishers/{publisher}/models/{model_id}"
            rest_url = f"https://{base_domain}/{api_version}/projects/{PROJECT_ID}/locations/{url_location}/{full_model_path}:generateContent"

        spinner = ProgressVisualizer(location, api_version, runs) if use_cli_spinner else None
        if spinner: spinner.start()
         
        try:
            # ====================================================================
            # BARE-METAL POLYGLOT EXECUTION
            # ====================================================================
            if publisher == "anthropic":
                # BRANCH A: Pure HTTP REST for Partner Models (No SDK Abstraction)
                token = TelemetryEngine._get_gcp_token()
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "anthropic_version": "vertex-2023-10-16",
                    "max_tokens": 20,
                    "messages": [{"role": "user", "content": prompt}]
                }
                
                for i in range(runs):
                    if spinner: spinner.set_run(i + 1)
                    start_time = time.time()
                    
                    response = requests.post(rest_url, headers=headers, json=payload)
                    end_time = time.time()
                    
                    if response.status_code == 200:
                        latencies.append(end_time - start_time)
                        data = response.json()
                        tokens = data.get("usage", {}).get("output_tokens", 20)
                        token_count += tokens
                    else:
                        raise Exception(f"HTTP {response.status_code}: {response.text}")
                    
                    time.sleep(1)
                    
                success = True

            else:
                # BRANCH B: Native genai SDK for Google/Meta/Mistral
                client = genai.Client(
                    vertexai=True, 
                    project=PROJECT_ID, 
                    location=effective_location,
                    # Base URL correctly forces the exact domain mapped above
                    http_options=HttpOptions(api_version=api_version, base_url=f"https://{base_domain}")
                )
                config = GenerateContentConfig(max_output_tokens=20)

                for i in range(runs):
                    if spinner: spinner.set_run(i + 1) 
                    start_time = time.time()
                    
                    response = client.models.generate_content(model=full_model_path, contents=prompt, config=config)
                    end_time = time.time()
                    latencies.append(end_time - start_time)
                    
                    try:
                        tokens = response.usage_metadata.candidates_token_count
                        token_count += tokens if tokens is not None else 20 
                    except AttributeError:
                        token_count += 20
                    time.sleep(1)

                success = True
           
        # ====================================================================
        # EXCEPTION HANDLING
        # ====================================================================
        except GoogleGenaiErrors.APIError as e:
            code = getattr(e, 'code', 0)
            base_msg = getattr(e, 'message', str(e))
            if code == 501: error_msg = "HTTP 501 (NOT IMPLEMENTED): Region lacks GenAI control plane."
            elif code == 400: error_msg = "HTTP 400 (PRECONDITION FAILED): Hardware/Quota restriction or invalid location."
            elif code == 404: error_msg = "HTTP 404 (NOT FOUND): Model/version missing from regional catalog."
            else: error_msg = f"HTTP {code}: {base_msg}"
             
        except Exception as e:
            error_msg = f"Diagnosis: {str(e)}"
           
        if spinner: spinner.stop()

        if success and latencies:
            avg_latency = sum(latencies) / len(latencies)
            min_latency = min(latencies)
            max_latency = max(latencies)
            velocity = (token_count / runs) / avg_latency if avg_latency > 0 else 0.0
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