interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  color = "#6366f1",
  size = "md",
  showLabel = false,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 rounded-full bg-slate-100 overflow-hidden ${sizeMap[size]}`}>
        <div
          className={`h-full rounded-full ${animated ? "transition-all duration-700 ease-out" : ""}`}
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-slate-700 w-10 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
