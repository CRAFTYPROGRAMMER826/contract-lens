interface ChunkCardProps {
  id: string;
  text: string;
  level: string;
  section: string | null;
}

export default function ChunkCard({ id, text, level, section }: ChunkCardProps) {
  const levelColors: Record<string, string> = {
    section: "border-blue-500/30 bg-blue-500/15 text-blue-400",
    clause: "border-purple-500/30 bg-purple-500/15 text-purple-400",
    condition: "border-amber-500/30 bg-amber-500/15 text-amber-400",
    penalty: "border-red-500/30 bg-red-500/15 text-red-400",
  };

  const badgeClass =
    levelColors[level.toLowerCase()] ||
    "border-slate-500/30 bg-slate-500/15 text-slate-400";

  return (
    <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4 transition-colors hover:border-white/20">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}
        >
          {level}
        </span>
        {section && (
          <span className="truncate text-xs text-slate-500" title={section}>
            {section}
          </span>
        )}
        <span className="ml-auto text-[10px] font-mono text-slate-600">{id}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}
