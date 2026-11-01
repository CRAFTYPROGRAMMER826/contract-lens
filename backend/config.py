"""
Configuration constants for the Contract Analysis backend.

Configured to use local Ollama instance and ChromaDB persistent storage.
Supports environment variable overrides while maintaining sensible local defaults.
"""

import os

# Ollama server base URL
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Embedding model served by Ollama (e.g. "nomic-embed-text" or "all-minilm")
OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# Chat / analysis LLM served by Ollama (e.g. "qwen2.5:3b", "llama3.2:3b", "qwen2.5:1.5b")
OLLAMA_LLM_MODEL: str = os.getenv("OLLAMA_LLM_MODEL", "qwen2.5:3b")

# ChromaDB persistent storage directory
CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")

# Uploaded contract files directory
UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
