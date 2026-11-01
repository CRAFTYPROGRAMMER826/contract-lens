"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { analyzeContract } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/types";
import AnalysisCard from "@/components/AnalysisCard";
import RiskBadge from "@/components/RiskBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyzeContract(documentId);
      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze contract."
      );
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
        <LoadingSpinner size="lg" />
        <div className="text-center">
          <p className="text-lg font-medium text-white">
            Analyzing your contract...
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Extracting metadata, assessing risks, and identifying obligations
          </p>
        </div>
        {/* Skeleton cards */}
        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 px-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-white/5 bg-navy-800/30"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Analysis Failed</h2>
        <p className="max-w-md text-center text-sm text-slate-400">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={fetchAnalysis}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Retry
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/5"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const { metadata, risks, obligations, summary } = analysis;

  const riskCounts = {
    HIGH: risks.filter((r) => r.risk_level === "HIGH").length,
    MEDIUM: risks.filter((r) => r.risk_level === "MEDIUM").length,
    LOW: risks.filter((r) => r.risk_level === "LOW").length,
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[400px] w-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push("/")}
              className="mb-2 flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-accent"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Upload
            </button>
            <h1 className="text-3xl font-bold text-white">
              Analysis Dashboard
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-500">
              Document: {documentId}
            </p>
          </div>
          <button
            onClick={() => router.push(`/chat/${documentId}`)}
            className="flex items-center gap-2 self-start rounded-xl border border-accent/30 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20"
          >
            <svg
              className="h-4 w-4"
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contract Overview */}
          <AnalysisCard
            title="Contract Overview"
            icon={
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          >
            <div className="space-y-4">
              <InfoRow
                label="Contract Type"
                value={metadata.contract_type || "Not detected"}
              />
              <InfoRow
                label="Parties"
                value={
                  metadata.parties.length > 0
                    ? metadata.parties.join(", ")
                    : "Not detected"
                }
              />
              <InfoRow
                label="Effective Date"
                value={metadata.effective_date || "Not specified"}
              />
              <InfoRow
                label="Expiration Date"
                value={metadata.expiration_date || "Not specified"}
              />
              <InfoRow
                label="Governing Law"
                value={metadata.governing_law || "Not specified"}
              />
            </div>
          </AnalysisCard>

          {/* AI Summary */}
          <AnalysisCard
            title="AI Summary"
            icon={
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          >
            <p className="text-sm leading-relaxed text-slate-300">{summary}</p>
          </AnalysisCard>

          {/* Risk Assessment */}
          <AnalysisCard
            title="Risk Assessment"
            className="lg:col-span-2"
            icon={
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            }
          >
            {/* Risk summary bar */}
            <div className="mb-6 flex flex-wrap gap-4">
              {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => (
                <div
                  key={level}
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-navy-900/50 px-4 py-2"
                >
                  <RiskBadge level={level} />
                  <span className="text-sm font-semibold text-white">
                    {riskCounts[level]}
                  </span>
                </div>
              ))}
            </div>

            {risks.length === 0 ? (
              <p className="text-sm text-slate-500">
                No risks detected in this contract.
              </p>
            ) : (
              <div className="space-y-4">
                {risks.map((risk, index) => (
                  <div
                    key={risk.chunk_id + index}
                    className="rounded-xl border border-white/5 bg-navy-900/40 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="text-sm leading-relaxed text-slate-300">
                        {risk.text_preview}
                      </p>
                      <RiskBadge level={risk.risk_level} />
                    </div>
                    {risk.risk_factors.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {risk.risk_factors.map((factor, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-white/10 bg-navy-800 px-2.5 py-0.5 text-xs text-slate-400"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 font-mono text-[10px] text-slate-600">
                      {risk.chunk_id}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AnalysisCard>

          {/* Obligations Table */}
          <AnalysisCard
            title="Obligations"
            className="lg:col-span-2"
            icon={
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          >
            {obligations.length === 0 ? (
              <p className="text-sm text-slate-500">
                No obligations extracted from this contract.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 pr-4 font-semibold text-slate-400">
                        Party
                      </th>
                      <th className="pb-3 pr-4 font-semibold text-slate-400">
                        Description
                      </th>
                      <th className="pb-3 pr-4 font-semibold text-slate-400">
                        Deadline
                      </th>
                      <th className="pb-3 font-semibold text-slate-400">
                        Clause Ref
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {obligations.map((obligation, index) => (
                      <tr key={index} className="group">
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                            {obligation.party}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {obligation.description}
                        </td>
                        <td className="py-3 pr-4 text-slate-400">
                          {obligation.deadline || "—"}
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-500">
                          {obligation.clause_reference || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AnalysisCard>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex-shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-200">
        {value}
      </span>
    </div>
  );
}
