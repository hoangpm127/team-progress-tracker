"use client";

import { useApp } from "@/lib/AppContext";
import { Objective, KeyResult } from "@/lib/types";
import { useState } from "react";

const TEAM_META: Record<string, { name: string; color: string }> = {
  company:      { name: "Toàn công ty", color: "#64748b" },
  tech:         { name: "Công nghệ",    color: "#6366f1" },
  marketing:    { name: "Marketing",    color: "#ec4899" },
  hr:           { name: "Nhân sự",      color: "#f59e0b" },
  partnerships: { name: "Hợp tác",      color: "#10b981" },
  assistant:    { name: "Hành chính",   color: "#3b82f6" },
};
const GROUP_ORDER = ["company", "tech", "marketing", "hr", "partnerships", "assistant"];

function krProgress(kr: KeyResult): number {
  if (kr.target === 0) return 100;
  if ((kr.unit === "ms" || kr.unit === "%") && kr.current > kr.target) {
    return Math.max(0, Math.min(100, Math.round((1 - (kr.current - kr.target) / kr.target) * 100)));
  }
  return Math.max(0, Math.min(100, Math.round((kr.current / kr.target) * 100)));
}

function objProgress(obj: Objective): number {
  if (obj.keyResults.length === 0) return 0;
  return Math.round(obj.keyResults.reduce((s, kr) => s + krProgress(kr), 0) / obj.keyResults.length);
}

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1e293b">
        {pct}%
      </text>
    </svg>
  );
}

function KrRow({ kr, onUpdateCurrent, onUpdateKr, onDelete }: {
  kr: KeyResult;
  onUpdateCurrent: (krId: string, val: number) => void;
  onUpdateKr: (krId: string, updates: Partial<Omit<KeyResult, "id">>) => void;
  onDelete: (krId: string) => void;
}) {
  const pct = krProgress(kr);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: kr.title, current: String(kr.current), target: String(kr.target), unit: kr.unit });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editCurrent, setEditCurrent] = useState(false);
  const [currentVal, setCurrentVal] = useState(String(kr.current));

  let barColor = "#6366f1";
  if (pct >= 100) barColor = "#10b981";
  else if (pct < 40) barColor = "#ef4444";
  else if (pct < 70) barColor = "#f59e0b";

  function save() {
    onUpdateKr(kr.id, {
      title: draft.title,
      current: parseFloat(draft.current) || 0,
      target: parseFloat(draft.target) || 1,
      unit: draft.unit,
    });
    setEditing(false);
  }

  return (
    <div className={`py-3 border-b border-slate-100 last:border-0 ${editing ? "bg-slate-50 -mx-4 px-4 rounded-lg" : ""}`}>
      {editing ? (
        <div className="flex flex-col gap-2">
          <input value={draft.title} onChange={e => setDraft(d => ({...d, title: e.target.value}))}
            className="w-full text-sm border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="flex gap-2 flex-wrap items-center">
            <label className="text-xs text-slate-500">Hiện tại
              <input type="number" value={draft.current} onChange={e => setDraft(d => ({...d, current: e.target.value}))}
                className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
            </label>
            <label className="text-xs text-slate-500">Mục tiêu
              <input type="number" value={draft.target} onChange={e => setDraft(d => ({...d, target: e.target.value}))}
                className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
            </label>
            <label className="text-xs text-slate-500">Đơn vị
              <input value={draft.unit} onChange={e => setDraft(d => ({...d, unit: e.target.value}))}
                className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
            </label>
            <button onClick={save} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-semibold">Lưu</button>
            <button onClick={() => setEditing(false)} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-300">Hủy</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{kr.title}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {editCurrent ? (
              <>
                <input type="number" value={currentVal} onChange={e => setCurrentVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { const n = parseFloat(currentVal); if (!isNaN(n)) onUpdateCurrent(kr.id, n); setEditCurrent(false); } if (e.key === "Escape") setEditCurrent(false); }}
                  className="w-20 text-sm border border-indigo-300 rounded px-2 py-0.5 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400" autoFocus />
                <button onClick={() => { const n = parseFloat(currentVal); if (!isNaN(n)) onUpdateCurrent(kr.id, n); setEditCurrent(false); }}
                  className="text-xs bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600">Lưu</button>
                <button onClick={() => setEditCurrent(false)} className="text-xs text-slate-500 hover:text-slate-700">Hủy</button>
              </>
            ) : (
              <button onClick={() => { setCurrentVal(String(kr.current)); setEditCurrent(true); }}
                className="text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition">
                {kr.current} / {kr.target} {kr.unit}
              </button>
            )}
            <button onClick={() => { setDraft({ title: kr.title, current: String(kr.current), target: String(kr.target), unit: kr.unit }); setEditing(true); }}
              className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition" title="Sửa KR">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
            {confirmDelete ? (
              <>
                <button onClick={() => onDelete(kr.id)} className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded hover:bg-red-600 font-semibold">Xóa</button>
                <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-400 hover:text-slate-600">✕</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition" title="Xóa KR">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddKrForm({ onAdd, onCancel }: { onAdd: (kr: Omit<KeyResult, "id">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("100");
  const [unit, setUnit] = useState("%");
  return (
    <div className="flex flex-col gap-2 py-3 border-t border-indigo-100 bg-indigo-50 -mx-4 px-4 rounded-b-xl">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề kết quả then chốt"
        className="w-full text-sm border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <div className="flex gap-2 flex-wrap items-center">
        <label className="text-xs text-slate-500">Mục tiêu
          <input type="number" value={target} onChange={e => setTarget(e.target.value)}
            className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
        </label>
        <label className="text-xs text-slate-500">Đơn vị
          <input value={unit} onChange={e => setUnit(e.target.value)}
            className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
        </label>
        <button onClick={() => { if (title.trim()) onAdd({ title: title.trim(), current: 0, target: parseFloat(target) || 100, unit }); }}
          disabled={!title.trim()}
          className="text-xs bg-indigo-600 disabled:opacity-40 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-semibold">Thêm KR</button>
        <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-700">Hủy</button>
      </div>
    </div>
  );
}

function ObjCard({ obj }: { obj: Objective }) {
  const { updateKeyResult, addKeyResult, deleteKeyResult, updateObjective, deleteObjective } = useApp();
  const meta = TEAM_META[obj.teamId] ?? { name: obj.teamId, color: "#64748b" };
  const pct = objProgress(obj);
  const [open, setOpen] = useState(true);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDraft, setHeaderDraft] = useState({ title: obj.title, quarter: obj.quarter });
  const [addingKr, setAddingKr] = useState(false);
  const [confirmDeleteObj, setConfirmDeleteObj] = useState(false);

  function saveHeader() {
    updateObjective(obj.id, { title: headerDraft.title, quarter: headerDraft.quarter });
    setEditingHeader(false);
  }

  function handleUpdateKr(krId: string, updates: Partial<Omit<KeyResult, "id">>) {
    updateObjective(obj.id, {
      keyResults: obj.keyResults.map(k => k.id === krId ? { ...k, ...updates } : k),
    } as never);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {editingHeader ? (
        <div className="p-4 bg-slate-50 flex flex-col gap-2">
          <input value={headerDraft.title} onChange={e => setHeaderDraft(d => ({...d, title: e.target.value}))}
            className="w-full text-sm font-semibold border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="flex gap-2 items-center">
            <input value={headerDraft.quarter} onChange={e => setHeaderDraft(d => ({...d, quarter: e.target.value}))}
              placeholder="Q1 2026" className="w-24 text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none" />
            <button onClick={saveHeader} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-semibold">Lưu</button>
            <button onClick={() => setEditingHeader(false)} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-300">Hủy</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition group" onClick={() => setOpen(o => !o)}>
          <ProgressRing pct={pct} color={meta.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: meta.color }}>
                {obj.quarter}
              </span>
            </div>
            <p className="font-semibold text-slate-800 leading-snug">{obj.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{obj.keyResults.length} kết quả then chốt</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setHeaderDraft({ title: obj.title, quarter: obj.quarter }); setEditingHeader(true); }}
              className="p-1.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition" title="Sửa mục tiêu">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
            {confirmDeleteObj ? (
              <>
                <button onClick={() => deleteObjective(obj.id)} className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 font-semibold">Xóa</button>
                <button onClick={() => setConfirmDeleteObj(false)} className="text-[10px] text-slate-400 px-1">✕</button>
              </>
            ) : (
              <button onClick={() => setConfirmDeleteObj(true)} className="p-1.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition" title="Xóa mục tiêu">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
          <svg className="w-5 h-5 text-slate-400 transition-transform shrink-0" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      {open && (
        <div className="px-4 pb-2 border-t border-slate-100">
          {obj.keyResults.map(kr => (
            <KrRow key={kr.id} kr={kr}
              onUpdateCurrent={(krId, val) => updateKeyResult(obj.id, krId, val)}
              onUpdateKr={(krId, updates) => handleUpdateKr(krId, updates)}
              onDelete={krId => deleteKeyResult(obj.id, krId)}
            />
          ))}
          {addingKr ? (
            <AddKrForm
              onAdd={kr => { addKeyResult(obj.id, kr); setAddingKr(false); }}
              onCancel={() => setAddingKr(false)}
            />
          ) : (
            <button onClick={() => setAddingKr(true)}
              className="mt-2 mb-1 w-full text-xs text-indigo-500 hover:text-indigo-700 border border-dashed border-indigo-200 hover:border-indigo-400 rounded-lg py-1.5 transition flex items-center justify-center gap-1">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Thêm kết quả then chốt
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddObjModal({ onClose }: { onClose: () => void }) {
  const { addObjective } = useApp();
  const [title, setTitle] = useState("");
  const [quarter, setQuarter] = useState("Q2 2026");
  const [teamId, setTeamId] = useState("company");

  function submit() {
    if (!title.trim()) return;
    addObjective({ title: title.trim(), quarter, teamId, keyResults: [] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Thêm mục tiêu mới</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Tiêu đề mục tiêu *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Tăng trưởng doanh thu 40%"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" autoFocus />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Phòng ban</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {GROUP_ORDER.map(id => (
                  <option key={id} value={id}>{TEAM_META[id]?.name ?? id}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Quý</label>
              <input value={quarter} onChange={e => setQuarter(e.target.value)} placeholder="Q2 2026"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={submit} disabled={!title.trim()}
            className="flex-1 bg-indigo-600 disabled:opacity-40 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700">
            Tạo mục tiêu
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200">
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OKRPage() {
  const { objectives, loading, getTeamObjectives, getCompanyObjectives } = useApp();
  const [showAddObj, setShowAddObj] = useState(false);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"/>
        <span className="text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>
  );

  const grouped: Record<string, Objective[]> = {};
  for (const teamId of GROUP_ORDER) {
    const objs = teamId === "company" ? getCompanyObjectives() : getTeamObjectives(teamId);
    if (objs.length > 0) grouped[teamId] = objs;
  }

  const totalObjs = objectives.length;
  const completedObjs = objectives.filter(o => objProgress(o) >= 100).length;
  const avgOverall = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + objProgress(o), 0) / objectives.length) : 0;
  const totalKRs = objectives.reduce((s, o) => s + o.keyResults.length, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight text-center" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "0.12em" }}>Mục tiêu &amp; Kết quả then chốt (OKR)</h1>
          <p className="text-slate-500 mt-1 text-sm">Theo dõi và chỉnh sửa OKR theo phòng ban</p>
        </div>
        <button onClick={() => setShowAddObj(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shrink-0">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Thêm mục tiêu
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng mục tiêu",      value: totalObjs,        color: "#6366f1" },
          { label: "Hoàn thành",         value: completedObjs,    color: "#10b981" },
          { label: "Kết quả then chốt",  value: totalKRs,         color: "#f59e0b" },
          { label: "Tiến độ TB",         value: `${avgOverall}%`, color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {GROUP_ORDER.map(teamId => {
        const objs = grouped[teamId];
        if (!objs || objs.length === 0) return null;
        const meta = TEAM_META[teamId] ?? { name: teamId, color: "#64748b" };
        const teamAvg = Math.round(objs.reduce((s, o) => s + objProgress(o), 0) / objs.length);
        return (
          <div key={teamId} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-7 rounded-full" style={{ background: meta.color }} />
              <h2 className="text-base font-bold text-slate-700 text-center">{meta.name}</h2>
              <span className="text-sm text-slate-400 ml-auto">
                Tiến độ TB: <strong style={{ color: meta.color }}>{teamAvg}%</strong>
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {objs.map(obj => <ObjCard key={obj.id} obj={obj} />)}
            </div>
          </div>
        );
      })}

      {showAddObj && <AddObjModal onClose={() => setShowAddObj(false)} />}
    </div>
  );
}
