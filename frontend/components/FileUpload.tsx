"use client";

import { useCallback, useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface FileUploadProps {
  onUploadSuccess: (data: {
    document_id: string;
    filename: string;
    total_chunks: number;
    chunk_summary: Record<string, number>;
  }) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

  const validateFile = (file: File): boolean => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !ACCEPTED_EXTENSIONS.includes(extension)
    ) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be under 50 MB.");
      return false;
    }
    return true;
  };

  const handleUpload = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      setError(null);
      setSelectedFile(file);
      setIsUploading(true);

      try {
        const { uploadContract } = await import("@/lib/api");
        const data = await uploadContract(file);
        onUploadSuccess(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setError(message);
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadSuccess]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="w-full max-w-2xl">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
          isDragging
            ? "border-accent bg-accent/10 shadow-lg shadow-accent/10"
            : "border-slate-600 bg-navy-800/40 hover:border-accent/50 hover:bg-navy-800/60"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <div>
              <p className="text-lg font-medium text-white">
                Processing contract...
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Parsing and chunking{" "}
                <span className="text-accent">{selectedFile?.name}</span>
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 transition-colors group-hover:bg-accent/20">
              <svg
                className="h-8 w-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-white">
              Drop your contract here or{" "}
              <span className="text-accent underline underline-offset-2">
                browse files
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Supports PDF, DOCX, and TXT files up to 50 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
