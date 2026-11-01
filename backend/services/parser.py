"""
Document parser service.

Supports PDF, DOCX, and TXT files.  Returns the full document text as a
single string so downstream services can apply hierarchical chunking.
"""

from __future__ import annotations

import os

from PyPDF2 import PdfReader
import docx


def parse_txt(file_path: str) -> str:
    """Read a plain-text file and return its contents."""
    with open(file_path, "r", encoding="utf-8") as fh:
        return fh.read()


def parse_pdf(file_path: str) -> str:
    """Extract text from every page of a PDF file."""
    pages: list[str] = []
    reader = PdfReader(file_path)
    for page in reader.pages:
        content = page.extract_text()
        if content:
            pages.append(content)
    return "\n".join(pages)


def parse_docx(file_path: str) -> str:
    """Extract paragraph text from a DOCX file."""
    document = docx.Document(file_path)
    return "\n".join(para.text for para in document.paragraphs)


def parse_document(file_path: str) -> str:
    """
    Detect the file type by extension and delegate to the appropriate parser.

    Raises:
        FileNotFoundError: If *file_path* does not exist.
        ValueError: If the file extension is not supported.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    extension = file_path.rsplit(".", maxsplit=1)[-1].lower()

    parsers = {
        "txt": parse_txt,
        "pdf": parse_pdf,
        "docx": parse_docx,
    }

    parser = parsers.get(extension)
    if parser is None:
        raise ValueError(
            f"Unsupported file type: .{extension}. "
            f"Supported types: {', '.join(parsers)}"
        )

    return parser(file_path)
