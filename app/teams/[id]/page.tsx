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
  const { teams, loading, getTeamTasks, getTeamProgress, getTeamActivity, toggleTask, editTask, deleteTask, lastUpdated } =
    useApp();

  const team = teams.find((t) => t.id === params.id);

  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "kanban" | "gantt" | "activity">("tasks");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Task>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"/>
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

  // Must call hooks unconditionally before any early returns
  const allTasks = getTeamTasks(params.id ?? "");
  const progress = getTeamProgress(params.id ?? "");
  const activity = getTeamActivity(params.id ?? "");
  const today = new Date().toISOString().split("T")[0];

  const totalWeight = allTasks.reduce((s, t) => s + t.weight, 0);
  const weightWarning = totalWeight !== 100;

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const matchFilter = filter === "All" || t.status === filter;
      const matchSearch =
        search === "" || t.title.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [allTasks, filter, search]);

  if (!team) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Không tìm thấy phòng ban.</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm"
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
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          🌳 Về cây
        </button>
        <span className="text-slate-200 select-none">|</span>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors"
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
            <h1 className="text-2xl font-extrabold mb-1">{team.name}</h1>
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3 text-sm text-amber-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0 text-amber-500">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Tổng trọng số công việc là <strong className="mx-1">{totalWeight}</strong>. Nên bằng 100 để tính tiến độ chính xác.
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
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
              activeTab === tab.key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
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
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm công việc…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                />
              </div>

              {/* Add task */}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Thêm công việc
              </button>
            </div>
          </div>

          {/* Task table */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
              Không có công việc nào.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="w-10 px-4 py-3 text-left" />
                      <th className="px-4 py-3 text-left font-semibold text-slate-500">Công việc</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 w-20">Trọng số</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 w-32">Phụ trách</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 w-28">Hạn chót</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 w-24">Trạng thái</th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTasks.map((task) => {
                      const isOverdue = !task.done && task.deadline < today;
                      if (editingId === task.id) return (
                        <tr key={task.id} className="bg-indigo-50 border-l-2 border-indigo-400">
                          <td className="px-4 py-3" />
                          <td className="px-4 py-3" colSpan={4}>
                            <div className="flex flex-col gap-2">
                              <input value={draft.title ?? ""} onChange={e => setDraft(d => ({...d, title: e.target.value}))} placeholder="Tiêu đề" className="w-full text-sm border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                              <input value={draft.description ?? ""} onChange={e => setDraft(d => ({...d, description: e.target.value}))} placeholder="Mô tả (tuỳ chọn)" className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none" />
                              <div className="flex gap-2 flex-wrap items-center">
                                <input value={draft.owner ?? ""} onChange={e => setDraft(d => ({...d, owner: e.target.value}))} placeholder="Phụ trách" className="flex-1 min-w-[120px] text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none" />
                                <label className="text-xs text-slate-500">Bắt đầu<input type="date" value={draft.startDate ?? ""} onChange={e => setDraft(d => ({...d, startDate: e.target.value}))} className="ml-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" /></label>
                                <label className="text-xs text-slate-500">Hạn<input type="date" value={draft.deadline ?? ""} onChange={e => setDraft(d => ({...d, deadline: e.target.value}))} className="ml-1 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" /></label>
                                <label className="text-xs text-slate-500">W<input type="number" value={draft.weight ?? 10} onChange={e => setDraft(d => ({...d, weight: Number(e.target.value)}))} min={1} max={100} className="ml-1 w-14 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" /></label>
                                <select value={draft.status ?? "Todo"} onChange={e => setDraft(d => ({...d, status: e.target.value as TaskStatus}))} className="text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none bg-white">
                                  <option value="Todo">Chờ làm</option>
                                  <option value="Doing">Đang làm</option>
                                  <option value="Done">Hoàn thành</option>
                                </select>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3" colSpan={2}>
                            <div className="flex flex-col gap-1.5">
                              <button onClick={saveEdit} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-semibold">Lưu</button>
                              <button onClick={cancelEdit} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-300">Hủy</button>
                            </div>
                          </td>
                        </tr>
                      );
                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-slate-50 transition-colors ${task.done ? "opacity-60" : ""}`}
                        >
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleTask(task.id, task.owner)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-500 cursor-pointer accent-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <p className={`font-medium text-slate-800 ${task.done ? "line-through text-slate-400" : ""}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">
                              {task.weight}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{task.owner}</td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-medium ${isOverdue ? "text-red-500 font-semibold" : "text-slate-500"}`}>
                              {isOverdue && "⚠ "}
                              {task.deadline}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => startEdit(task)} className="p-1.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition" title="Sửa">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                              </button>
                              {confirmDeleteId === task.id ? (
                                <>
                                  <button onClick={() => { deleteTask(task.id); setConfirmDeleteId(null); }} className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded hover:bg-red-600 font-semibold">Xóa</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-slate-400 hover:text-slate-600 px-1">✕</button>
                                </>
                              ) : (
                                <button onClick={() => setConfirmDeleteId(task.id)} className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition" title="Xóa">
                                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const isOverdue = !task.done && task.deadline < today;
                  return (
                    <div key={task.id} className={`p-4 ${task.done ? "opacity-60" : ""} ${editingId === task.id ? "bg-indigo-50 border-l-2 border-indigo-400" : ""}`}>
                      {editingId === task.id ? (
                        <div className="flex flex-col gap-2">
                          <input value={draft.title ?? ""} onChange={e => setDraft(d => ({...d, title: e.target.value}))} placeholder="Tiêu đề" className="w-full text-sm border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                          <input value={draft.description ?? ""} onChange={e => setDraft(d => ({...d, description: e.target.value}))} placeholder="Mô tả" className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none" />
                          <input value={draft.owner ?? ""} onChange={e => setDraft(d => ({...d, owner: e.target.value}))} placeholder="Phụ trách" className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none" />
                          <div className="flex gap-2 flex-wrap">
                            <input type="date" value={draft.deadline ?? ""} onChange={e => setDraft(d => ({...d, deadline: e.target.value}))} className="flex-1 text-sm border border-slate-200 rounded px-2 py-1.5" />
                            <select value={draft.status ?? "Todo"} onChange={e => setDraft(d => ({...d, status: e.target.value as TaskStatus}))} className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-white">
                              <option value="Todo">Chờ làm</option>
                              <option value="Doing">Đang làm</option>
                              <option value="Done">Hoàn thành</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="flex-1 text-sm bg-indigo-600 text-white py-1.5 rounded hover:bg-indigo-700 font-semibold">Lưu</button>
                            <button onClick={cancelEdit} className="flex-1 text-sm bg-slate-200 text-slate-600 py-1.5 rounded hover:bg-slate-300">Hủy</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(task.id, task.owner)}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-indigo-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-semibold text-slate-800 text-sm ${task.done ? "line-through text-slate-400" : ""}`}>
                                {task.title}
                              </p>
                              <StatusBadge status={task.status} />
                            </div>
                            {task.description && (
                              <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                              <span>w:{task.weight}</span>
                              <span>{task.owner}</span>
                              <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                                {isOverdue && "⚠ "}{task.deadline}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => startEdit(task)} className="p-1.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                            </button>
                            {confirmDeleteId === task.id ? (
                              <>
                                <button onClick={() => { deleteTask(task.id); setConfirmDeleteId(null); }} className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-semibold">Xóa</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-slate-400 px-1">✕</button>
                              </>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(task.id)} className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                              </button>
                            )}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Bảng Kanban</h3>
          <KanbanBoard tasks={allTasks} teamColor={team.color} />
        </div>
      )}

      {activeTab === "gantt" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Biểu đồ Gantt</h3>
          <GanttChart tasks={allTasks} teamColor={team.color} />
        </div>
      )}

      {activeTab === "activity" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
          <h3 className="font-semibold text-slate-700 mb-4 text-sm">Nhật ký hoạt động</h3>
          <ActivityLog entries={activity} />
        </div>
      )}

      {showModal && (
        <AddTaskModal teamId={team.id} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
