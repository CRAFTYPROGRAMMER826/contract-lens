"""
FastAPI application entry point for the Contract Analysis backend.

Run with::

    uvicorn backend.main:app --reload --port 8000
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CHROMA_PERSIST_DIR, UPLOAD_DIR
from backend.routers import analysis, query, upload


# ---------------------------------------------------------------------------
# Lifespan — runs on startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure required directories exist before the app starts serving."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
    yield  # Application runs here
    # Shutdown cleanup (if any) would go after yield


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Contract Analysis API",
    description=(
        "RAG-based contract analysis tool with hierarchical chunking, "
        "risk scoring, obligation extraction, and structured metadata "
        "extraction — powered by Ollama and ChromaDB."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS (allow all origins for development) --------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include routers ---------------------------------------------------------
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(query.router, prefix="/api", tags=["Query"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])


# --- Health check ------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
async def health_check():
    """
    Simple health-check endpoint.

    Returns ``{"status": "healthy"}`` when the server is up.
    """
    return {"status": "healthy"}
