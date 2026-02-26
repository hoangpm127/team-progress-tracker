import { ActivityEntry } from "@/lib/types";

interface ActivityLogProps {
  entries: ActivityEntry[];
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Chưa có hoạt động nào. Hoàn thành công việc để xem nhật ký tại đây.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-50">
      {entries.slice(0, 20).map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 py-3">
          <span className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">{entry.message}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {timeAgo(entry.timestamp)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
