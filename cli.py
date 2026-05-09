"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK - CLI ENTRY POINT
==============================================================================
Executes the Command Line Engine.
==============================================================================
"""

from app.cli_engine import run_cli

if __name__ == "__main__":
    try:
        run_cli()
    except KeyboardInterrupt:
        print("\n\n[!] Execution terminated by user. Shutting down securely.")