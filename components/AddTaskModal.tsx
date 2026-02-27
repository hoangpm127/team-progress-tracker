"use client";
import { useState } from "react";
import { TaskStatus } from "@/lib/types";
import { useApp } from "@/lib/AppContext";

interface AddTaskModalProps {
  teamId: string;
  onClose: () => void;
}

const STATUSES: TaskStatus[] = ["Todo", "Doing", "Done"];

export default function AddTaskModal({ teamId, onClose }: AddTaskModalProps) {
  const { addTask } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(10);
  const [owner, setOwner] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Todo");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Tiêu đề không được để trống."); return; }
    if (!owner.trim()) { setError("Người phụ trách không được để trống."); return; }
    if (!deadline) { setError("Vui lòng chọn hạn chót."); return; }
    if (weight < 1 || weight > 30) { setError("Trọng số phải nằm trong khoảng 1–30."); return; }

    addTask({
      teamId,
      title: title.trim(),
      description: description.trim(),
      weight,
      owner: owner.trim(),
      deadline,
      status,
      done: status === "Done",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 80px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold" style={{ color: "#ffffff" }}>Thêm công việc mới</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-white/5 border border-white/15 text-white/60 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Tiêu đề <span className="text-white/35">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VĐ: Triển khai môi trường staging"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết (không bắt buộc)…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Trọng số (1–30) <span className="text-white/35">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Trạng thái <span className="text-white/35">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-white/15 bg-[#2a2a2a] px-3.5 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Owner <span className="text-white/35">*</span>
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Tech Lead"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">
                Hạn chẫt <span className="text-white/35">*</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(30,30,30,0.80)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "#cccccc", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#3a3a3a", boxShadow: "0 4px 14px -2px rgba(0,0,0,0.40)" }}
          >
            Thêm công việc
          </button>
        </div>
      </div>
    </div>
  );
}
