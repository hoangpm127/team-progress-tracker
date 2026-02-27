import { TaskStatus } from "@/lib/types";
import React from "react";

const config: Record<TaskStatus, string> = {
  Todo: "border text-xs font-semibold",
  Doing: "border text-xs font-semibold",
  Done: "border text-xs font-semibold",
};

const styleMap: Record<TaskStatus, React.CSSProperties> = {
  Todo:  { background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.18)", color: "#aaaaaa" },
  Doing: { background: "rgba(255,255,255,0.06)",  borderColor: "rgba(255,255,255,0.20)",  color: "#cccccc" },
  Done:  { background: "rgba(255,255,255,0.09)",  borderColor: "rgba(255,255,255,0.25)",  color: "#dddddd" },
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
