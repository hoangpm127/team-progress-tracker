"use client";

import { useApp } from "@/lib/AppContext";
import { Objective, KeyResult } from "@/lib/types";
import { useState } from "react";
import KrDocuments from "./KrDocuments";

/* ── helpers ─────────────────────────────────────────────── */

export function krProgress(kr: KeyResult): number {
  if (kr.target === 0) return 100;
  if ((kr.unit === "ms" || kr.unit === "%") && kr.current > kr.target) {
    return Math.max(0, Math.min(100, Math.round((1 - (kr.current - kr.target) / kr.target) * 100)));
  }
  return Math.max(0, Math.min(100, Math.round((kr.current / kr.target) * 100)));
}

export function objProgress(obj: Objective): number {
  if (obj.keyResults.length === 0) return 0;
  return Math.round(obj.keyResults.reduce((s, kr) => s + krProgress(kr), 0) / obj.keyResults.length);
}

/* ── Progress Ring ───────────────────────────────────────── */

function ProgressRing({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1e293b">
        {pct}%
      </text>
    </svg>
  );
}

/* ── KR Row ──────────────────────────────────────────────── */

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
  const [showDocs, setShowDocs] = useState(false);

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
    <div className={`py-2.5 border-b border-slate-100 last:border-0 ${editing ? "bg-slate-50 -mx-3 px-3 rounded-lg" : ""}`}>
      {showDocs && <KrDocuments krId={kr.id} krTitle={kr.title} onClose={() => setShowDocs(false)} />}
      {editing ? (
        <div className="flex flex-col gap-2">
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className="w-full text-sm border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="flex gap-2 flex-wrap items-center">
            <label className="text-xs text-slate-500">Hiện tại
              <input type="number" value={draft.current} onChange={e => setDraft(d => ({ ...d, current: e.target.value }))}
                className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
            </label>
            <label className="text-xs text-slate-500">Mục tiêu
              <input type="number" value={draft.target} onChange={e => setDraft(d => ({ ...d, target: e.target.value }))}
                className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
            </label>
            <label className="text-xs text-slate-500">Đơn vị
              <input value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))}
                className="ml-1 w-20 text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none" />
            </label>
            <button onClick={save} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-semibold">Lưu</button>
            <button onClick={() => setEditing(false)} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-300">Hủy</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{kr.title}</p>
            <div className="mt-1 flex items-center gap-2">
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
            <button onClick={() => setShowDocs(true)}
              className="p-1 rounded hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition" title="Tài liệu chứng minh">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </button>
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

/* ── Add KR Form ─────────────────────────────────────────── */

function AddKrForm({ onAdd, onCancel }: { onAdd: (kr: Omit<KeyResult, "id">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("100");
  const [unit, setUnit] = useState("%");
  return (
    <div className="flex flex-col gap-2 py-3 border-t border-indigo-100 bg-indigo-50 -mx-3 px-3 rounded-b-xl">
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

/* ── Goal Card (main export) ─────────────────────────────── */

export default function Goal({ obj, color }: { obj: Objective; color: string }) {
  const { updateKeyResult, addKeyResult, deleteKeyResult, updateObjective, deleteObjective } = useApp();
  const pct = objProgress(obj);
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-w-[340px] max-w-[400px] w-[370px] shrink-0 flex flex-col overflow-hidden">
      {/* Header */}
      {editingHeader ? (
        <div className="p-3 bg-slate-50 flex flex-col gap-2">
          <input value={headerDraft.title} onChange={e => setHeaderDraft(d => ({ ...d, title: e.target.value }))}
            className="w-full text-sm font-semibold border border-indigo-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div className="flex gap-2 items-center">
            <input value={headerDraft.quarter} onChange={e => setHeaderDraft(d => ({ ...d, quarter: e.target.value }))}
              placeholder="Q1 2026" className="w-24 text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none" />
            <button onClick={saveHeader} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-semibold">Lưu</button>
            <button onClick={() => setEditingHeader(false)} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-300">Hủy</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 group">
          <ProgressRing pct={pct} color={color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: color }}>
                {obj.quarter}
              </span>
            </div>
            <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{obj.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{obj.keyResults.length} kết quả then chốt</p>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => { setHeaderDraft({ title: obj.title, quarter: obj.quarter }); setEditingHeader(true); }}
              className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition" title="Sửa mục tiêu">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
            {confirmDeleteObj ? (
              <>
                <button onClick={() => deleteObjective(obj.id)} className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded hover:bg-red-600 font-semibold">Xóa</button>
                <button onClick={() => setConfirmDeleteObj(false)} className="text-[10px] text-slate-400 px-0.5">✕</button>
              </>
            ) : (
              <button onClick={() => setConfirmDeleteObj(true)} className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition" title="Xóa mục tiêu">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
      {/* KR list */}
      <div className="px-3 pb-2 border-t border-slate-100 flex-1 overflow-y-auto max-h-[300px]">
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
    </div>
  );
}
