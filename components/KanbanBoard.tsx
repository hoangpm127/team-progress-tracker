"use client";

import { Task, TaskStatus } from "@/lib/types";
import { useApp } from "@/lib/AppContext";
import { useState } from "react";

const COLUMNS: { status: TaskStatus; label: string; bg: string; border: string }[] = [
  { status: "Todo",  label: "Chờ làm",    bg: "bg-slate-50",   border: "border-slate-200" },
  { status: "Doing", label: "Đang làm",   bg: "bg-indigo-50",  border: "border-indigo-200" },
  { status: "Done",  label: "Hoàn thành", bg: "bg-emerald-50", border: "border-emerald-200" },
];

function isOverdue(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

function TaskCard({
  task,
  teamColor,
  onMove,
}: {
  task: Task;
  teamColor: string;
  onMove: (status: TaskStatus) => void;
}) {
  const overdue = task.status !== "Done" && isOverdue(task.deadline);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
      className={`bg-white rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing mb-2 group
        ${overdue ? "border-red-300" : "border-slate-200"}`}
    >
      {overdue && (
        <span className="text-xs text-red-500 font-semibold mb-1 block">⚠ Quá hạn</span>
      )}
      <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">{task.title}</p>
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: teamColor }}
          />
          <span className="text-xs text-slate-500 truncate max-w-[80px]">{task.owner}</span>
        </div>
        <span className="text-xs text-slate-400">
          {new Date(task.deadline).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
        </span>
      </div>
      {/* quick move buttons */}
      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
          <button
            key={c.status}
            onClick={() => onMove(c.status)}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  teamColor: string;
}

export default function KanbanBoard({ tasks, teamColor }: KanbanBoardProps) {
  const { updateTaskStatus } = useApp();
  const [draggingOver, setDraggingOver] = useState<TaskStatus | null>(null);

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      updateTaskStatus(taskId, status, task?.owner ?? "");
    }
    setDraggingOver(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isOver = draggingOver === col.status;
        return (
          <div
            key={col.status}
            className={`rounded-xl border-2 p-3 min-h-[200px] transition-colors
              ${col.bg} ${isOver ? "border-indigo-400 bg-indigo-50" : col.border}`}
            onDragOver={(e) => { e.preventDefault(); setDraggingOver(col.status); }}
            onDragLeave={() => setDraggingOver(null)}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700">{col.label}</span>
              <span
                className="text-xs font-semibold rounded-full px-2 py-0.5 text-white"
                style={{ background: teamColor }}
              >
                {colTasks.length}
              </span>
            </div>
            {/* Cards */}
            {colTasks.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                Kéo thả thẻ vào đây
              </div>
            ) : (
              colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  teamColor={teamColor}
                  onMove={(status) => updateTaskStatus(task.id, status, task.owner)}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
