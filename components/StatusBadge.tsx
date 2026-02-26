import { TaskStatus } from "@/lib/types";
import React from "react";

const config: Record<TaskStatus, string> = {
  Todo: "border text-xs font-semibold",
  Doing: "border text-xs font-semibold",
  Done: "border text-xs font-semibold",
};

const styleMap: Record<TaskStatus, React.CSSProperties> = {
  Todo:  { background: "rgba(107,154,196,0.12)", borderColor: "rgba(107,154,196,0.35)", color: "#B8D7F2" },
  Doing: { background: "rgba(245,158,11,0.12)",  borderColor: "rgba(245,158,11,0.40)",  color: "#FCD34D" },
  Done:  { background: "rgba(16,185,129,0.12)",  borderColor: "rgba(16,185,129,0.40)",  color: "#34D399" },
};

const labels: Record<TaskStatus, string> = {
  Todo: "Chờ làm",
  Doing: "Đang làm",
  Done: "Hoàn thành",
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${config[status]}`}
      style={styleMap[status]}
    >
      {labels[status]}
    </span>
  );
}
