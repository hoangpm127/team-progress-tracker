"use client";

import { Task } from "@/lib/types";
import { useMemo } from "react";

const STATUS_COLORS: Record<string, string> = {
  Done:  "#10b981",
  Doing: "#f59e0b",
  Todo:  "#94a3b8",
};

interface GanttChartProps {
  tasks: Task[];
  teamColor: string;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function GanttChart({ tasks, teamColor }: GanttChartProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute timeline bounds
  const { minDate, maxDate, days } = useMemo(() => {
    const dates: Date[] = [];
    for (const t of tasks) {
      if (t.startDate) dates.push(new Date(t.startDate));
      dates.push(new Date(t.deadline));
    }
    if (dates.length === 0) {
      return { minDate: today, maxDate: addDays(today, 30), days: 30 };
    }
    const min = addDays(new Date(Math.min(...dates.map((d) => d.getTime()))), -2);
    const max = addDays(new Date(Math.max(...dates.map((d) => d.getTime()))), 2);
    min.setHours(0, 0, 0, 0);
    max.setHours(0, 0, 0, 0);
    const days = Math.max(7, Math.round((max.getTime() - min.getTime()) / 86400000));
    return { minDate: min, maxDate: max, days };
  }, [tasks]);

  // Week headers
  const weekMarkers = useMemo(() => {
    const markers: { label: string; pct: number }[] = [];
    let d = new Date(minDate);
    // Align to Monday
    const dow = d.getDay();
    if (dow !== 1) d = addDays(d, ((8 - dow) % 7));
    while (d <= maxDate) {
      const pct = ((d.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
      markers.push({ label: formatDate(d), pct });
      d = addDays(d, 7);
    }
    return markers;
  }, [minDate, maxDate]);

  // Today position
  const todayPct =
    ((today.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  function taskBar(task: Task) {
    const start = task.startDate ? new Date(task.startDate) : new Date(task.deadline);
    const end = new Date(task.deadline);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const range = maxDate.getTime() - minDate.getTime();
    const left = Math.max(0, ((start.getTime() - minDate.getTime()) / range) * 100);
    const right = Math.min(100, ((end.getTime() - minDate.getTime()) / range) * 100);
    const width = Math.max(1, right - left);

    const isOverdue = task.status !== "Done" && end < today;
    const color = isOverdue ? "#ef4444" : STATUS_COLORS[task.status] ?? teamColor;

    return { left, width, color, isOverdue };
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        Không có công việc nào để hiển thị.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(600, days * 16) + "px" }}>
        {/* Week header */}
        <div className="relative h-8 mb-1 border-b border-slate-200">
          {weekMarkers.map((m) => (
            <span
              key={m.pct}
              className="absolute top-1 text-[10px] text-slate-400 font-medium transform -translate-x-1/2 select-none"
              style={{ left: m.pct + "%" }}
            >
              {m.label}
            </span>
          ))}
          {/* Grid lines */}
          {weekMarkers.map((m) => (
            <div
              key={"line-" + m.pct}
              className="absolute top-0 bottom-0 border-l border-slate-200"
              style={{ left: m.pct + "%" }}
            />
          ))}
          {/* Today line */}
          {showToday && (
            <div
              className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10"
              style={{ left: todayPct + "%" }}
            />
          )}
        </div>

        {/* Task rows */}
        {tasks.map((task) => {
          const bar = taskBar(task);
          return (
            <div key={task.id} className="flex items-center mb-1 group">
              {/* Label */}
              <div className="w-40 shrink-0 pr-2">
                <p className="text-xs font-medium text-slate-700 truncate leading-tight">
                  {task.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{task.owner}</p>
              </div>

              {/* Bar track */}
              <div className="relative flex-1 h-7 bg-slate-100 rounded overflow-hidden">
                {/* Week grid lines */}
                {weekMarkers.map((m) => (
                  <div
                    key={"row-" + m.pct}
                    className="absolute top-0 bottom-0 border-l border-slate-200"
                    style={{ left: m.pct + "%" }}
                  />
                ))}
                {/* Today line */}
                {showToday && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-red-400 z-10"
                    style={{ left: todayPct + "%" }}
                  />
                )}
                {/* Bar */}
                <div
                  className="absolute top-1 h-5 rounded flex items-center px-2 text-white text-[10px] font-semibold overflow-hidden transition-opacity group-hover:opacity-90"
                  style={{
                    left: bar.left + "%",
                    width: bar.width + "%",
                    background: bar.color,
                    minWidth: "4px",
                  }}
                  title={`${task.title} — ${task.status}`}
                >
                  {bar.width > 8 ? task.status === "Done" ? "Xong" : task.status === "Doing" ? "Đang làm" : "Chờ" : ""}
                </div>
              </div>

              {/* Deadline label */}
              <div className="w-14 shrink-0 pl-2">
                <span className={`text-[10px] ${bar.isOverdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                  {new Date(task.deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
          {[
            { color: STATUS_COLORS.Done,  label: "Hoàn thành" },
            { color: STATUS_COLORS.Doing, label: "Đang làm" },
            { color: STATUS_COLORS.Todo,  label: "Chờ làm" },
            { color: "#ef4444",           label: "Quá hạn" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span className="text-xs text-slate-500">{l.label}</span>
            </div>
          ))}
          {showToday && (
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-0.5 h-3 bg-red-400" />
              <span className="text-xs text-slate-500">Hôm nay</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
