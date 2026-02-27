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
      <div className={`flex-1 rounded-full overflow-hidden ${sizeMap[size]}`}
        style={{ background: "rgba(10, 30, 56, 0.8)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)" }}>
        <div
          className={`h-full rounded-full ${animated ? "transition-all duration-700 ease-out" : ""}`}
          style={{
            width: `${clamped}%`,
            background: clamped > 0 ? `linear-gradient(90deg, ${color}99, ${color})` : "transparent",
            boxShadow: clamped > 5 ? `0 0 8px -1px ${color}66` : "none",
          }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold w-10 text-right shrink-0" style={{ color: "#B8D7F2" }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
