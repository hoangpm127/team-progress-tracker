"use client";

import { useApp } from "@/lib/AppContext";
import { Objective } from "@/lib/types";
import { useState, useRef, useEffect, useCallback } from "react";
import Goal, { objProgress } from "@/components/Goal";

/* ── Department metadata ─────────────────────────────────── */

const TEAM_META: Record<string, { name: string; color: string; icon: string }> = {
  company:      { name: "Toàn công ty", color: "#64748b", icon: "🏢" },
  marketing:    { name: "Marketing",    color: "#ec4899", icon: "📢" },
  partnerships: { name: "Hợp tác",      color: "#10b981", icon: "🤝" },
  tech:         { name: "Công nghệ",    color: "#6366f1", icon: "💻" },
  hr:           { name: "Nhân sự",      color: "#f59e0b", icon: "👥" },
  assistant:    { name: "Hành chính",   color: "#3b82f6", icon: "📋" },
};

/* Clockwise: Toàn công ty → Marketing → Hợp tác → Công nghệ → Nhân sự → Hành chính */
const SEGMENT_ORDER = ["company", "marketing", "partnerships", "tech", "hr", "assistant"];

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

    return { id, meta, path, lx, ly, stats, isOpen };
  });

  const allCounts = Object.values(teamStats);
  const totalObjs = allCounts.reduce((s, t) => s + t.count, 0);
  const overallAvg = totalObjs > 0
    ? Math.round(Object.values(teamStats).reduce((s, t) => s + t.avg * t.count, 0) / totalObjs)
    : 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[420px] max-h-[420px] select-none">
      <defs>
        {segments.map(seg => (
          <filter key={`shadow-${seg.id}`} id={`shadow-${seg.id}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={seg.meta.color} floodOpacity="0.3" />
          </filter>
        ))}
      </defs>

      {segments.map(seg => {
        const isHover = hovered === seg.id;
        const isActive = seg.isOpen;
        return (
          <g key={seg.id} className="cursor-pointer"
            onClick={() => onToggle(seg.id)}
            onMouseEnter={() => setHovered(seg.id)}
            onMouseLeave={() => setHovered(null)}>
            <path d={seg.path}
              fill={isActive ? seg.meta.color : isHover ? seg.meta.color + "18" : "#f8fafc"}
              stroke={seg.meta.color}
              strokeWidth={isActive ? 2.5 : isHover ? 2 : 1}
              filter={isActive || isHover ? `url(#shadow-${seg.id})` : undefined}
              className="transition-all duration-200"
            />
            <text x={seg.lx} y={seg.ly - 18} textAnchor="middle" fontSize={18} className="pointer-events-none">
              {seg.meta.icon}
            </text>
            <text x={seg.lx} y={seg.ly + 2} textAnchor="middle" fontSize={11} fontWeight={700}
              fill={isActive ? "#fff" : "#334155"} className="pointer-events-none">
              {seg.meta.name}
            </text>
            <text x={seg.lx} y={seg.ly + 16} textAnchor="middle" fontSize={9.5}
              fill={isActive ? "#ffffffcc" : "#64748b"} className="pointer-events-none">
              {seg.stats.count} mục tiêu
            </text>
            <text x={seg.lx} y={seg.ly + 29} textAnchor="middle" fontSize={12} fontWeight={800}
              fill={isActive ? "#fff" : seg.meta.color} className="pointer-events-none">
              {seg.stats.avg}%
            </text>
          </g>
        );
      })}

      {/* Center */}
      <circle cx={cx} cy={cy} r={innerR - 3} fill="white" stroke="#e2e8f0" strokeWidth={1.5} />
      <text x={cx} y={cy - 16} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight={600} letterSpacing="0.05em">TỔNG QUAN</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={28} fontWeight={800} fill="#1e293b">{overallAvg}%</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fontSize={10} fill="#94a3b8">{totalObjs} mục tiêu</text>
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
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "0.12em" }}>
            Mục tiêu &amp; Kết quả then chốt (OKR)
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Ấn vào phòng ban trên biểu đồ để xem chi tiết mục tiêu</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {openDepts.size < 6 && (
            <button onClick={() => setOpenDepts(new Set(SEGMENT_ORDER))}
              className="text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-medium">
              Mở tất cả
            </button>
          )}
          {openDepts.size > 0 && (
            <button onClick={() => setOpenDepts(new Set())}
              className="text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-medium">
              Đóng tất cả
            </button>
          )}
          <button onClick={() => { setAddObjTeam(undefined); setShowAddObj(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Thêm mục tiêu
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng mục tiêu", value: totalObjs, color: "#6366f1" },
          { label: "Hoàn thành", value: completedObjs, color: "#10b981" },
          { label: "Kết quả then chốt", value: totalKRs, color: "#f59e0b" },
          { label: "Tiến độ TB", value: `${avgOverall}%`, color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
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
