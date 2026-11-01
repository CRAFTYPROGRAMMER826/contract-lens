"""
Contract analysis orchestrator — the KEY differentiator of this tool.

Provides structured extraction that goes far beyond a generic chatbot:

* **Metadata extraction** — parties, dates, governing law, contract type
* **Risk scoring** — clause-level HIGH / MEDIUM / LOW risk flags
* **Obligation extraction** — who must do what, by when
* **Executive summary** — concise LLM-generated overview

Results are cached in-memory so repeated ``GET`` calls are fast.
"""

from __future__ import annotations

import json
import logging
from typing import Dict, List, Optional

from backend.models.schemas import (
    AnalysisResponse,
    ContractMetadata,
    Obligation,
    RiskItem,
)
from backend.services import llm, vectorstore

logger = logging.getLogger(__name__)

# In-memory analysis cache: document_id → AnalysisResponse
_analysis_cache: Dict[str, AnalysisResponse] = {}

# ---------------------------------------------------------------------------
# Risk keyword configuration
# ---------------------------------------------------------------------------

_HIGH_RISK_KEYWORDS = {"terminate", "indemnify", "indemnification", "forfeit", "waive", "waiver"}
_MEDIUM_RISK_KEYWORDS = {"penalty", "liable", "liability", "breach", "damages"}
_LOW_RISK_KEYWORDS = {"fine", "fee", "charge", "cost", "expense"}


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

async def extract_metadata(text: str) -> ContractMetadata:
    """
    Use the LLM to extract structured metadata from the raw contract text.

    The prompt explicitly asks for JSON so the response can be parsed
    deterministically.  A best-effort fallback is used if parsing fails.
    """
    system_prompt = (
        "You are a contract analysis assistant. Extract the following metadata "
        "from the contract text and return ONLY valid JSON (no markdown fences, "
        "no explanation):\n"
        "{\n"
        '  "parties": ["Party A name", "Party B name"],\n'
        '  "effective_date": "date or null",\n'
        '  "expiration_date": "date or null",\n'
        '  "governing_law": "jurisdiction or null",\n'
        '  "contract_type": "type or null"\n'
        "}"
    )

    # Truncate to ~4000 chars to stay within context window
    truncated = text[:4000]
    raw = await llm.chat_with_context(system_prompt, truncated, temperature=0.1)

    try:
        # Strip potential markdown fences
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        data = json.loads(cleaned.strip())
    except (json.JSONDecodeError, IndexError):
        logger.warning("Failed to parse LLM metadata response: %s", raw[:300])
        data = {}

    return ContractMetadata(
        parties=data.get("parties", []),
        effective_date=data.get("effective_date"),
        expiration_date=data.get("expiration_date"),
        governing_law=data.get("governing_law"),
        contract_type=data.get("contract_type"),
    )


# ---------------------------------------------------------------------------
# Risk scoring
# ---------------------------------------------------------------------------

def score_risks(
    chunk_ids: List[str],
    chunk_texts: List[str],
    chunk_metadatas: List[dict],
) -> List[RiskItem]:
    """
    Scan chunks for risk keywords and assign a risk level.

    Risk levels:
    - **HIGH**: contains termination, indemnification, forfeiture, or waiver language
    - **MEDIUM**: contains penalty, liability, breach, or damages language
    - **LOW**: contains fee, fine, charge, or cost language

    Only chunks at the *clause*, *condition*, or *penalty* level are scored.
    """
    risk_items: List[RiskItem] = []

    for cid, text, meta in zip(chunk_ids, chunk_texts, chunk_metadatas):
        level = meta.get("level", "")
        if level not in ("clause", "condition", "penalty"):
            continue

        text_lower = text.lower()
        found_high = [kw for kw in _HIGH_RISK_KEYWORDS if kw in text_lower]
        found_medium = [kw for kw in _MEDIUM_RISK_KEYWORDS if kw in text_lower]
        found_low = [kw for kw in _LOW_RISK_KEYWORDS if kw in text_lower]

        if not (found_high or found_medium or found_low):
            continue

        if found_high:
            risk_level = "HIGH"
        elif found_medium:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        risk_items.append(
            RiskItem(
                chunk_id=cid,
                text_preview=text[:200],
                risk_level=risk_level,
                risk_factors=found_high + found_medium + found_low,
            )
        )

    return risk_items


# ---------------------------------------------------------------------------
# Obligation extraction
# ---------------------------------------------------------------------------

async def extract_obligations(text: str) -> List[Obligation]:
    """
    Use the LLM to extract contractual obligations.

    Each obligation includes the responsible party, a description, an
    optional deadline, and a clause reference.
    """
    system_prompt = (
        "You are a contract analysis assistant. Extract all contractual "
        "obligations from the text. Return ONLY a valid JSON array "
        "(no markdown fences, no explanation). Each element must have:\n"
        "{\n"
        '  "party": "Party name",\n'
        '  "description": "What they must do",\n'
        '  "deadline": "deadline or null",\n'
        '  "clause_reference": "section title or null"\n'
        "}\n"
        "If there are no obligations, return an empty array []."
    )

    truncated = text[:6000]
    raw = await llm.chat_with_context(system_prompt, truncated, temperature=0.1)

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        items = json.loads(cleaned.strip())
        if not isinstance(items, list):
            items = []
    except (json.JSONDecodeError, IndexError):
        logger.warning("Failed to parse LLM obligations response: %s", raw[:300])
        items = []

    obligations: List[Obligation] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        obligations.append(
            Obligation(
                party=item.get("party", "Unknown"),
                description=item.get("description", ""),
                deadline=item.get("deadline"),
                clause_reference=item.get("clause_reference"),
            )
        )

    return obligations


# ---------------------------------------------------------------------------
# Executive summary
# ---------------------------------------------------------------------------

async def generate_summary(text: str) -> str:
    """Generate a concise executive summary of the contract via LLM."""
    system_prompt = (
        "You are a contract analysis assistant. Write a concise executive "
        "summary (3-5 sentences) of the following contract. Focus on the "
        "key terms, obligations, and any notable risks."
    )
    truncated = text[:5000]
    return await llm.chat_with_context(system_prompt, truncated, temperature=0.3)


# ---------------------------------------------------------------------------
# Full analysis orchestrator
# ---------------------------------------------------------------------------

async def full_analysis(document_id: str, raw_text: str) -> AnalysisResponse:
    """
    Run the complete structured analysis pipeline:

    1. Extract metadata (parties, dates, law, type)
    2. Score risks across all stored chunks
    3. Extract obligations
    4. Generate executive summary

    The result is cached so subsequent requests are instant.
    """
    # 1. Metadata
    metadata = await extract_metadata(raw_text)

    # 2. Risk scoring (uses chunks already in ChromaDB)
    all_chunks = vectorstore.get_all_chunks(document_id)
    risks = score_risks(
        chunk_ids=all_chunks.get("ids", []),
        chunk_texts=all_chunks.get("documents", []),
        chunk_metadatas=all_chunks.get("metadatas", []),
    )

    # 3. Obligations
    obligations = await extract_obligations(raw_text)

    # 4. Summary
    summary = await generate_summary(raw_text)

    result = AnalysisResponse(
        document_id=document_id,
        metadata=metadata,
        risks=risks,
        obligations=obligations,
        summary=summary,
    )

    # Cache
    _analysis_cache[document_id] = result
    return result


def get_cached_analysis(document_id: str) -> Optional[AnalysisResponse]:
    """Return a previously computed analysis, or ``None``."""
    return _analysis_cache.get(document_id)
