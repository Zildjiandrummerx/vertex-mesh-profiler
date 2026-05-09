"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: CORE TELEMETRY ENGINE
==============================================================================
Encapsulates all network interactions with Cloud AI providers. Handles iteration, 
timing math, and robust error catching. Stripped of all CLI 'print' statements 
to ensure absolute compatibility with future REST/Web UI integrations.
==============================================================================
"""

import time
from typing import Dict
from google import genai
from google.genai.errors import APIError
from google.genai.types import HttpOptions, GenerateContentConfig

from .config import PROJECT_ID
from .visualizer import ProgressVisualizer

class TelemetryEngine:
    
    @staticmethod
    def test_endpoint(model_id: str, location: str, api_version: str, prompt: str, runs: int = 3, use_cli_spinner: bool = True) -> Dict:
        """Executes the diagnostic benchmark against a specified model endpoint."""
        latencies = []
        token_count = 0
        success = False
        error_msg = ""
         
        # Multi-Region Endpoint (mREP) Logic Bypass
        if location in ["us", "eu", "global"]:
            logical_location = "global"
            base_domain = f"aiplatform.googleapis.com" if location == "global" else f"{location}-aiplatform.googleapis.com"
        else:
            logical_location = location
            base_domain = f"{location}-aiplatform.googleapis.com"
           
        rest_url = f"https://{base_domain}/{api_version}/projects/{PROJECT_ID}/locations/{logical_location}/publishers/google/models/{model_id}:generateContent"
         
        # Optional UX spinner for CLI (Web UI will pass use_cli_spinner=False)
        spinner = ProgressVisualizer(location, api_version, runs) if use_cli_spinner else None
        if spinner: spinner.start()
         
        try:
            client = genai.Client(
                vertexai=True, 
                project=PROJECT_ID, 
                location=logical_location,
                http_options=HttpOptions(api_version=api_version, base_url=f"https://{base_domain}")
            )
            
            config = GenerateContentConfig(max_output_tokens=20)

            for i in range(runs):
                if spinner: spinner.set_run(i + 1) 
                 
                start_time = time.time()
                response = client.models.generate_content(model=model_id, contents=prompt, config=config)
                end_time = time.time()
                 
                latencies.append(end_time - start_time)
                 
                try:
                    tokens = response.usage_metadata.candidates_token_count
                    token_count += tokens if tokens is not None else 20 
                except AttributeError:
                    token_count += 20
                 
                time.sleep(1) # Rate limit protection

            success = True
           
        except APIError as e:
            code = getattr(e, 'code', 0)
            base_msg = getattr(e, 'message', str(e))
            
            if code == 501: error_msg = "HTTP 501 (NOT IMPLEMENTED): Region lacks GenAI control plane."
            elif code == 400: error_msg = "HTTP 400 (PRECONDITION FAILED): Hardware/Quota restriction."
            elif code == 404: error_msg = "HTTP 404 (NOT FOUND): Model version missing from regional catalog."
            else: error_msg = f"HTTP {code}: {base_msg}"
             
        except Exception as e:
            error_msg = f"SYSTEM EXCEPTION: {str(e)}"
           
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