import { ReactNode } from "react";

interface AnalysisCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function AnalysisCard({
  title,
  icon,
  children,
  className = "",
}: AnalysisCardProps) {
  return (
    <div
      className={`animate-slide-up overflow-hidden rounded-xl border border-white/10 bg-navy-800/60 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
