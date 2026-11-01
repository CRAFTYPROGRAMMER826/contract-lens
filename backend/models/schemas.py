"""
Pydantic models (schemas) for API requests and responses.

These models enforce validation on all incoming requests and provide
structured, documented response payloads for the Contract Analysis API.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

class ChunkSummary(BaseModel):
    """Breakdown of chunk counts by hierarchical level."""
    sections: int = 0
    clauses: int = 0
    conditions: int = 0
    penalties: int = 0


class UploadResponse(BaseModel):
    """Returned after a contract file is successfully uploaded and processed."""
    document_id: str = Field(..., description="Unique identifier for the uploaded document")
    filename: str = Field(..., description="Original filename")
    total_chunks: int = Field(..., description="Total number of chunks generated")
    chunk_summary: ChunkSummary = Field(..., description="Counts per chunk level")


# ---------------------------------------------------------------------------
# Query (RAG)
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    """Payload for a RAG query against a previously uploaded contract."""
    document_id: str = Field(..., description="Document to query against")
    question: str = Field(..., min_length=1, description="Natural-language question")


class SourceChunk(BaseModel):
    """A chunk returned as supporting evidence for an answer."""
    chunk_id: str
    level: str
    section: Optional[str] = None
    text_preview: str = Field(..., description="First 300 chars of the chunk text")
    relevance_score: float = Field(..., description="Distance / similarity score from vector search")


class QueryResponse(BaseModel):
    """RAG-generated answer with source references."""
    answer: str
    source_chunks: List[SourceChunk] = []
    confidence: float = Field(
        ..., ge=0.0, le=1.0,
        description="Estimated confidence (derived from average relevance of top chunks)",
    )


# ---------------------------------------------------------------------------
# Structured Analysis
# ---------------------------------------------------------------------------

class ContractMetadata(BaseModel):
    """High-level metadata extracted from the contract via LLM."""
    parties: List[str] = Field(default_factory=list, description="Parties to the contract")
    effective_date: Optional[str] = Field(None, description="Contract effective / start date")
    expiration_date: Optional[str] = Field(None, description="Contract end / expiration date")
    governing_law: Optional[str] = Field(None, description="Jurisdiction / governing law")
    contract_type: Optional[str] = Field(None, description="E.g. NDA, MSA, SaaS Agreement")


class RiskItem(BaseModel):
    """A clause-level risk flag."""
    chunk_id: str
    text_preview: str = Field(..., description="First 200 chars of the risky clause")
    risk_level: str = Field(..., description="HIGH | MEDIUM | LOW")
    risk_factors: List[str] = Field(default_factory=list, description="Keywords that triggered the flag")


class Obligation(BaseModel):
    """A contractual obligation extracted by the LLM."""
    party: str = Field(..., description="Which party bears this obligation")
    description: str
    deadline: Optional[str] = None
    clause_reference: Optional[str] = Field(None, description="Section or clause title")


class AnalysisRequest(BaseModel):
    """Request body for full structured analysis."""
    document_id: str


class AnalysisResponse(BaseModel):
    """Complete structured analysis of a contract."""
    document_id: str
    metadata: ContractMetadata
    risks: List[RiskItem] = []
    obligations: List[Obligation] = []
    summary: str = Field("", description="LLM-generated executive summary")
