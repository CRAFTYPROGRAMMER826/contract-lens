"""
Hierarchical contract-aware chunker.

Unlike naïve fixed-size text splitting, this chunker respects the legal
structure of contracts:

    Document → Sections → Clauses → Conditions / Penalties

Each chunk carries metadata that preserves the parent-child relationship
and links conditions to their associated penalties via ``related_to``.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Chunk:
    """A single hierarchical chunk of contract text."""

    id: str
    level: str  # section | clause | condition | penalty
    text: str
    section: Optional[str] = None
    related_to: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Serialise to a plain dict (useful for ChromaDB metadata)."""
        return {
            "id": self.id,
            "level": self.level,
            "section": self.section or "",
            "related_to": ",".join(self.related_to),
        }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _split_into_sections(text: str) -> List[Chunk]:
    """
    Split the full document text into top-level *section* chunks.

    Sections are detected by lines that start with at least four consecutive
    uppercase characters (typical of legal headings like
    ``TERMS AND CONDITIONS``).
    """
    sections = re.split(r"\n\s*(?=[A-Z][A-Z\s]{3,})", text)
    chunks: List[Chunk] = []
    for sec in sections:
        stripped = sec.strip()
        if len(stripped) < 100:
            continue
        title = stripped.split("\n")[0][:80]
        chunks.append(
            Chunk(
                id=str(uuid.uuid4()),
                level="section",
                text=stripped,
                section=title,
                related_to=[],
            )
        )
    return chunks


def _split_section_into_clauses(section_chunk: Chunk) -> List[Chunk]:
    """
    Split a *section* chunk into numbered *clause* chunks.

    Clause boundaries are identified by a newline followed by a digit and a
    period or closing parenthesis (e.g. ``1.`` or ``2)``).
    """
    clauses = re.split(r"\n\d+[\.)]", section_chunk.text)
    clause_chunks: List[Chunk] = []
    for clause in clauses:
        stripped = clause.strip()
        if len(stripped) < 50:
            continue
        clause_chunks.append(
            Chunk(
                id=str(uuid.uuid4()),
                level="clause",
                text=stripped,
                section=section_chunk.section,
                related_to=[],
            )
        )
    return clause_chunks


def _detect_conditions_and_penalty(clause: Chunk):
    """
    Inspect a clause for conditional-penalty patterns.

    If the clause text contains both a conditional keyword (``if``) **and** a
    penalty keyword (``fine``, ``penalty``), it is flagged as containing both
    a *condition* and a *penalty* chunk.  The condition's ``related_to`` list
    references the penalty chunk ID for cross-reference mapping.
    """
    condition_chunks: List[Chunk] = []
    penalty_chunk: Optional[Chunk] = None

    text_lower = clause.text.lower()
    has_condition = "if" in text_lower
    has_penalty = "fine" in text_lower or "penalty" in text_lower

    if has_condition and has_penalty:
        penalty_id = str(uuid.uuid4())
        penalty_chunk = Chunk(
            id=penalty_id,
            level="penalty",
            text=clause.text,
            section=clause.section,
            related_to=[],
        )
        condition_chunks.append(
            Chunk(
                id=str(uuid.uuid4()),
                level="condition",
                text=clause.text,
                section=clause.section,
                related_to=[penalty_id],
            )
        )

    return condition_chunks, penalty_chunk


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def hierarchical_chunking(text: str) -> List[Chunk]:
    """
    Perform hierarchical chunking on raw contract text.

    Returns a flat list of :class:`Chunk` objects at all levels
    (section, clause, condition, penalty) with cross-references preserved.
    """
    final_chunks: List[Chunk] = []

    sections = _split_into_sections(text)
    final_chunks.extend(sections)

    for section in sections:
        clauses = _split_section_into_clauses(section)
        final_chunks.extend(clauses)

        for clause in clauses:
            conditions, penalty = _detect_conditions_and_penalty(clause)
            final_chunks.extend(conditions)
            if penalty:
                final_chunks.append(penalty)

    return final_chunks
