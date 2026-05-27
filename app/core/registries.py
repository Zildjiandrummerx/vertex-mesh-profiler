"""
==============================================================================
ENTERPRISE MULTI-MODEL GENAI FRAMEWORK
MODULE: MODEL & DATACENTER REGISTRIES
==============================================================================
Acts as the authoritative database for supported LLMs and physical datacenter 
locations. This matrix supports Google Vertex AI native models, Partner Models 
(Anthropic, Mistral, xAI), and Open Models (DeepSeek, Llama, Qwen, etc.).
==============================================================================
"""

# ============================================================================
# THE GLOBAL MODEL REGISTRY
# ============================================================================
# Grouped logically. The CLI Engine will dynamically parse these categories
# and present them as a clean, structured menu to the user.
MODELS = {
    # ---------------------------------------------------------
    # GOOGLE VERTEX AI: NATIVE MODELS
    # ---------------------------------------------------------
    "Google Vertex AI: Gemini (Pro)": [
        "gemini-3.1-pro-preview", 
        "gemini-3.1-pro-preview-customtools",
        "gemini-3-pro-preview", 
        "gemini-3-pro-image-preview", 
        "gemini-2.5-pro"
    ],
    "Google Vertex AI: Gemini (Flash)": [
        "gemini-3.5-flash",
        "gemini-3.1-flash-image-preview", 
        "gemini-3-flash-preview", 
        "gemini-2.5-flash", 
        "gemini-2.5-flash-image", 
        "gemini-live-2.5-flash-native-audio", 
        "gemini-2.0-flash",
        "gemini-2.0-flash-001", 
        "gemini-1.5-flash-002"  
    ],
    "Google Vertex AI: Gemini (Flash-Lite)": [
        "gemini-3.1-flash-lite-preview", 
        "gemini-2.5-flash-lite", 
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-lite-001" 
    ],
    "Google Vertex AI: Embeddings": [
        "gemini-embedding-2",
        "text-embedding-005", 
        "text-multilingual-embedding-002"
    ],

    # ---------------------------------------------------------
    # PARTNER MODELS
    # ---------------------------------------------------------
    "Partner Models: Anthropic (Claude)": [
        "claude-opus-4-7",
        "claude-opus-4-6",
        "claude-opus-4-5",
        "claude-opus-4-1",
        "claude-opus-4",
        "claude-sonnet-4-6",
        "claude-sonnet-4-5",
        "claude-sonnet-4",
        "claude-haiku-4-5"
    ],
    "Partner Models: xAI (Grok)": [
        "grok-4.1-fast-reasoning",
        "grok-4.20-reasoning"
    ],
    "Partner Models: Mistral AI": [
        "mistral-medium-3",
        "mistral-ocr-2505",
        "mistral-small-2503",
        "codestral-2"
    ],

    # ---------------------------------------------------------
    # OPEN MODELS (MaaS - Model as a Service)
    # ---------------------------------------------------------
    "Open Models: DeepSeek": [
        "deepseek-v3.2-maas",
        "deepseek-v3.1-maas",
        "deepseek-r1-0528-maas",
        "deepseek-ocr-maas"
    ],
    "Open Models: Meta (Llama)": [
        "llama-4-maverick-17b-128e-instruct-maas",
        "llama-4-scout-17b-16e-instruct-maas",
        "llama-3.3-70b-instruct-maas"
    ],
    "Open Models: Alibaba (Qwen)": [
        "qwen3-next-80b-a3b-instruct-maas",
        "qwen3-next-80b-a3b-thinking-maas",
        "qwen3-coder-480b-a35b-instruct-maas",
        "qwen3-235b-a22b-instruct-2507-maas"
    ],
    "Open Models: OpenAI OSS": [
        "gpt-oss-120b-maas",
        "gpt-oss-20b-maas"
    ],
    "Open Models: Others (Gemma, E5, Kimi, MiniMax, ZAI)": [
        "gemma-4-26b-a4b-it-maas",
        "multilingual-e5-large-instruct-maas",
        "multilingual-e5-small-maas",
        "kimi-k2-thinking-maas",
        "minimax-m2-maas",
        "glm-5-maas",
        "glm-4.7-maas"
    ]
}

# ============================================================================
# THE DATACENTER REGISTRY (ISO 3166-1 alpha-2)
# ============================================================================
# Fully supports the complex regional availability matrix required by the 
# Open and Partner models (e.g., us-east5 for Llama/Claude, us-central1 for DeepSeek)

REGIONS = {
    "Macro-Regions (Global Load Balanced)": ["us", "eu", "global"],
    "United States": [
        "us-east5", "us-south1", "us-central1", "us-west4", 
        "us-west2", "us-east1", "us-east4", "us-west1", "us-west3"
    ],
    "Canada, Mexico & South America": [
        "northamerica-northeast1", "northamerica-northeast2", 
        "northamerica-south1",
        "southamerica-west1", "southamerica-east1"
    ],
    "Europe & Africa": [
        "africa-south1", "europe-west1", "europe-north1", "europe-west3", 
        "europe-west2", "europe-southwest1", "europe-west8", "europe-west4", 
        "europe-west9", "europe-west12", "europe-central2", "europe-west6",
        "europe-west10", "europe-north2"
    ],
    "Asia Pacific & Middle East": [
        "asia-east1", "asia-east2", 
        "asia-northeast1", "asia-northeast2", "asia-northeast3", 
        "asia-south1", "asia-south2", 
        "asia-southeast1", "asia-southeast2", 
        "australia-southeast1", "australia-southeast2",
        "me-central1", "me-central2", "me-west1"
    ]
}