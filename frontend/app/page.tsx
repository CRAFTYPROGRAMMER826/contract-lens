"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/FileUpload";
import FeatureCard from "@/components/FeatureCard";
import type { UploadResponse } from "@/lib/types";

const FEATURES = [
  {
    icon: "📄",
    title: "Smart Parsing",
    description:
      "Upload PDF, DOCX, or TXT contracts and let our AI parse the document structure automatically.",
  },
  {
    icon: "🔗",
    title: "Hierarchical Chunking",
    description:
      "Contract-aware breakdown into sections, clauses, conditions, and penalties for precise analysis.",
  },
  {
    icon: "🎯",
    title: "Risk Scoring",
    description:
      "Automated HIGH, MEDIUM, and LOW risk assessment with detailed risk factor explanations.",
  },
  {
    icon: "💬",
    title: "Intelligent Q&A",
    description:
      "Ask natural language questions about your contract using RAG-powered retrieval and generation.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadResult(data);
  };

  return (
    <div className="relative">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            AI-Powered Contract Intelligence
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Contract
            <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
              Lens
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Upload your legal contracts and get instant AI-powered analysis —
            risk assessments, obligation tracking, and intelligent Q&amp;A, all
            in one place.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Upload Section */}
        <div className="mx-auto mt-20 flex max-w-2xl flex-col items-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            Get Started
          </h2>
          <p className="mb-8 text-slate-400">
            Upload a contract to begin analysis
          </p>

          {!uploadResult ? (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          ) : (
            <div className="w-full max-w-2xl animate-fade-in rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8">
              {/* Success Header */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg
                    className="h-5 w-5 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Contract Uploaded Successfully
                  </h3>
                  <p className="text-sm text-slate-400">
                    Your contract is ready for analysis
                  </p>
                </div>
              </div>

              {/* Upload Details */}
              <div className="mb-6 space-y-3 rounded-xl bg-navy-900/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Filename</span>
                  <span className="text-sm font-medium text-white">
                    {uploadResult.filename}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Document ID</span>
                  <span className="font-mono text-sm text-accent">
                    {uploadResult.document_id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total Chunks</span>
                  <span className="text-sm font-medium text-white">
                    {uploadResult.total_chunks}
                  </span>
                </div>

                {/* Chunk breakdown */}
                {Object.keys(uploadResult.chunk_summary).length > 0 && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Chunk Breakdown
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(uploadResult.chunk_summary).map(
                        ([level, count]) => (
                          <span
                            key={level}
                            className="rounded-full border border-white/10 bg-navy-800 px-3 py-1 text-xs text-slate-300"
                          >
                            {level}:{" "}
                            <span className="font-semibold text-accent">
                              {count}
                            </span>
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    router.push(`/analyze/${uploadResult.document_id}`)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-dark hover:shadow-accent/40"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Analyze Contract
                </button>
                <button
                  onClick={() =>
                    router.push(`/chat/${uploadResult.document_id}`)
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-6 py-3 font-semibold text-accent transition-all hover:bg-accent/20"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Ask Questions
                </button>
              </div>

              {/* Upload another */}
              <button
                onClick={() => setUploadResult(null)}
                className="mt-4 w-full text-center text-sm text-slate-500 transition-colors hover:text-slate-300"
              >
                Upload a different contract
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-24 border-t border-white/5 pt-8 text-center">
          <p className="text-sm text-slate-600">
            ContractLens — Built with Next.js, FastAPI, and LangChain
          </p>
        </div>
      </div>
    </div>
  );
}
