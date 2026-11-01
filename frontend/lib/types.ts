export interface UploadResponse {
  document_id: string;
  filename: string;
  total_chunks: number;
  chunk_summary: Record<string, number>;
}

export interface SourceChunk {
  id: string;
  text: string;
  level: string;
  section: string | null;
}

export interface QueryResponse {
  answer: string;
  source_chunks: SourceChunk[];
  confidence: number;
}

export interface ContractMetadata {
  parties: string[];
  effective_date: string | null;
  expiration_date: string | null;
  governing_law: string | null;
  contract_type: string | null;
}

export interface RiskItem {
  chunk_id: string;
  text_preview: string;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  risk_factors: string[];
}

export interface Obligation {
  party: string;
  description: string;
  deadline: string | null;
  clause_reference: string | null;
}

export interface AnalysisResponse {
  metadata: ContractMetadata;
  risks: RiskItem[];
  obligations: Obligation[];
  summary: string;
}

export interface ChatMessageType {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceChunks?: SourceChunk[];
  confidence?: number;
  timestamp: Date;
}
