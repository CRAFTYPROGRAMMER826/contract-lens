"""
Analysis router — ``POST /api/analyze`` and ``GET /api/analysis/{document_id}``

Provides structured contract analysis:
- Contract metadata (parties, dates, governing law, contract type)
- Clause-level risk scoring (HIGH / MEDIUM / LOW)
- Obligation extraction
- Executive summary
"""

from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException

from backend.config import UPLOAD_DIR
from backend.models.schemas import AnalysisRequest, AnalysisResponse
from backend.services import analyzer, vectorstore

router = APIRouter()


def _load_raw_text(document_id: str) -> str:
    """Load the raw text that was saved during upload."""
    raw_path = os.path.join(UPLOAD_DIR, f"{document_id}.raw.txt")
    if not os.path.isfile(raw_path):
        raise HTTPException(
            status_code=404,
            detail=f"Raw text for document '{document_id}' not found. "
                   "Upload the document first.",
        )
    with open(raw_path, "r", encoding="utf-8") as fh:
        return fh.read()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_contract(body: AnalysisRequest):
    """
    Run a full structured analysis on a previously uploaded contract.

    This endpoint orchestrates:
    1. Metadata extraction via LLM
    2. Risk scoring across all stored chunks
    3. Obligation extraction via LLM
    4. Executive summary generation

    Results are cached — calling this endpoint again for the same document
    returns the cached result instantly.
    """
    # Check cache first
    cached = analyzer.get_cached_analysis(body.document_id)
    if cached is not None:
        return cached

    # Validate document exists in vector store
    if not vectorstore.document_exists(body.document_id):
        raise HTTPException(
            status_code=404,
            detail=f"Document '{body.document_id}' not found in vector store.",
        )

    raw_text = _load_raw_text(body.document_id)

    try:
        result = await analyzer.full_analysis(body.document_id, raw_text)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Analysis failed (is Ollama running?): {exc}",
        ) from exc

    return result


@router.get("/analysis/{document_id}", response_model=AnalysisResponse)
async def get_analysis(document_id: str):
    """
    Retrieve a previously computed analysis result.

    If no cached result exists, returns 404 — use ``POST /api/analyze``
    to trigger a new analysis.
    """
    cached = analyzer.get_cached_analysis(document_id)
    if cached is None:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis found for document '{document_id}'. "
                   "Run POST /api/analyze first.",
        )
    return cached
