"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: UX ANIMATION ENGINE
==============================================================================
A non-blocking daemon thread designed for CLI environments. Prevents UI freezing 
during synchronous HTTP calls to remote cloud endpoints.
==============================================================================
"""

import sys
import time
import threading
from .config import CYAN, YELLOW, NC

class ProgressVisualizer:
    """ASCII spinner that updates the terminal line in real-time."""
    
    def __init__(self, location: str, api_version: str, total_runs: int):
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
            # '\r' forcefully overwrites the terminal line to create animation
            sys.stdout.write(f"\r{CYAN}[*]{NC} Testing [ {YELLOW}{self.location}{NC} ] via [ {YELLOW}{self.api_version}{NC} ] ... {chars[idx % 4]} (Run {self.current_run}/{self.total_runs})")
            sys.stdout.flush()
            idx += 1
            time.sleep(0.1)

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self.animate, daemon=True)
        self.thread.start()

    def set_run(self, run_number: int):
        self.current_run = run_number

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        sys.stdout.write("\r" + " " * 100 + "\r")
        sys.stdout.flush()