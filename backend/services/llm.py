"""
LLM service — calls the local Ollama ``/api/chat`` endpoint.

Uses the ``qwen2.5:3b`` model by default (configurable in
:pymod:`backend.config`).  All calls are non-streaming for simplicity.
"""

from __future__ import annotations

from typing import Any, Dict, List

import httpx

from backend.config import OLLAMA_BASE_URL, OLLAMA_LLM_MODEL

# Allow generous time for LLM generation.
_TIMEOUT = httpx.Timeout(timeout=180.0)


async def chat(
    messages: List[Dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.3,
) -> str:
    """
    Send a chat completion request to Ollama and return the assistant reply.

    Args:
        messages: OpenAI-style list of ``{"role": ..., "content": ...}`` dicts.
        model: Override the default LLM model name.
        temperature: Sampling temperature (lower → more deterministic).

    Returns:
        The assistant's reply as a plain string.

    Raises:
        httpx.HTTPStatusError: On non-2xx response from Ollama.
        httpx.ConnectError: If Ollama is unreachable.
    """
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload: Dict[str, Any] = {
        "model": model or OLLAMA_LLM_MODEL,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature,
        },
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()

    data = response.json()
    return data["message"]["content"]


async def chat_with_context(
    system_prompt: str,
    user_prompt: str,
    *,
    model: str | None = None,
    temperature: float = 0.3,
) -> str:
    """
    Convenience wrapper: build a system + user message pair and call ``chat``.
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return await chat(messages, model=model, temperature=temperature)
