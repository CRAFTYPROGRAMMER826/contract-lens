# ContractLens — AI-Powered Contract Analysis

> A RAG-based intelligent contract analysis tool that goes beyond generic document Q&A by providing **hierarchical contract-aware chunking**, **automated risk scoring**, **structured metadata extraction**, and **clause-level querying**.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-white?logo=ollama)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How It Differs from NotebookLM / ChatGPT](#how-it-differs-from-notebooklm--chatgpt)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)

---

## Overview

**ContractLens** is a specialized AI tool designed to read, parse, and analyze legal contracts automatically. Unlike general-purpose tools (NotebookLM, ChatGPT, Claude), it understands the **hierarchical structure** of legal documents — breaking them down into sections, clauses, conditions, and penalties — and provides **structured, actionable insights** rather than conversational prose.

### Problem Statement

Legal contracts are complex, hierarchical documents where clauses reference other clauses, conditions link to penalties, and obligations are scattered across sections. General-purpose AI tools treat these as flat text, leading to:
- Loss of structural context during chunking
- Inability to trace cross-references
- No automated risk detection
- Unstructured, conversational outputs that can't feed downstream systems

### Solution

ContractLens addresses these by implementing:
1. **Contract-aware hierarchical parsing** that respects legal document structure
2. **Automated risk scoring** based on a legal risk taxonomy
3. **Structured data extraction** with schema enforcement
4. **RAG-based Q&A** with clause-level retrieval and full section context

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│         TypeScript • Tailwind CSS • App Router           │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │  Upload   │  │   Analysis   │  │    Chat/Q&A    │    │
│  │  Page     │  │   Dashboard  │  │    Interface   │    │
│  └────┬─────┘  └──────┬───────┘  └───────┬────────┘    │
└───────┼────────────────┼─────────────────┼──────────────┘
        │                │                 │
        ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                 Backend (FastAPI + Python)                │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │  Parser   │  │  Hierarchical│  │   Analyzer     │    │
│  │  Service  │  │  Chunker     │  │   (Risk/Meta)  │    │
│  └────┬─────┘  └──────┬───────┘  └───────┬────────┘    │
│       │               │                   │              │
│       ▼               ▼                   ▼              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Embedding Service                    │   │
│  └─────────────────────┬────────────────────────────┘   │
└────────────────────────┼────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                                  ▼
┌───────────────┐                 ┌───────────────┐
│    Ollama     │                 │   ChromaDB    │
│  (Local LLM   │                 │  (Vector DB)  │
│  + Embeddings) │                 │  Local/Persist│
└───────────────┘                 └───────────────┘
```

---

## How It Differs from NotebookLM / ChatGPT

| Aspect | General Tools (NotebookLM/ChatGPT) | ContractLens |
|--------|-------------------------------------|--------------|
| **Document Chunking** | Naive fixed-size token splits that cut mid-clause | Contract-aware hierarchical parsing (Section → Clause → Condition → Penalty) |
| **Output Format** | Free-text chat, schema drift | Enforced structured data (JSON with Pydantic validation) |
| **Risk Detection** | Reactive — user must ask the right questions | Proactive auto-scanning with risk taxonomy + severity scores |
| **Cross-References** | Treats each query in isolation | Maps condition → penalty relationships via dependency tracking |
| **Data Privacy** | Sends documents to cloud servers | 100% local processing via Ollama — no data leaves your machine |

---

## Features

- 📄 **Multi-Format Parsing** — Upload PDF, DOCX, or TXT contracts
- 🔗 **Hierarchical Chunking** — Contract-aware breakdown into sections → clauses → conditions → penalties
- 🎯 **Automated Risk Scoring** — HIGH / MEDIUM / LOW risk classification with identified risk factors
- 📊 **Structured Metadata Extraction** — Parties, dates, governing law, contract type
- 📋 **Obligation Tracking** — Extracts party obligations with deadlines
- 💬 **RAG-Powered Q&A** — Ask questions with clause-level source attribution
- 🔒 **Fully Local** — All processing via Ollama (no cloud APIs, no data leakage)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Python 3.11+, FastAPI |
| **LLM** | Ollama (qwen2.5:3b) |
| **Embeddings** | Ollama (nomic-embed-text) |
| **Vector DB** | ChromaDB (local persistent) |
| **Document Parsing** | PyPDF2, python-docx |

---

## Setup & Installation

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Ollama** installed and running ([ollama.com](https://ollama.com))

### 1. Pull Required Ollama Models

```bash
ollama pull nomic-embed-text
ollama pull qwen2.5:3b
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## Usage

1. **Upload** a contract (PDF/DOCX/TXT) via the landing page
2. **Analyze** — Click "Analyze Contract" for automated risk scoring, metadata extraction, and obligation tracking
3. **Chat** — Click "Ask Questions" to have a RAG-powered conversation about the contract

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload and process a contract |
| `POST` | `/api/query` | RAG query against a processed contract |
| `POST` | `/api/analyze` | Run full structured analysis |
| `GET` | `/api/analysis/{document_id}` | Retrieve cached analysis |

---

## Project Structure

```
ContractLens/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py             # Configuration constants
│   ├── requirements.txt      # Python dependencies
│   ├── models/
│   │   └── schemas.py        # Pydantic data models
│   ├── services/
│   │   ├── parser.py         # Document parsing (PDF, DOCX, TXT)
│   │   ├── chunker.py        # Hierarchical contract-aware chunking
│   │   ├── embeddings.py     # Ollama embedding generation
│   │   ├── vectorstore.py    # ChromaDB vector storage
│   │   ├── llm.py            # Ollama LLM interaction
│   │   └── analyzer.py       # Contract analysis orchestrator
│   └── routers/
│       ├── upload.py          # File upload endpoints
│       ├── query.py           # RAG query endpoints
│       └── analysis.py        # Analysis endpoints
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   ├── lib/                   # API client & TypeScript types
│   └── package.json
├── .gitignore
└── README.md
```

---

## License

This project was built as a minor project for academic submission. It is a prototype designed to demonstrate RAG-based contract analysis architecture.

---

*Built with 🧠 by hand — no vibe-coding.*

