"""
Embedding service — calls the local Ollama ``/api/embed`` endpoint.

Uses the ``nomic-embed-text`` model by default (configurable in
:pymod:`backend.config`).
"""

from __future__ import annotations

from typing import List

import httpx

from backend.config import OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL

# Generous timeout: large batches can take a while on CPU-only machines.
_TIMEOUT = httpx.Timeout(timeout=120.0)


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a batch of texts via Ollama.

    Args:
        texts: List of strings to embed.

    Returns:
        List of embedding vectors (each a list of floats).

    Raises:
        httpx.HTTPStatusError: If the Ollama server returns a non-2xx status.
        httpx.ConnectError: If the Ollama server is unreachable.
    """
    url = f"{OLLAMA_BASE_URL}/api/embed"
    payload = {
        "model": OLLAMA_EMBED_MODEL,
        "input": texts,
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()

    data = response.json()
    # Ollama returns {"embeddings": [[...], [...]]}
    return data["embeddings"]


async def generate_single_embedding(text: str) -> List[float]:
    """Convenience wrapper for embedding a single string."""
    embeddings = await generate_embeddings([text])
    return embeddings[0]
