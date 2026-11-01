import {
  UploadResponse,
  QueryResponse,
  AnalysisResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadContract(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Upload failed (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json();
}

export async function queryContract(
  documentId: string,
  question: string
): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Query failed (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json();
}

export async function analyzeContract(
  documentId: string
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Analysis failed (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/api/health`);

  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }

  return response.json();
}
