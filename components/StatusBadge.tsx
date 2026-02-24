import { TaskStatus } from "@/lib/types";

const config: Record<TaskStatus, string> = {
  Todo: "bg-slate-100 text-slate-500",
  Doing: "bg-amber-100 text-amber-700",
  Done: "bg-emerald-100 text-emerald-700",
};

const labels: Record<TaskStatus, string> = {
  Todo: "Chờ làm",
  Doing: "Đang làm",
  Done: "Hoàn thành",
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config[status]}`}>
      {labels[status]}
    </span>
  );
}
