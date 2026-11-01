interface RiskBadgeProps {
  level: "HIGH" | "MEDIUM" | "LOW";
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const styles = {
    HIGH: "border-red-500/30 bg-red-500/15 text-red-400",
    MEDIUM: "border-yellow-500/30 bg-yellow-500/15 text-yellow-400",
    LOW: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  };

  const dots = {
    HIGH: "bg-red-400",
    MEDIUM: "bg-yellow-400",
    LOW: "bg-emerald-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${styles[level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[level]}`} />
      {level}
    </span>
  );
}
