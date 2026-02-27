"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useApp } from "@/lib/AppContext";
import ProgressBar from "@/components/ProgressBar";
import StatusBadge from "@/components/StatusBadge";
import AddTaskModal from "@/components/AddTaskModal";
import ActivityLog from "@/components/ActivityLog";
import KanbanBoard from "@/components/KanbanBoard";
import GanttChart from "@/components/GanttChart";
import { Task, TaskStatus } from "@/lib/types";

type Filter = "All" | TaskStatus;
const FILTERS: Filter[] = ["All", "Todo", "Doing", "Done"];
const FILTER_LABELS: Record<Filter, string> = {
  All: "Tất cả",
  Todo: "Chờ làm",
  Doing: "Đang làm",
  Done: "Hoàn thành",
};

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { teams, loading, getTeamTasks, getTeamProgress, getTeamActivity, toggleTask, editTask, deleteTask, lastUpdated,
          canEdit } =
    useApp();

  const team = teams.find((t) => t.id === params.id);
  const editable = canEdit(params.id ?? ""); // true for admin, true for leader of this division

  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "kanban" | "gantt" | "activity">("tasks");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Task>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── ALL hooks must be called unconditionally before any early returns ──
  const allTasks = getTeamTasks(params.id ?? "");
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const matchFilter = filter === "All" || t.status === filter;
      const matchSearch =
        search === "" || t.title.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [allTasks, filter, search]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-white/40">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"/>
        <span className="text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>
  );

  function startEdit(task: Task) {
    setEditingId(task.id);
    setDraft({ title: task.title, description: task.description, owner: task.owner, deadline: task.deadline, startDate: task.startDate ?? "", weight: task.weight, status: task.status });
  }
  function saveEdit() {
    if (!editingId) return;
    editTask(editingId, draft);
    setEditingId(null);
  }
  function cancelEdit() { setEditingId(null); }

  const progress = getTeamProgress(params.id ?? "");
  const activity = getTeamActivity(params.id ?? "");
  const today = new Date().toISOString().split("T")[0];

  const totalWeight = allTasks.reduce((s, t) => s + t.weight, 0);
  const weightWarning = totalWeight !== 100;

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Không tìm thấy phòng ban.</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-white/20 text-white rounded-xl text-sm"
        >
          Về Tổng quan
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Navigation buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/teams")}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Tổng quan
        </button>
      </div>

      {/* Team header card */}
      <div
        className="rounded-2xl p-6 mb-6 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${team.color}ee, ${team.color}99)`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-center">{team.name}</h1>
            <p className="text-white/70 text-sm">{allTasks.length} công việc · {allTasks.filter((t) => t.done).length} hoàn thành</p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:w-72 w-full">
            <span className="text-4xl font-extrabold">{progress}%</span>
            <div className="w-full">
              <ProgressBar value={progress} color="rgba(255,255,255,0.9)" size="lg" />
            </div>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-white/50 text-xs mt-4">
            Cập nhật lúc{" "}
            {new Date(lastUpdated).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}{" "}
            ngày {new Date(lastUpdated).toLocaleDateString("vi-VN")}
          </p>
        )}
      </div>

      {/* Weight warning */}
      {weightWarning && (
        <div className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 text-sm text-white/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0 text-white/40">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Tổng trọng số công việc là <strong className="mx-1">{totalWeight}</strong>. Nên bằng 100 để tính tiến độ chính xác.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 rounded-xl p-1 w-fit flex-wrap" style={{ background: "rgba(42,42,42,0.8)" }}>
        {([
          { key: "tasks",    label: "Công việc" },
          { key: "kanban",   label: "Kanban" },
          { key: "gantt",    label: "Gantt" },
          { key: "activity", label: `Nhật ký${activity.length > 0 ? ` (${activity.length})` : ""}` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? "shadow-sm" : ""
            }`}
            style={activeTab === tab.key ? {
              background: "#3a3a3a",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.40)"
            } : { color: "#aaaaaa" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "tasks" && (
        <div>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === f
                      ? "bg-white/20 text-white shadow-sm"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {FILTER_LABELS[f]}
                  {f !== "All" && (
                    <span className="ml-1 opacity-70">
                      {allTasks.filter((t) => t.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm công việc…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition"
                />
              </div>

              {/* Add task — chỉ hiện nếu có quyền chỉnh sửa */}
              {editable && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl transition shrink-0"
                style={{ background: "linear-gradient(135deg, #333333, #444444)", boxShadow: "0 4px 14px -2px rgba(0,0,0,0.40)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Thêm công việc
              </button>
              )}
            </div>
          </div>

          {/* Task table */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(42,42,42,0.85)", border: "1px solid rgba(255,255,255,0.08)", color: "#aaaaaa" }}>
              Không có công việc nào.
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(36,36,36,0.90)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.4)" }}>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <th className="w-10 px-4 py-3 text-left" />
                      <th className="px-4 py-3 text-left font-semibold" style={{ color: "#aaaaaa" }}>Công việc</th>
                      <th className="px-4 py-3 text-left font-semibold w-20" style={{ color: "#aaaaaa" }}>Trọng số</th>
                      <th className="px-4 py-3 text-left font-semibold w-32" style={{ color: "#aaaaaa" }}>Phụ trách</th>
                      <th className="px-4 py-3 text-left font-semibold w-28" style={{ color: "#aaaaaa" }}>Hạn chờ</th>
                      <th className="px-4 py-3 text-left font-semibold w-24" style={{ color: "#aaaaaa" }}>Trạng thái</th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {filteredTasks.map((task) => {
                      const isOverdue = !task.done && task.deadline < today;
                      if (editingId === task.id) return (
                        <tr key={task.id} style={{ background: "rgba(255,255,255,0.04)", borderLeft: "2px solid rgba(255,255,255,0.25)" }}>
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3" colSpan={4}>
                            <div className="flex flex-col gap-2">
                              <input value={draft.title ?? ""} onChange={e => setDraft(d => ({...d, title: e.target.value}))} placeholder="Tiêu đề" className="w-full text-sm border border-white/20 bg-white/5 text-white/80 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30" />
                              <input value={draft.description ?? ""} onChange={e => setDraft(d => ({...d, description: e.target.value}))} placeholder="Mô tả (tuỳ chọn)" className="w-full text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1.5 focus:outline-none" />
                              <div className="flex gap-2 flex-wrap items-center">
                                <input value={draft.owner ?? ""} onChange={e => setDraft(d => ({...d, owner: e.target.value}))} placeholder="Phụ trách" className="flex-1 min-w-[120px] text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1.5 focus:outline-none" />
                                <label className="text-xs text-white/50">Bắt đầu<input type="date" value={draft.startDate ?? ""} onChange={e => setDraft(d => ({...d, startDate: e.target.value}))} className="ml-1 text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1 focus:outline-none" /></label>
                                <label className="text-xs text-white/50">Hạn<input type="date" value={draft.deadline ?? ""} onChange={e => setDraft(d => ({...d, deadline: e.target.value}))} className="ml-1 text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1 focus:outline-none" /></label>
                                <label className="text-xs text-white/50">W<input type="number" value={draft.weight ?? 10} onChange={e => setDraft(d => ({...d, weight: Number(e.target.value)}))} min={1} max={100} className="ml-1 w-14 text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1 focus:outline-none" /></label>
                                <select value={draft.status ?? "Todo"} onChange={e => setDraft(d => ({...d, status: e.target.value as TaskStatus}))} className="text-sm border border-white/15 bg-[#2a2a2a] text-white/80 rounded px-2 py-1.5 focus:outline-none">
                                  <option value="Todo">Chờ làm</option>
                                  <option value="Doing">Đang làm</option>
                                  <option value="Done">Hoàn thành</option>
                                </select>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3" colSpan={2}>
                            <div className="flex flex-col gap-1.5">
                              <button onClick={saveEdit} className="text-xs text-white px-3 py-1.5 rounded font-semibold" style={{ background: "#3a3a3a" }}>Lưu</button>
                              <button onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#cccccc", border: "1px solid rgba(255,255,255,0.12)" }}>Hủy</button>
                            </div>
                          </td>
                        </tr>
                      );
                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-white/3 transition-colors ${task.done ? "opacity-60" : ""}`}
                        >
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleTask(task.id, task.owner)}
                              className="w-4 h-4 rounded border-white/30 accent-white cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <p className={`font-medium text-sm ${
                            task.done ? "line-through" : ""
                          }`} style={{ color: task.done ? "#555555" : "#ffffff" }}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs" style={{ background: "rgba(255,255,255,0.08)", color: "#cccccc" }}>
                              {task.weight}
                            </span>
                          </td>
                          <td className="px-4 py-4" style={{ color: "#cccccc" }}>{task.owner}</td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-medium ${isOverdue ? "text-white/40 font-semibold" : "text-white/50"}`}>
                              {isOverdue && "⚠ "}
                              {task.deadline}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              {editable && (
                              <button onClick={() => startEdit(task)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition" title="Sửa">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                              </button>
                              )}
                              {editable && (confirmDeleteId === task.id ? (
                                <>
                                  <button onClick={() => { deleteTask(task.id); setConfirmDeleteId(null); }} className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded hover:bg-white/30 font-semibold">Xóa</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-white/40 hover:text-white/60 px-1">✕</button>
                                </>
                              ) : (
                                <button onClick={() => setConfirmDeleteId(task.id)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/50 transition" title="Xóa">
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {filteredTasks.map((task) => {
                  const isOverdue = !task.done && task.deadline < today;
                  return (
                    <div key={task.id} className={`p-4 ${task.done ? "opacity-60" : ""} ${editingId === task.id ? "border-l-2" : ""}`}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", ...(editingId === task.id ? { background: "rgba(255,255,255,0.04)", borderLeftColor: "rgba(255,255,255,0.25)" } : {}) }}>
                      {editingId === task.id ? (
                        <div className="flex flex-col gap-2">
                          <input value={draft.title ?? ""} onChange={e => setDraft(d => ({...d, title: e.target.value}))} placeholder="Tiêu đề" className="w-full text-sm border border-white/20 bg-white/5 text-white/80 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30" />
                          <input value={draft.description ?? ""} onChange={e => setDraft(d => ({...d, description: e.target.value}))} placeholder="Mô tả" className="w-full text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1.5 focus:outline-none" />
                          <input value={draft.owner ?? ""} onChange={e => setDraft(d => ({...d, owner: e.target.value}))} placeholder="Phụ trách" className="w-full text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1.5 focus:outline-none" />
                          <div className="flex gap-2 flex-wrap">
                            <input type="date" value={draft.deadline ?? ""} onChange={e => setDraft(d => ({...d, deadline: e.target.value}))} className="flex-1 text-sm border border-white/15 bg-white/5 text-white/70 rounded px-2 py-1.5" />
                            <select value={draft.status ?? "Todo"} onChange={e => setDraft(d => ({...d, status: e.target.value as TaskStatus}))} className="text-sm border border-white/15 bg-[#2a2a2a] text-white/80 rounded px-2 py-1.5">
                              <option value="Todo">Chờ làm</option>
                              <option value="Doing">Đang làm</option>
                              <option value="Done">Hoàn thành</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="flex-1 text-sm text-white py-1.5 rounded font-semibold" style={{ background: "#3a3a3a" }}>Lưu</button>
                            <button onClick={cancelEdit} className="flex-1 text-sm py-1.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#cccccc" }}>Hủy</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => editable && toggleTask(task.id, task.owner)}
                            disabled={!editable}
                            title={!editable ? "Cần đăng nhập để thay đổi trạng thái" : undefined}
                            className={`mt-0.5 w-4 h-4 rounded border-white/30 accent-white shrink-0 ${editable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-semibold text-white/80 text-sm ${task.done ? "line-through text-white/30" : ""}`}>
                                {task.title}
                              </p>
                              <StatusBadge status={task.status} />
                            </div>
                            {task.description && (
                              <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-white/40 flex-wrap">
                              <span>w:{task.weight}</span>
                              <span>{task.owner}</span>
                              <span className={isOverdue ? "text-white/40 font-semibold" : ""}>
                                {isOverdue && "⚠ "}{task.deadline}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {editable && (
                            <button onClick={() => startEdit(task)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            </button>
                            )}
                            {editable && (confirmDeleteId === task.id ? (
                              <>
                                <button onClick={() => { deleteTask(task.id); setConfirmDeleteId(null); }} className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-semibold">Xóa</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-white/40 px-1">✕</button>
                              </>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(task.id)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/50 transition">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "kanban" && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(36,36,36,0.90)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.4)" }}>
          <h3 className="font-semibold mb-4 text-sm text-center" style={{ color: "#cccccc" }}>Bảng Kanban</h3>
          <KanbanBoard tasks={allTasks} teamColor={team.color} />
        </div>
      )}

      {activeTab === "gantt" && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(36,36,36,0.90)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.4)" }}>
          <h3 className="font-semibold mb-4 text-sm text-center" style={{ color: "#cccccc" }}>Biểu đồ Gantt</h3>
          <GanttChart tasks={allTasks} teamColor={team.color} />
        </div>
      )}

      {activeTab === "activity" && (
        <div className="rounded-2xl px-6 py-4" style={{ background: "rgba(36,36,36,0.90)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.4)" }}>
          <h3 className="font-semibold mb-4 text-sm text-center" style={{ color: "#cccccc" }}>Nhật ký hoạt động</h3>
          <ActivityLog entries={activity} />
        </div>
      )}      

      {editable && showModal && (
        <AddTaskModal teamId={team.id} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
