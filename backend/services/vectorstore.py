"""
ChromaDB vector-store operations.

Each uploaded document gets its own ChromaDB collection (named after the
document ID).  Chunks are stored together with their hierarchical metadata
so that retrieval results include full context about which section a clause
belongs to.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import chromadb

from backend.config import CHROMA_PERSIST_DIR
from backend.services.chunker import Chunk

# Module-level client (initialised lazily via ``get_client``).
_client: Optional[chromadb.ClientAPI] = None


def get_client() -> chromadb.ClientAPI:
    """Return (and cache) a persistent ChromaDB client."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def _collection_name(document_id: str) -> str:
    """
    Derive a valid ChromaDB collection name from a document ID.

    ChromaDB collection names must be 3-63 chars, start/end with an
    alphanumeric character, and may contain hyphens/underscores.
    """
    name = f"doc_{document_id.replace('-', '_')}"
    # Ensure length bounds
    return name[:63]


def get_or_create_collection(document_id: str) -> chromadb.Collection:
    """Get or create the ChromaDB collection for *document_id*."""
    client = get_client()
    return client.get_or_create_collection(
        name=_collection_name(document_id),
        metadata={"hnsw:space": "cosine"},
    )


def store_chunks(
    document_id: str,
    chunks: List[Chunk],
    embeddings: List[List[float]],
) -> None:
    """
    Upsert chunks and their embeddings into ChromaDB.

    Args:
        document_id: Unique identifier of the source document.
        chunks: Hierarchical chunks produced by the chunker.
        embeddings: Corresponding embedding vectors (same order as *chunks*).
    """
    collection = get_or_create_collection(document_id)

    ids = [c.id for c in chunks]
    documents = [c.text for c in chunks]
    metadatas = [
        {
            "level": c.level,
            "section": c.section or "",
            "related_to": json.dumps(c.related_to),
        }
        for c in chunks
    ]

    # ChromaDB has a batch limit; split into batches of 5 000.
    batch_size = 5_000
    for start in range(0, len(ids), batch_size):
        end = start + batch_size
        collection.upsert(
            ids=ids[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
            embeddings=embeddings[start:end],
        )


def query_chunks(
    document_id: str,
    query_embedding: List[float],
    n_results: int = 5,
) -> Dict[str, Any]:
    """
    Query the vector store for chunks most similar to *query_embedding*.

    Returns the raw ChromaDB query result dict with keys
    ``ids``, ``documents``, ``metadatas``, ``distances``.
    """
    collection = get_or_create_collection(document_id)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    return results


def get_all_chunks(document_id: str) -> Dict[str, Any]:
    """
    Retrieve **all** chunks stored for a document.

    Useful for full-document analysis (risk scoring, obligation extraction).
    """
    collection = get_or_create_collection(document_id)
    return collection.get(include=["documents", "metadatas"])


def document_exists(document_id: str) -> bool:
    """Return ``True`` if a collection for *document_id* already exists."""
    client = get_client()
    existing = [c.name for c in client.list_collections()]
    return _collection_name(document_id) in existing
