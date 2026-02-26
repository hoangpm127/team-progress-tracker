"use client";

import { useApp } from "@/lib/AppContext";
import { Objective } from "@/lib/types";
import { useState, useRef, useEffect, useCallback } from "react";
import Goal, { objProgress } from "@/components/Goal";

/* ── Department metadata ─────────────────────────────────── */

const TEAM_META: Record<string, { name: string; color: string; icon: string }> = {
  company:      { name: "Toàn công ty", color: "#64748b", icon: "🏢" },
  mkt:          { name: "Marketing",    color: "#ec4899", icon: "📢" },
  partnerships: { name: "Hợp tác",      color: "#10b981", icon: "🤝" },
  tech:         { name: "Công nghệ",    color: "#6366f1", icon: "💻" },
  hr:           { name: "Nhân sự",      color: "#f59e0b", icon: "👥" },
  assistant:    { name: "Hành chính",   color: "#3b82f6", icon: "📋" },
};

/* Clockwise: Toàn công ty → Marketing → Hợp tác → Công nghệ → Nhân sự → Hành chính */
const SEGMENT_ORDER = ["company", "mkt", "partnerships", "assistant", "hr", "tech"];

/* ── Add Objective Modal ─────────────────────────────────── */

function AddObjModal({ onClose, defaultTeam }: { onClose: () => void; defaultTeam?: string }) {
  const { addObjective } = useApp();
  const [title, setTitle] = useState("");
  const [quarter, setQuarter] = useState("Q2 2026");
  const [teamId, setTeamId] = useState(defaultTeam ?? "company");

  function submit() {
    if (!title.trim()) return;
    addObjective({ title: title.trim(), quarter, teamId, keyResults: [] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ boxShadow: "0 20px 60px -8px rgba(99,102,241,0.18), 0 4px 12px rgba(0,0,0,0.06)" }} onClick={e => e.stopPropagation()}>
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
                {SEGMENT_ORDER.map(id => (
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
            className="flex-1 disabled:opacity-40 text-white py-2.5 rounded-xl font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 4px 14px -2px rgba(99,102,241,0.4)" }}>
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

/* ── Horizontal scrollable goal strip ────────────────────── */

function GoalStrip({ objectives, color }: { objectives: Objective[]; color: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, objectives.length]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 390, behavior: "smooth" });
  };

  if (objectives.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-slate-400 italic">
        Chưa có mục tiêu nào
      </div>
    );
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button onClick={() => scroll(-1)}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-xl transition">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll(1)}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-xl transition">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-600"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      )}
      <div ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 px-1 snap-x"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
        {objectives.map(obj => (
          <div key={obj.id} className="snap-start">
            <Goal obj={obj} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Expandable Department Panel ─────────────────────────── */

function DeptPanel({ teamId, objectives, color, name, isOpen, onToggle, onAddObj }: {
  teamId: string;
  objectives: Objective[];
  color: string;
  name: string;
  isOpen: boolean;
  onToggle: () => void;
  onAddObj: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const teamAvg = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + objProgress(o), 0) / objectives.length)
    : 0;

  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={panelRef}
      className="rounded-2xl border-2 overflow-hidden animate-in slide-in-from-top-2 duration-300"
      style={{ borderColor: color + "50", background: `linear-gradient(135deg, ${color}08, ${color}04)` }}>
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1px solid ${color}20` }}>
        <div className="w-1.5 h-6 rounded-full" style={{ background: color }} />
        <span className="text-sm font-bold text-slate-700">{name}</span>
        <span className="text-xs text-slate-400">
          {objectives.length} mục tiêu · TB: <strong style={{ color }}>{teamAvg}%</strong>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onAddObj}
            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed hover:bg-white/60 transition font-medium"
            style={{ borderColor: color + "60", color }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Thêm mục tiêu
          </button>
          <button onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition" title="Đóng">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>
      <div className="p-4">
        <GoalStrip objectives={objectives} color={color} />
      </div>
    </div>
  );
}

/* ── SVG Donut Wheel ─────────────────────────────────────── */

function DeptWheel({
  teamStats,
  openSet,
  onToggle,
}: {
  teamStats: Record<string, { count: number; avg: number }>;
  openSet: Set<string>;
  onToggle: (id: string) => void;
}) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 195;
  const innerR = 80;
  const segCount = SEGMENT_ORDER.length;
  const gapDeg = 2;

  const [hovered, setHovered] = useState<string | null>(null);

  // Arc helper: donut arc path using component-scope cx/cy
  function arc(ro: number, ri: number, a1: number, a2: number, la: number) {
    const xs1 = cx + ro * Math.cos(a1), ys1 = cy + ro * Math.sin(a1);
    const xs2 = cx + ro * Math.cos(a2), ys2 = cy + ro * Math.sin(a2);
    const xs3 = cx + ri * Math.cos(a2), ys3 = cy + ri * Math.sin(a2);
    const xs4 = cx + ri * Math.cos(a1), ys4 = cy + ri * Math.sin(a1);
    return `M ${xs1} ${ys1} A ${ro} ${ro} 0 ${la} 1 ${xs2} ${ys2} L ${xs3} ${ys3} A ${ri} ${ri} 0 ${la} 0 ${xs4} ${ys4} Z`;
  }

  const segments = SEGMENT_ORDER.map((id, i) => {
    const meta = TEAM_META[id];
    const startDeg = (i * 360) / segCount - 90 + gapDeg / 2;
    const endDeg = ((i + 1) * 360) / segCount - 90 - gapDeg / 2;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = cx + outerR * Math.cos(startRad);
    const y1 = cy + outerR * Math.sin(startRad);
    const x2 = cx + outerR * Math.cos(endRad);
    const y2 = cy + outerR * Math.sin(endRad);
    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);

    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      `Z`,
    ].join(" ");

    const midDeg = (startDeg + endDeg) / 2;
    const midRad = (midDeg * Math.PI) / 180;
    const labelR = (outerR + innerR) / 2;
    const lx = cx + labelR * Math.cos(midRad);
    const ly = cy + labelR * Math.sin(midRad);

    const stats = teamStats[id] ?? { count: 0, avg: 0 };
    const isOpen = openSet.has(id);

    // Progress arc ring (thin band between innerR+5 and innerR+14)
    const arcRI = innerR + 5, arcRO = innerR + 14;
    const trackPath = arc(arcRO, arcRI, startRad, endRad, largeArc);
    const progFrac = Math.min(1, stats.avg / 100);
    const progEndDeg = startDeg + progFrac * (endDeg - startDeg);
    const progEndRad = (progEndDeg * Math.PI) / 180;
    const progLargeArc = progEndDeg - startDeg > 180 ? 1 : 0;
    const fillPath = stats.avg > 0 ? arc(arcRO, arcRI, startRad, progEndRad, progLargeArc) : null;

    return { id, meta, path, lx, ly, stats, isOpen, trackPath, fillPath };
  });

  const allCounts = Object.values(teamStats);
  const totalObjs = allCounts.reduce((s, t) => s + t.count, 0);
  const overallAvg = totalObjs > 0
    ? Math.round(Object.values(teamStats).reduce((s, t) => s + t.avg * t.count, 0) / totalObjs)
    : 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[420px] max-h-[420px] select-none">
      <defs>
        {/* Per-segment gradient fills */}
        {segments.map(seg => (
          <linearGradient key={`grad-${seg.id}`} id={`grad-${seg.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={seg.meta.color} stopOpacity="0.72" />
            <stop offset="100%" stopColor={seg.meta.color} stopOpacity="1" />
          </linearGradient>
        ))}
        {/* Per-segment glow filters */}
        {segments.map(seg => (
          <filter key={`glow-${seg.id}`} id={`glow-${seg.id}`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor={seg.meta.color} floodOpacity="0.55" />
          </filter>
        ))}
        {/* Center gradient + shadow */}
        <radialGradient id="ctrG" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef2ff" />
        </radialGradient>
        <filter id="ctrShd" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="10" floodColor="#6366f1" floodOpacity="0.20" />
        </filter>
      </defs>

      {/* Outer decorative halo */}
      <circle cx={cx} cy={cy} r={outerR + 6} fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth="3" />

      {segments.map(seg => {
        const isHover = hovered === seg.id;
        const isActive = seg.isOpen;
        return (
          <g key={seg.id} className="cursor-pointer"
            onClick={() => onToggle(seg.id)}
            onMouseEnter={() => setHovered(seg.id)}
            onMouseLeave={() => setHovered(null)}>
            {/* Main donut segment */}
            <path d={seg.path}
              fill={isActive ? `url(#grad-${seg.id})` : isHover ? seg.meta.color + "28" : seg.meta.color + "12"}
              stroke={isActive || isHover ? seg.meta.color : seg.meta.color + "55"}
              strokeWidth={isActive ? 2.5 : isHover ? 2 : 1.2}
              filter={isActive ? `url(#glow-${seg.id})` : undefined}
              className="transition-all duration-200"
            />
            {/* Progress arc track (background) */}
            <path d={seg.trackPath} fill={isActive ? "rgba(255,255,255,0.18)" : seg.meta.color + "18"} className="pointer-events-none" />
            {/* Progress arc fill */}
            {seg.fillPath && (
              <path d={seg.fillPath} fill={isActive ? "rgba(255,255,255,0.65)" : seg.meta.color} opacity={isActive ? 1 : 0.65} className="pointer-events-none" />
            )}
            {/* Icon background circle */}
            <circle cx={seg.lx} cy={seg.ly - 22} r={15}
              fill={isActive ? "rgba(255,255,255,0.22)" : seg.meta.color + "1a"}
              stroke={isActive ? "rgba(255,255,255,0.55)" : seg.meta.color + "66"}
              strokeWidth="1.5" className="pointer-events-none" />
            {/* Emoji icon */}
            <text x={seg.lx} y={seg.ly - 16} textAnchor="middle" fontSize={17} className="pointer-events-none">
              {seg.meta.icon}
            </text>
            {/* Department name */}
            <text x={seg.lx} y={seg.ly + 3} textAnchor="middle" fontSize={10.5} fontWeight={700}
              fill={isActive ? "#fff" : "#334155"} className="pointer-events-none">
              {seg.meta.name}
            </text>
            {/* Obj count */}
            <text x={seg.lx} y={seg.ly + 16} textAnchor="middle" fontSize={9}
              fill={isActive ? "#ffffffbb" : "#64748b"} className="pointer-events-none">
              {seg.stats.count} MT
            </text>
            {/* Avg % */}
            <text x={seg.lx} y={seg.ly + 30} textAnchor="middle" fontSize={13} fontWeight={800}
              fill={isActive ? "#fff" : seg.meta.color} className="pointer-events-none">
              {seg.stats.avg}%
            </text>
          </g>
        );
      })}

      {/* Premium center circle */}
      <circle cx={cx} cy={cy} r={innerR - 2} fill="url(#ctrG)" filter="url(#ctrShd)" />
      <circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke="rgba(99,102,241,0.22)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={innerR - 18} fill="none" stroke="rgba(99,102,241,0.07)" strokeWidth="1" strokeDasharray="3 6" />
      <text x={cx} y={cy - 20} textAnchor="middle" fontSize={8.5} fill="#94a3b8" fontWeight={700} letterSpacing="0.12em">TỔNG QUAN</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={30} fontWeight={800} fill="#1e293b">{overallAvg}%</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={9.5} fill="#94a3b8">{totalObjs} mục tiêu</text>
    </svg>
  );
}

/* ── Main OKR Page ───────────────────────────────────────── */

export default function OKRPage() {
  const { objectives, loading, getTeamObjectives, getCompanyObjectives } = useApp();
  const [openDepts, setOpenDepts] = useState<Set<string>>(new Set());
  const [showAddObj, setShowAddObj] = useState(false);
  const [addObjTeam, setAddObjTeam] = useState<string | undefined>();

  const toggleDept = useCallback((id: string) => {
    setOpenDepts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>
  );

  // Per-team data
  const teamObjs: Record<string, Objective[]> = {};
  const teamStats: Record<string, { count: number; avg: number }> = {};
  for (const teamId of SEGMENT_ORDER) {
    const objs = teamId === "company" ? getCompanyObjectives() : getTeamObjectives(teamId);
    teamObjs[teamId] = objs;
    const avg = objs.length > 0 ? Math.round(objs.reduce((s, o) => s + objProgress(o), 0) / objs.length) : 0;
    teamStats[teamId] = { count: objs.length, avg };
  }

  const totalObjs = objectives.length;
  const completedObjs = objectives.filter(o => objProgress(o) >= 100).length;
  const avgOverall = totalObjs > 0
    ? Math.round(objectives.reduce((s, o) => s + objProgress(o), 0) / totalObjs)
    : 0;
  const totalKRs = objectives.reduce((s, o) => s + o.keyResults.length, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100/80 mb-3">
            <span className="text-xs font-bold text-violet-600 tracking-wide">🎯 OKR Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #6d28d9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Mục Tiêu & Kết Quả Then Chốt
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Ấn vào phòng ban trên biểu đồ để xem chi tiết mục tiêu</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {openDepts.size < 6 && (
            <button onClick={() => setOpenDepts(new Set(SEGMENT_ORDER))}
              className="text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-semibold">
              Mở tất cả
            </button>
          )}
          {openDepts.size > 0 && (
            <button onClick={() => setOpenDepts(new Set())}
              className="text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-semibold">
              Đóng tất cả
            </button>
          )}
          <button onClick={() => { setAddObjTeam(undefined); setShowAddObj(true); }}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl transition"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 4px 14px -2px rgba(99,102,241,0.35)" }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Thêm mục tiêu
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng mục tiêu", value: totalObjs,     accent: "#6366f1" },
          { label: "Hoàn thành",       value: completedObjs,   accent: "#10b981" },
          { label: "Kết quả then chốt", value: totalKRs,      accent: "#f59e0b" },
          { label: "Tiến độ TB",       value: `${avgOverall}%`, accent: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="stat-card rounded-2xl p-4 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: `0 2px 16px -4px ${s.accent}26, 0 1px 3px rgba(0,0,0,0.04)` }}>
            <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${s.accent}cc, transparent)` }} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
            <span className="text-2xl font-black tabular-nums" style={{ color: s.accent }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Wheel */}
      <div className="flex justify-center mb-6">
        <div className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] md:w-[420px] md:h-[420px]">
          <DeptWheel teamStats={teamStats} openSet={openDepts} onToggle={toggleDept} />
        </div>
      </div>

      {/* Expanded panels */}
      <div className="flex flex-col gap-4">
        {SEGMENT_ORDER.map(teamId => {
          const meta = TEAM_META[teamId];
          const objs = teamObjs[teamId] ?? [];
          return (
            <DeptPanel
              key={teamId}
              teamId={teamId}
              objectives={objs}
              color={meta.color}
              name={meta.name}
              isOpen={openDepts.has(teamId)}
              onToggle={() => toggleDept(teamId)}
              onAddObj={() => { setAddObjTeam(teamId); setShowAddObj(true); }}
            />
          );
        })}
      </div>

      {showAddObj && <AddObjModal onClose={() => setShowAddObj(false)} defaultTeam={addObjTeam} />}
    </div>
  );
}
