"""
Upload router — ``POST /api/upload``

Accepts a contract file (PDF, DOCX, or TXT), parses it, performs
hierarchical chunking, generates embeddings, and stores everything in
ChromaDB.  Returns a document ID and a chunk-level summary.
"""

from __future__ import annotations

import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File

from backend.config import UPLOAD_DIR
from backend.models.schemas import ChunkSummary, UploadResponse
from backend.services.chunker import hierarchical_chunking
from backend.services.embeddings import generate_embeddings
from backend.services.parser import parse_document
from backend.services import vectorstore

router = APIRouter()

# Allowed extensions
_ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


@router.post("/upload", response_model=UploadResponse)
async def upload_contract(file: UploadFile = File(...)):
    """
    Upload and process a contract file.

    Pipeline:
    1. Validate file type
    2. Save to disk
    3. Parse text content
    4. Hierarchical chunking
    5. Generate embeddings via Ollama
    6. Store in ChromaDB

    Returns the document ID and chunk statistics.
    """
    # --- 1. Validate ----------------------------------------------------------
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    extension = file.filename.rsplit(".", maxsplit=1)[-1].lower()
    if extension not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{extension}. "
                   f"Allowed: {', '.join(sorted(_ALLOWED_EXTENSIONS))}",
        )

    # --- 2. Save to disk -----------------------------------------------------
    document_id = str(uuid.uuid4())
    safe_filename = f"{document_id}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        contents = await file.read()
        with open(file_path, "wb") as fh:
            fh.write(contents)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to save uploaded file: {exc}"
        ) from exc

    # --- 3. Parse -------------------------------------------------------------
    try:
        raw_text = parse_document(file_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to parse document: {exc}"
        ) from exc

    if not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="The uploaded document is empty or contains no extractable text.",
        )

    # --- 4. Chunk -------------------------------------------------------------
    chunks = hierarchical_chunking(raw_text)
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="Could not extract any meaningful chunks from the document.",
        )

    # --- 5. Embed -------------------------------------------------------------
    try:
        texts = [c.text for c in chunks]
        embeddings = await generate_embeddings(texts)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding generation failed (is Ollama running?): {exc}",
        ) from exc

    # --- 6. Store in ChromaDB -------------------------------------------------
    try:
        vectorstore.store_chunks(document_id, chunks, embeddings)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to store chunks in vector store: {exc}",
        ) from exc

    # --- 7. Save raw text for later analysis ----------------------------------
    raw_text_path = os.path.join(UPLOAD_DIR, f"{document_id}.raw.txt")
    with open(raw_text_path, "w", encoding="utf-8") as fh:
        fh.write(raw_text)

    # --- Build response -------------------------------------------------------
    summary = ChunkSummary(
        sections=sum(1 for c in chunks if c.level == "section"),
        clauses=sum(1 for c in chunks if c.level == "clause"),
        conditions=sum(1 for c in chunks if c.level == "condition"),
        penalties=sum(1 for c in chunks if c.level == "penalty"),
    )

    return UploadResponse(
        document_id=document_id,
        filename=file.filename,
        total_chunks=len(chunks),
        chunk_summary=summary,
    )
