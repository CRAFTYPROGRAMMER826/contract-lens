"""
Query router — ``POST /api/query``

Implements Retrieval-Augmented Generation (RAG):
1. Embed the user question via Ollama
2. Search ChromaDB for the most relevant contract chunks
3. Build a context prompt and query the Ollama LLM
4. Return the answer with source chunk references
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.models.schemas import QueryRequest, QueryResponse, SourceChunk
from backend.services.embeddings import generate_single_embedding
from backend.services import llm, vectorstore

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_contract(body: QueryRequest):
    """
    Answer a natural-language question about a previously uploaded contract.

    Uses clause-level RAG retrieval: the question is embedded, the top-k
    most relevant chunks are fetched from ChromaDB, and the LLM generates
    an answer grounded in those chunks.
    """
    # --- Validate document exists ---------------------------------------------
    if not vectorstore.document_exists(body.document_id):
        raise HTTPException(
            status_code=404,
            detail=f"Document '{body.document_id}' not found. Upload it first.",
        )

    # --- 1. Embed the question ------------------------------------------------
    try:
        query_embedding = await generate_single_embedding(body.question)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to generate query embedding (is Ollama running?): {exc}",
        ) from exc

    # --- 2. Search ChromaDB ---------------------------------------------------
    try:
        results = vectorstore.query_chunks(
            document_id=body.document_id,
            query_embedding=query_embedding,
            n_results=5,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Vector search failed: {exc}",
        ) from exc

    ids = results.get("ids", [[]])[0]
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    if not documents:
        raise HTTPException(
            status_code=404,
            detail="No relevant chunks found for the given question.",
        )

    # --- 3. Build context and query LLM ---------------------------------------
    context_parts = []
    source_chunks = []
    for idx, (cid, doc, meta, dist) in enumerate(
        zip(ids, documents, metadatas, distances), start=1
    ):
        section = meta.get("section", "Unknown")
        level = meta.get("level", "unknown")
        context_parts.append(
            f"[Chunk {idx} | {level} | Section: {section}]\n{doc}\n"
        )
        # Cosine distance → similarity (ChromaDB cosine distance is in [0, 2])
        relevance = max(0.0, 1.0 - dist)
        source_chunks.append(
            SourceChunk(
                chunk_id=cid,
                level=level,
                section=section if section else None,
                text_preview=doc[:300],
                relevance_score=round(relevance, 4),
            )
        )

    context = "\n".join(context_parts)

    system_prompt = (
        "You are a contract analysis assistant. Answer the user's question "
        "based ONLY on the contract excerpts provided below. If the answer "
        "is not found in the excerpts, say so.\n\n"
        f"CONTRACT EXCERPTS:\n{context}"
    )

    try:
        answer = await llm.chat_with_context(system_prompt, body.question)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"LLM query failed (is Ollama running?): {exc}",
        ) from exc

    # --- 4. Compute overall confidence ----------------------------------------
    if source_chunks:
        avg_relevance = sum(sc.relevance_score for sc in source_chunks) / len(source_chunks)
    else:
        avg_relevance = 0.0

    return QueryResponse(
        answer=answer,
        source_chunks=source_chunks,
        confidence=round(avg_relevance, 4),
    )
