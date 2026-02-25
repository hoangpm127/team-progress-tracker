"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useApp } from "@/lib/AppContext";
import { Project, Partner } from "@/lib/types";

// ────────────────────────────────────────────────────────────
//  GEOMETRY HELPERS
// ────────────────────────────────────────────────────────────
function norm(dx: number, dy: number) {
  const l = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dx / l, dy / l];
}

/** Tapered filled branch path using two cubic Bezier sides */
function branchPath(
  sx: number, sy: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  ex: number, ey: number,
  w0: number, w1: number
): string {
  const [nx, ny] = [-(ey - sy), (ex - sx)].map((v, i) => {
    const l = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2) || 1;
    return i === 0 ? -(ey - sy) / l : (ex - sx) / l;
  });
  const hw0 = w0 / 2, hw1 = w1 / 2, ok = w0 / 3, ek = w1 / 3;
  return [
    `M ${sx + nx * hw0},${sy + ny * hw0}`,
    `C ${cp1x + nx * ok},${cp1y + ny * ok} ${cp2x + nx * ek},${cp2y + ny * ek} ${ex + nx * hw1},${ey + ny * hw1}`,
    `L ${ex - nx * hw1},${ey - ny * hw1}`,
    `C ${cp2x - nx * ek},${cp2y - ny * ek} ${cp1x - nx * ok},${cp1y - ny * ok} ${sx - nx * hw0},${sy - ny * hw0}`,
    "Z",
  ].join(" ");
}

// Seeded RNG (mulberry32) for deterministic leaf placement
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Lerp along a cubic bezier
function bezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

// ────────────────────────────────────────────────────────────
//  TREE GEOMETRY CONSTANTS
// ────────────────────────────────────────────────────────────
const GY = 568; // Ground Y

// Trunk path (tapered)
const TRUNK_PATH = `M 428,${GY} C 425,490 428,360 438,258 C 442,220 447,190 450,172
  L 450,172 C 453,190 458,220 462,258 C 472,360 475,490 472,${GY} Z`;

// 8 main branches (as [sx,sy, cp1x,cp1y, cp2x,cp2y, ex,ey, w0,w1, teamRef, subbranches])
const BRANCHES: Array<{
  id: string; sx: number; sy: number; cp1x: number; cp1y: number;
  cp2x: number; cp2y: number; ex: number; ey: number; w0: number; w1: number;
  teamId: string | null; label: string;
}> = [
  { id:"rb1", sx:462,sy:230, cp1x:512,cp1y:208, cp2x:600,cp2y:158, ex:648,ey:138, w0:15,w1:6, teamId:"assistant", label:"Hành chính" },
  { id:"lb1", sx:438,sy:252, cp1x:388,cp1y:228, cp2x:302,cp2y:170, ex:252,ey:148, w0:15,w1:6, teamId:"piano",     label:"Piano"     },
  { id:"rb2", sx:464,sy:318, cp1x:506,cp1y:314, cp2x:570,cp2y:292, ex:612,ey:268, w0:13,w1:5, teamId:null,        label:""          },
  { id:"lb2", sx:436,sy:334, cp1x:394,cp1y:330, cp2x:330,cp2y:308, ex:290,ey:278, w0:13,w1:5, teamId:null,        label:""          },
  { id:"rb3", sx:466,sy:395, cp1x:500,cp1y:398, cp2x:540,cp2y:376, ex:568,ey:355, w0:11,w1:4, teamId:null,        label:""          },
  { id:"lb3", sx:434,sy:408, cp1x:400,cp1y:410, cp2x:362,cp2y:390, ex:338,ey:370, w0:11,w1:4, teamId:null,        label:""          },
  { id:"rb4", sx:467,sy:452, cp1x:490,cp1y:460, cp2x:510,cp2y:450, ex:526,ey:430, w0: 9,w1:3, teamId:null,        label:""          },
  { id:"lb4", sx:433,sy:462, cp1x:410,cp1y:468, cp2x:392,cp2y:458, ex:374,ey:438, w0: 9,w1:3, teamId:null,        label:""          },
];

// Sub-branches from main branch tips
const SUB_BRANCHES: Array<{
  parentId: string; sx: number; sy: number;
  cp1x: number; cp1y: number; cp2x: number; cp2y: number;
  ex: number; ey: number; w0: number; w1: number;
}> = [
  { parentId:"rb1", sx:648,sy:138, cp1x:668,cp1y:125, cp2x:693,cp2y:110, ex:702,ey: 98, w0:5,w1:2 },
  { parentId:"rb1", sx:648,sy:138, cp1x:638,cp1y:118, cp2x:626,cp2y: 95, ex:618,ey: 82, w0:5,w1:2 },
  { parentId:"lb1", sx:252,sy:148, cp1x:232,cp1y:130, cp2x:207,cp2y:112, ex:198,ey:100, w0:5,w1:2 },
  { parentId:"lb1", sx:252,sy:148, cp1x:262,cp1y:125, cp2x:278,cp2y:100, ex:284,ey: 88, w0:5,w1:2 },
  { parentId:"rb2", sx:612,sy:268, cp1x:635,cp1y:256, cp2x:653,cp2y:240, ex:660,ey:228, w0:4,w1:2 },
  { parentId:"rb2", sx:612,sy:268, cp1x:605,cp1y:246, cp2x:605,cp2y:225, ex:608,ey:212, w0:4,w1:2 },
  { parentId:"lb2", sx:290,sy:278, cp1x:265,cp1y:262, cp2x:248,cp2y:242, ex:242,ey:230, w0:4,w1:2 },
  { parentId:"lb2", sx:290,sy:278, cp1x:296,cp1y:258, cp2x:294,cp2y:235, ex:292,ey:220, w0:4,w1:2 },
];

// Leaf cluster definitions (center near branch tip + sub-branch tips)
// Each cluster: {cx,cy} center, spread radius, leafCount seed-RNG will distribute
const LEAF_CLUSTERS: Array<{cx:number; cy:number; sr:number; team:string; subCluster?:boolean}> = [
  { cx:700,  cy: 98, sr:42, team:"assistant" },
  { cx:618,  cy: 82, sr:36, team:"assistant" },
  { cx:660,  cy:125, sr:38, team:"assistant" },
  { cx:196,  cy: 98, sr:42, team:"piano"     },
  { cx:284,  cy: 88, sr:36, team:"piano"     },
  { cx:242,  cy:125, sr:38, team:"piano"     },
  { cx:660,  cy:228, sr:32, team:"tech"      },
  { cx:608,  cy:212, sr:30, team:"tech"      },
  { cx:242,  cy:230, sr:32, team:"tech"      },
  { cx:292,  cy:220, sr:30, team:"tech"      },
  { cx:570,  cy:350, sr:28, team:"tech"      },
  { cx:340,  cy:365, sr:28, team:"tech"      },
  { cx:528,  cy:425, sr:24, team:"tech"      },
  { cx:372,  cy:432, sr:24, team:"tech"      },
  // Dense canopy center
  { cx:450,  cy:172, sr:45, team:"tech", subCluster:true },
  { cx:420,  cy:195, sr:38, team:"tech", subCluster:true },
  { cx:480,  cy:198, sr:38, team:"tech", subCluster:true },
];

// Rain drop positions
const RAIN_DROPS = Array.from({ length: 24 }, (_, i) => {
  const rng = seededRng(i * 137);
  return { x: 620 + rng() * 180, y: 18 + rng() * 130, delay: rng() * 1.4, dur: 0.65 + rng() * 0.35 };
});

// Root paths
const ROOT_PATHS = [
  { d:`M 442,${GY} C 408,${GY+12} 368,${GY+26} 328,${GY+38} C 288,${GY+50} 256,${GY+56} 234,${GY+62}`, w:11 },
  { d:`M 444,${GY} C 418,${GY+10} 398,${GY+22} 376,${GY+32} C 352,${GY+42} 332,${GY+48} 314,${GY+52}`, w: 8 },
  { d:`M 450,${GY} L 450,${GY+66}`,                                                                        w:14 },
  { d:`M 456,${GY} C 482,${GY+10} 502,${GY+22} 524,${GY+32} C 548,${GY+42} 568,${GY+48} 586,${GY+52}`, w: 8 },
  { d:`M 458,${GY} C 492,${GY+12} 532,${GY+26} 572,${GY+38} C 612,${GY+50} 644,${GY+56} 666,${GY+62}`, w:11 },
];

// Partner / grass categories
const PARTNER_CATS = [
  { id:1, label:"Nhà cung cấp", icon:"📦", x: 96, color:"#f59e0b" },
  { id:2, label:"HR Partners",  icon:"👥", x:278, color:"#8b5cf6" },
  { id:3, label:"Kiến thức",    icon:"🎓", x:562, color:"#10b981" },
  { id:4, label:"Tài chính",    icon:"💰", x:790, color:"#3b82f6" },
];

// ────────────────────────────────────────────────────────────
//  PANEL DRAWER (inline)
// ────────────────────────────────────────────────────────────
type PanelId = "tech" | "hr" | "mkt" | "partnerships" | "market" | "heaven" | "assistant" | "piano" | null;

interface PanelProps {
  panelId: PanelId;
  onClose: () => void;
}

function TreePanel({ panelId, onClose }: PanelProps) {
  const app = useApp();
  if (!panelId) return null;

  const teamId = ["tech","hr","mkt","partnerships","assistant","piano"].includes(panelId ?? "")
    ? panelId as string : null;

  const tasks   = teamId ? app.getTeamTasks(teamId) : [];
  const stats   = teamId ? app.getTeamStats(teamId) : null;
  const prog    = teamId ? app.getTeamProgress(teamId) : 0;
  const acts    = teamId ? app.getTeamActivity(teamId).slice(0,6) : [];
  const today   = new Date().toISOString().split("T")[0];

  const PANEL_META: Record<string, { title:string; icon:string; color:string; desc:string }> = {
    tech:         { title:"Công nghệ",   icon:"⚙️",  color:"#6366f1", desc:"Technology Core — 30 Projects" },
    hr:           { title:"Nhân sự",     icon:"👥",  color:"#f59e0b", desc:"HR System — Nền tảng con người" },
    mkt:          { title:"Marketing",   icon:"📣",  color:"#ec4899", desc:"Clouds & Wind — Mây & Gió" },
    partnerships: { title:"Hợp tác",     icon:"🤝",  color:"#10b981", desc:"Grass — Đối tác 4 nhóm" },
    assistant:    { title:"Hành chính",  icon:"📋",  color:"#3b82f6", desc:"BOD / Admin — Nhánh cây" },
    piano:        { title:"Piano",       icon:"🎹",  color:"#8b5cf6", desc:"Piano Division — Nhánh cây" },
    market:       { title:"Thị trường",  icon:"🌍",  color:"#64748b", desc:"Soil — Market Context" },
    heaven:       { title:"Thiên thời",  icon:"🌦",  color:"#0ea5e9", desc:"Rain — Heaven Timing" },
  };

  const meta = PANEL_META[panelId] ?? { title: panelId, icon:"ℹ️", color:"#64748b", desc:"" };

  const statusColor: Record<string,string> = { Todo:"#64748b", Doing:"#3b82f6", Done:"#10b981" };
  const statusLabel: Record<string,string> = { Todo:"Chờ làm", Doing:"Đang làm", Done:"Hoàn thành" };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-sm h-full bg-white shadow-2xl overflow-y-auto flex flex-col"
        style={{ borderLeft: `3px solid ${meta.color}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-100" style={{ background: `${meta.color}12` }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{meta.icon}</span>
              <span className="font-bold text-slate-800 text-base">{meta.title}</span>
            </div>
            <p className="text-xs text-slate-500">{meta.desc}</p>
            {teamId && (
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: meta.color }}>{prog}%</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden" style={{ maxWidth:120 }}>
                  <div className="h-2 rounded-full transition-all" style={{ width:`${prog}%`, background: meta.color }}/>
                </div>
                {stats && <span className="text-xs text-slate-400">{stats.done}/{stats.total} tasks</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 space-y-5">

          {/* Tech Panel — Projects */}
          {panelId === "tech" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">30 Dự Án Công Nghệ</h3>
              <div className="space-y-2">
                {app.projects.map((p) => {
                  const sc: Record<string,string> = { live:"#10b981", building:"#f59e0b", idea:"#94a3b8" };
                  const sl: Record<string,string> = { live:"🟢 Live", building:"🔨 Building", idea:"💡 Idea" };
                  return (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <span className="text-lg shrink-0">{sl[p.status].split(" ")[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.owner}</div>
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={{ color: sc[p.status] }}>
                        {sl[p.status].split(" ").slice(1).join(" ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Partnerships Panel — Partner categories */}
          {panelId === "partnerships" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">4 Nhóm Đối Tác</h3>
              {PARTNER_CATS.map((cat) => {
                const list = app.partners.filter((p) => p.category === cat.id);
                return (
                  <div key={cat.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{cat.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                      <span className="ml-auto text-xs text-slate-400">{list.filter(p=>p.status==="active").length} active</span>
                    </div>
                    {list.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-6">Chưa có đối tác</p>
                    ) : (
                      <div className="space-y-1 pl-6">
                        {list.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: p.status==="active" ? "#10b981" : "#94a3b8" }}/>
                            <span className="text-xs text-slate-600">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Market Panel */}
          {panelId === "market" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chỉ số Thị Trường</h3>
              <div className="rounded-xl border border-slate-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Market Index</span>
                  <span className="text-2xl font-bold text-slate-800">{app.market.marketIndex}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full transition-all" style={{ width:`${app.market.marketIndex}%`, background:"linear-gradient(90deg,#f59e0b,#10b981)" }}/>
                </div>
              </div>
              {app.market.notes && <p className="text-xs text-slate-500 bg-amber-50 rounded-lg p-3 border border-amber-100">{app.market.notes}</p>}
            </div>
          )}

          {/* Heaven Timing Panel */}
          {panelId === "heaven" && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thiên Thời</h3>
              <div className="rounded-xl border border-sky-200 p-4 mb-4 bg-sky-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-sky-700">Heaven Timing Index</span>
                  <span className="text-2xl font-bold text-sky-800">{app.heavenTiming.heavenTimingIndex}</span>
                </div>
                <div className="h-3 bg-sky-100 rounded-full overflow-hidden">
                  <div className="h-3 rounded-full transition-all" style={{ width:`${app.heavenTiming.heavenTimingIndex}%`, background:"linear-gradient(90deg,#38bdf8,#0ea5e9)" }}/>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-600">Mưa trong bài thuyết trình:</span>
                <button
                  onClick={() => app.setHeavenTiming({ rainEnabled: !app.heavenTiming.rainEnabled })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${app.heavenTiming.rainEnabled ? "bg-sky-400" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${app.heavenTiming.rainEnabled ? "translate-x-5" : "translate-x-0.5"}`}/>
                </button>
              </div>
            </div>
          )}

          {/* Generic team tasks */}
          {teamId && tasks.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Công việc</h3>
              <div className="space-y-2">
                {tasks.slice(0,10).map((t) => {
                  const overdue = !t.done && t.deadline < today;
                  return (
                    <div key={t.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors ${t.done ? "bg-green-50 border-green-100" : overdue ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                      <button
                        onClick={() => app.toggleTask(t.id, "Tree")}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${t.done ? "bg-green-500 border-green-500 text-white" : "border-slate-300"}`}
                      >
                        {t.done && <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor"><path d="M1.5 5.5L4 8 8.5 2"/></svg>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t.done ? "line-through text-slate-400" : "text-slate-700"}`}>{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs" style={{ color: statusColor[t.status] }}>{statusLabel[t.status]}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400">w:{t.weight}</span>
                          {overdue && <span className="text-xs text-red-500">⚠ Quá hạn</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity */}
          {acts.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hoạt động gần đây</h3>
              <div className="space-y-2">
                {acts.map((a) => (
                  <div key={a.id} className="flex gap-2 text-xs text-slate-500">
                    <span className="shrink-0 text-slate-300">•</span>
                    <span>{a.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
//  LEAF GENERATOR (deterministic)
// ────────────────────────────────────────────────────────────
interface Leaf { x: number; y: number; rx: number; ry: number; rot: number; opacity: number; color: string }

function generateLeaves(cluster: typeof LEAF_CLUSTERS[0], count: number, seed: number): Leaf[] {
  const rng = seededRng(seed);
  const greens = ["#2d7d46","#388e50","#4caf65","#52c46a","#3a9a52","#45b860","#2a6e3e"];
  return Array.from({ length: count }, () => ({
    x: cluster.cx + (rng() - 0.5) * cluster.sr * 2,
    y: cluster.cy + (rng() - 0.5) * cluster.sr * 1.4,
    rx: 7 + rng() * 5,
    ry: 4 + rng() * 3,
    rot: rng() * 180,
    opacity: 0.55 + rng() * 0.42,
    color: greens[Math.floor(rng() * greens.length)],
  }));
}

// ────────────────────────────────────────────────────────────
//  TOOLTIP
// ────────────────────────────────────────────────────────────
interface TooltipState { x: number; y: number; title: string; prog: number; done: number; total: number; overdue: number; kpi: string }

// ────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ────────────────────────────────────────────────────────────
export default function TreeCanvas() {
  const app = useApp();
  const [activePanel, setActivePanel] = useState<PanelId>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Progress for each concept
  const techProg  = app.getTeamProgress("tech");
  const hrProg    = app.getTeamProgress("hr");
  const mktProg   = app.getTeamProgress("mkt");
  const partProg  = app.getTeamProgress("partnerships");
  const asstProg  = app.getTeamProgress("assistant");
  const pianoProg = app.getTeamProgress("piano");
  const rainOn    = app.heavenTiming.rainEnabled;
  const mkIdx     = app.market.marketIndex;
  const hvIdx     = app.heavenTiming.heavenTimingIndex;

  // Health determination
  const Q1_ELAPSED = Math.max(0, Math.round((new Date().getTime() - new Date("2026-01-01").getTime()) / 86400000));
  const EXPECTED   = Math.round(Q1_ELAPSED / 89 * 100);
  function health(prog: number) {
    const r = EXPECTED > 0 ? prog / EXPECTED : 1;
    if (r >= 0.80) return { label:"Đúng tiến độ", color:"#10b981", icon:"🟢" };
    if (r >= 0.50) return { label:"Hơi chậm",     color:"#f59e0b", icon:"🟡" };
    return             { label:"Nguy hiểm",     color:"#ef4444", icon:"🔴" };
  }

  // Leaf counts (increases with progress)
  const leafCounts = useMemo(() => {
    return LEAF_CLUSTERS.map((cl) => {
      const baseProg = cl.team === "tech" ? techProg
                     : cl.team === "hr"   ? hrProg
                     : cl.team === "assistant" ? asstProg
                     : cl.team === "piano" ? pianoProg : techProg;
      const base = cl.subCluster ? 20 : 12;
      return Math.max(4, Math.round(base * (baseProg / 100) + base * 0.3));
    });
  }, [techProg, hrProg, asstProg, pianoProg]);

  const allLeaves = useMemo(() => {
    return LEAF_CLUSTERS.flatMap((cl, i) => generateLeaves(cl, leafCounts[i], i * 997));
  }, [leafCounts]);

  // Blossoms (appear at 80%+)
  function showBlossom(prog: number) { return prog >= 80; }
  function showFruit(prog: number)   { return prog >= 100; }

  // Tooltip helper
  const openTooltip = useCallback((id: string, e: React.MouseEvent<SVGElement>) => {
    const teamIds = ["tech","hr","mkt","partnerships","assistant","piano"];
    if (!teamIds.includes(id)) return;
    const stats = app.getTeamStats(id);
    const prog  = app.getTeamProgress(id);
    const h     = health(prog);
    const svgRect = svgRef.current?.getBoundingClientRect();
    const tx = svgRect ? ((e.clientX - svgRect.left) / svgRect.width) * 900 : 450;
    const ty = svgRect ? ((e.clientY - svgRect.top)  / svgRect.height) * 700 : 350;
    setTooltip({ x: tx, y: ty, title: id, prog, done: stats.done, total: stats.total, overdue: stats.overdue, kpi: `${h.icon} ${h.label}` });
  }, [app]);

  const TEAM_LABELS: Record<string,string> = {
    tech:"⚙️ Công nghệ", hr:"👥 Nhân sự", mkt:"📣 Marketing",
    partnerships:"🤝 Hợp tác", assistant:"📋 Hành chính", piano:"🎹 Piano"
  };

  // Grass density based on partnerships progress
  const grassBlades = Math.max(12, Math.round(48 * (partProg / 100) + 12));
  const grassRng = seededRng(42);
  const blades = Array.from({ length: grassBlades }, (_, i) => {
    const bx = grassRng() * 900;
    const h  = 10 + grassRng() * 16;
    const lx = bx - 3 - grassRng() * 4;
    const rx = bx + 3 + grassRng() * 4;
    return { bx, h, lx, rx };
  });

  // Soil color changes with market index
  const soilLight = `hsl(${28 + mkIdx * 0.08},${45 + mkIdx * 0.2}%,${30 + mkIdx * 0.12}%)`;
  const soilDark  = `hsl(${24 + mkIdx * 0.06},${40 + mkIdx * 0.18}%,${18 + mkIdx * 0.10}%)`;

  return (
    <div className="relative w-full select-none" style={{ maxWidth: 900, margin:"0 auto" }}>
      {/* Rain toggle hint */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={() => app.setHeavenTiming({ rainEnabled: !rainOn })}
          title={rainOn ? "Tắt mưa" : "Bật mưa"}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/80 backdrop-blur border border-slate-200 text-slate-600 hover:bg-sky-50 transition-colors shadow-sm"
        >
          {rainOn ? "🌧 Tắt mưa" : "☀️ Bật mưa"}
        </button>
        <button
          onClick={() => setActivePanel("market")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/80 backdrop-blur border border-slate-200 text-slate-600 hover:bg-amber-50 transition-colors shadow-sm"
        >
          🌍 Thị trường {mkIdx}
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 900 700"
        className="w-full"
        style={{ background:"linear-gradient(180deg, #e8f4fd 0%, #f0f8ff 35%, #ddf0d4 65%, #c8e6be 72%, #a0c472 72.5%)" }}
      >
        <defs>
          {/* Trunk gradient */}
          <linearGradient id="trunkG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#5a3018"/>
            <stop offset="30%"  stopColor="#7c4a22"/>
            <stop offset="55%"  stopColor="#9a6030"/>
            <stop offset="80%"  stopColor="#7a4820"/>
            <stop offset="100%" stopColor="#5a3018"/>
          </linearGradient>
          {/* Branch gradient */}
          <linearGradient id="branchG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6b3e1c"/>
            <stop offset="100%" stopColor="#8a5428"/>
          </linearGradient>
          {/* Root gradient */}
          <linearGradient id="rootG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7a4a22"/>
            <stop offset="100%" stopColor="#3a2008"/>
          </linearGradient>
          {/* Soil gradient */}
          <linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={soilLight}/>
            <stop offset="100%" stopColor={soilDark}/>
          </linearGradient>
          {/* Underground */}
          <linearGradient id="underG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2c1a0a"/>
            <stop offset="100%" stopColor="#1a0e06"/>
          </linearGradient>
          {/* Canopy background glow */}
          <radialGradient id="canopyGlow" cx="50%" cy="40%" r="55%">
            <stop offset="0%"   stopColor="#52c46a" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#1e6b30" stopOpacity="0"/>
          </radialGradient>
          {/* Cloud filter */}
          <filter id="cloudBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5"/>
          </filter>
          {/* Glow filters */}
          <filter id="glowGreen">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#34d399" floodOpacity="0.6"/>
          </filter>
          <filter id="glowIndigo">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#6366f1" floodOpacity="0.5"/>
          </filter>
          <filter id="glowAmber">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f59e0b" floodOpacity="0.5"/>
          </filter>
          <filter id="glowPink">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ec4899" floodOpacity="0.5"/>
          </filter>
          <filter id="glowSky">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#0ea5e9" floodOpacity="0.5"/>
          </filter>
          {/* Bark texture pattern */}
          <pattern id="barkPat" x="0" y="0" width="8" height="24" patternUnits="userSpaceOnUse">
            <path d="M 4,0 Q 2,6 4,12 Q 6,18 4,24" stroke="#4a2a10" strokeWidth="0.6" fill="none" opacity="0.3"/>
          </pattern>

          {/* CSS animations */}
          <style>{`
            @keyframes leafSway {
              0%,100% { transform: rotate(-1.5deg) translateX(-1px); }
              50%      { transform: rotate( 1.5deg) translateX( 1px); }
            }
            @keyframes cloudFloat {
              0%,100% { transform: translateX(0); }
              50%      { transform: translateX(12px); }
            }
            @keyframes cloudFloatR {
              0%,100% { transform: translateX(0); }
              50%      { transform: translateX(-10px); }
            }
            @keyframes rainDrop {
              0%   { transform: translate(0,0);       opacity: 0; }
              15%  { opacity: 0.70; }
              85%  { opacity: 0.60; }
              100% { transform: translate(-6px,40px); opacity: 0; }
            }
            @keyframes windPulse {
              0%,100% { opacity: 0; transform: scaleX(0.1) translateX(-8px); }
              40%,60% { opacity: 0.7; transform: scaleX(1) translateX(0); }
            }
            @keyframes floatBadge {
              0%,100% { transform: translateY(0);   }
              50%      { transform: translateY(-5px); }
            }
            @keyframes fruitPop {
              0%   { transform: scale(0); opacity: 0; }
              70%  { transform: scale(1.15); opacity:1; }
              100% { transform: scale(1);   opacity:1; }
            }
            @keyframes blossomFade {
              0%   { opacity: 0; transform: scale(0.4); }
              100% { opacity: 1; transform: scale(1);   }
            }
            @keyframes breathe {
              0%,100% { opacity: 0.30; }
              50%      { opacity: 0.65; }
            }
            .leaf-layer { animation: leafSway ease-in-out 4.2s infinite; transform-origin: 450px 568px; }
            .cloud-left  { animation: cloudFloat ease-in-out 7s infinite; }
            .cloud-right { animation: cloudFloatR ease-in-out 8.5s 1.5s infinite; }
            .rain-drop   { animation: rainDrop linear infinite; }
            .wind-line   { animation: windPulse ease-in-out infinite; transform-origin: left center; }
            .float-badge { animation: floatBadge ease-in-out 3.8s infinite; }
            .float-badge-r { animation: floatBadge ease-in-out 3.8s 1.2s infinite; }
            .blossom     { animation: blossomFade ease-out 0.8s forwards; }
            .fruit       { animation: fruitPop cubic-bezier(.36,.07,.19,.97) 0.6s forwards; }
            .clickable   { cursor: pointer; }
            .breathe     { animation: breathe ease-in-out 2.8s infinite; }
          `}</style>
        </defs>

        {/* ─── SKY & ATMOSPHERE ──────────────────────────────── */}
        {/* Subtle horizon haze */}
        <ellipse cx="450" cy="570" rx="420" ry="60" fill="rgba(180,230,160,0.28)"/>

        {/* ─── CLOUDS — LEFT (Marketing) ─────────────────────── */}
        <g className="cloud-left clickable" onClick={() => setActivePanel("mkt")}
           onMouseEnter={(e) => openTooltip("mkt", e)} onMouseLeave={() => setTooltip(null)}>
          {/* Bloom shadow */}
          <ellipse cx="168" cy="88" rx="95" ry="52" fill="white" opacity="0.20" filter="url(#cloudBlur)"/>
          {/* Main puffs */}
          <ellipse cx="158" cy="96"  rx="70" ry="38" fill="white" opacity="0.92"/>
          <ellipse cx="115" cy="104" rx="48" ry="30" fill="white" opacity="0.88"/>
          <ellipse cx="202" cy="100" rx="50" ry="28" fill="white" opacity="0.88"/>
          <ellipse cx="140" cy="76"  rx="42" ry="28" fill="white" opacity="0.90"/>
          <ellipse cx="178" cy="72"  rx="38" ry="25" fill="white" opacity="0.88"/>
          <ellipse cx="156" cy="64"  rx="29" ry="19" fill="white" opacity="0.85"/>
          {/* Tint if marketing high */}
          {mktProg > 60 && <ellipse cx="158" cy="88" rx="70" ry="35" fill={`rgba(236,72,153,${(mktProg-60)/400})`}/>}
        </g>

        {/* ─── CLOUDS — RIGHT (Thiên thời) ───────────────────── */}
        <g className="cloud-right clickable" onClick={() => setActivePanel("heaven")}
           onMouseEnter={(e) => openTooltip("mkt", e)} onMouseLeave={() => setTooltip(null)}>
          <ellipse cx="730" cy="82"  rx="105" ry="58" fill="white" opacity="0.20" filter="url(#cloudBlur)"/>
          <ellipse cx="726" cy="92"  rx="82"  ry="42" fill="white" opacity="0.92"/>
          <ellipse cx="668" cy="100" rx="54"  ry="32" fill="white" opacity="0.88"/>
          <ellipse cx="782" cy="96"  rx="56"  ry="30" fill="white" opacity="0.88"/>
          <ellipse cx="702" cy="70"  rx="44"  ry="28" fill="white" opacity="0.90"/>
          <ellipse cx="752" cy="66"  rx="40"  ry="25" fill="white" opacity="0.88"/>
          <ellipse cx="728" cy="58"  rx="30"  ry="19" fill="white" opacity="0.85"/>
          {hvIdx > 50 && <ellipse cx="726" cy="82" rx="78" ry="38" fill={`rgba(14,165,233,${(hvIdx-50)/500})`}/>}
        </g>

        {/* ─── WIND LINES (left, Marketing) ──────────────────── */}
        {[
          { x:102, y:136, w:52, delay:"0s",    dur:"2.1s" },
          { x: 94, y:158, w:64, delay:"0.35s", dur:"2.5s" },
          { x:108, y:178, w:44, delay:"0.6s",  dur:"1.9s" },
          { x: 90, y:198, w:56, delay:"0.2s",  dur:"2.3s" },
          { x:100, y:218, w:48, delay:"0.8s",  dur:"2.2s" },
          { x:112, y:238, w:40, delay:"0.1s",  dur:"2.6s" },
        ].map((wl, i) => (
          <line key={i} className="wind-line"
            x1={wl.x} y1={wl.y} x2={wl.x + wl.w} y2={wl.y}
            stroke="rgba(125,195,245,0.68)" strokeWidth="2.2" strokeLinecap="round"
            style={{ animationDelay: wl.delay, animationDuration: wl.dur }}
          />
        ))}

        {/* ─── RAIN DROPS (right cloud, Heaven Timing) ───────── */}
        {rainOn && RAIN_DROPS.map((r, i) => (
          <line key={i} className="rain-drop"
            x1={r.x} y1={r.y} x2={r.x - 2} y2={r.y + 13}
            stroke="rgba(99,140,225,0.65)" strokeWidth="1.4" strokeLinecap="round"
            style={{ animationDelay: `${r.delay}s`, animationDuration: `${r.dur}s` }}
          />
        ))}

        {/* ─── CANOPY BACKGROUND GLOW ────────────────────────── */}
        <ellipse cx="450" cy="330" rx="240" ry="210" fill="url(#canopyGlow)"/>

        {/* ─── LEAVES (back layer, lower opacity) ─────────────── */}
        <g className="leaf-layer" opacity="0.55">
          {allLeaves.filter((_, i) => i % 3 === 0).map((l, i) => (
            <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx * 0.9} ry={l.ry * 0.85}
              fill={l.color} opacity={l.opacity * 0.6}
              transform={`rotate(${l.rot},${l.x},${l.y})`}
            />
          ))}
        </g>

        {/* ─── BRANCHES (sub first, then main — wood behind leaves) ─ */}
        {/* Sub-branches */}
        {SUB_BRANCHES.map((b) => (
          <path key={b.parentId + b.ex}
            d={branchPath(b.sx,b.sy, b.cp1x,b.cp1y, b.cp2x,b.cp2y, b.ex,b.ey, b.w0,b.w1)}
            fill="url(#branchG)"
          />
        ))}

        {/* Main branches */}
        {BRANCHES.map((b) => {
          const prog = b.teamId ? app.getTeamProgress(b.teamId) : 70;
          const thick = 0.6 + prog / 100 * 0.4; // thickness scale 60-100%
          return (
            <g key={b.id}
               className={b.teamId ? "clickable" : ""}
               onClick={() => b.teamId && setActivePanel(b.teamId as PanelId)}
               onMouseEnter={(e) => b.teamId && openTooltip(b.teamId, e)}
               onMouseLeave={() => setTooltip(null)}
            >
              <path
                d={branchPath(b.sx,b.sy, b.cp1x,b.cp1y, b.cp2x,b.cp2y, b.ex,b.ey, b.w0*thick, b.w1*thick)}
                fill="url(#branchG)"
              />
              {/* Bark pattern overlay */}
              <path
                d={branchPath(b.sx,b.sy, b.cp1x,b.cp1y, b.cp2x,b.cp2y, b.ex,b.ey, b.w0*thick, b.w1*thick)}
                fill="url(#barkPat)" opacity="0.3"
              />
            </g>
          );
        })}

        {/* ─── TRUNK ──────────────────────────────────────────── */}
        <g className="clickable" onClick={() => setActivePanel("tech")}
           onMouseEnter={(e) => openTooltip("tech", e)} onMouseLeave={() => setTooltip(null)}>
          <path d={TRUNK_PATH} fill="url(#trunkG)"/>
          {/* Bark texture */}
          <path d={TRUNK_PATH} fill="url(#barkPat)" opacity="0.25"/>
          {/* Highlight */}
          <path d={`M 444,${GY} C 442,490 443,360 446,255 C 448,210 450,185 451,173 L 453,173 C 454,186 456,212 458,258 C 461,365 461,493 459,${GY}`}
            fill="rgba(210,155,75,0.14)"/>
          {/* Tech label on trunk */}
          <text x="450" y="390" textAnchor="middle" fill="rgba(255,255,255,0.55)"
            fontSize="10" fontWeight="600" letterSpacing="0.08em" style={{ pointerEvents:"none" }}>
            TECH CORE
          </text>
          <text x="450" y="404" textAnchor="middle" fill="rgba(255,255,255,0.42)"
            fontSize="8.5" style={{ pointerEvents:"none" }}>
            {app.projects.filter(p=>p.status==="live").length} LIVE / 30
          </text>
          {/* Trunk progress indicator */}
          <rect x="444" y="490" width="12" height={-(techProg / 100 * 80)} rx="3"
            fill="rgba(99,102,241,0.60)" style={{ transformOrigin:"444px 490px" }}/>
        </g>

        {/* ─── LEAVES (front layer) ───────────────────────────── */}
        <g className="leaf-layer">
          {allLeaves.filter((_, i) => i % 3 !== 0).map((l, i) => (
            <ellipse key={i} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry}
              fill={l.color} opacity={l.opacity}
              transform={`rotate(${l.rot},${l.x},${l.y})`}
            />
          ))}
        </g>

        {/* ─── BLOSSOMS (80%+ progress on branches) ───────────── */}
        {showBlossom(asstProg) && [
          [702,98],[618,82],[670,120],[660,108],
        ].map(([bx,by],i) => (
          <g key={i} className="blossom">
            {[0,72,144,216,288].map((deg) => (
              <ellipse key={deg} cx={bx + Math.cos(deg*Math.PI/180)*8} cy={by + Math.sin(deg*Math.PI/180)*8}
                rx="4.5" ry="3" fill="#fce7f3" opacity="0.88"
                transform={`rotate(${deg},${bx + Math.cos(deg*Math.PI/180)*8},${by + Math.sin(deg*Math.PI/180)*8})`}
              />
            ))}
            <circle cx={bx} cy={by} r="3.5" fill="#fbcfe8"/>
          </g>
        ))}
        {showBlossom(pianoProg) && [
          [196,98],[284,88],[240,122],[232,108],
        ].map(([bx,by],i) => (
          <g key={i} className="blossom" style={{ animationDelay:`${i*0.12}s` }}>
            {[0,72,144,216,288].map((deg) => (
              <ellipse key={deg} cx={bx + Math.cos(deg*Math.PI/180)*8} cy={by + Math.sin(deg*Math.PI/180)*8}
                rx="4.5" ry="3" fill="#f3e8ff" opacity="0.88"
                transform={`rotate(${deg},${bx + Math.cos(deg*Math.PI/180)*8},${by + Math.sin(deg*Math.PI/180)*8})`}
              />
            ))}
            <circle cx={bx} cy={by} r="3.5" fill="#e9d5ff"/>
          </g>
        ))}

        {/* ─── FRUITS (100% progress) ──────────────────────────── */}
        {showFruit(asstProg) && (
          <g className="fruit">
            <circle cx="692" cy="88" r="8" fill="#ef4444" filter="url(#glowPink)"/>
            <circle cx="692" cy="82" r="2" fill="#7f1d1d" opacity="0.6"/>
          </g>
        )}
        {showFruit(pianoProg) && (
          <g className="fruit">
            <circle cx="208" cy="90" r="8" fill="#8b5cf6" filter="url(#glowIndigo)"/>
            <circle cx="208" cy="84" r="2" fill="#4c1d95" opacity="0.6"/>
          </g>
        )}

        {/* ─── ROOTS ──────────────────────────────────────────── */}
        <g className="clickable" onClick={() => setActivePanel("hr")}
           onMouseEnter={(e) => openTooltip("hr", e)} onMouseLeave={() => setTooltip(null)}>
          {ROOT_PATHS.map((r, i) => {
            const thick = 0.5 + hrProg / 100 * 0.5;
            return (
              <path key={i} d={r.d}
                stroke="url(#rootG)" strokeWidth={r.w * thick}
                fill="none" strokeLinecap="round"
              />
            );
          })}
          {/* Root highlight */}
          {ROOT_PATHS.map((r, i) => (
            <path key={`h${i}`} d={r.d}
              stroke="rgba(180,110,55,0.30)" strokeWidth={(r.w * 0.3)}
              fill="none" strokeLinecap="round"
            />
          ))}
        </g>

        {/* ─── SOIL / GROUND ──────────────────────────────────── */}
        <rect x="0" y={GY} width="900" height="35" fill="url(#soilG)"/>

        {/* Soil texture — subtle horizontal lines */}
        {[12,22,30].map((dy) => (
          <line key={dy} x1="0" y1={GY+dy} x2="900" y2={GY+dy}
            stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
        ))}

        {/* ─── GRASS BLADES ───────────────────────────────────── */}
        <g onClick={() => setActivePanel("partnerships")} style={{ cursor:"pointer" }}>
          {blades.map((bl, i) => (
            <path key={i}
              d={`M ${bl.lx},${GY} Q ${bl.bx},${GY - bl.h} ${bl.rx},${GY}`}
              fill={i % 4 === 0 ? "#3a8030" : i % 4 === 1 ? "#4a9840" : i % 4 === 2 ? "#52a848" : "#3e8c38"}
              opacity="0.82"
            />
          ))}
        </g>

        {/* ─── UNDERGROUND / MARKET ───────────────────────────── */}
        <rect x="0" y={GY+35} width="900" height="97" fill="url(#underG)"
          className="clickable" onClick={() => setActivePanel("market")}
        />
        {/* Soil particles */}
        {Array.from({length:20},(_,i) => {
          const pr = seededRng(i*73); return { x: pr()*900, y: GY+42+pr()*50, r: 1+pr()*3 };
        }).map((p,i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r}
            fill={`rgba(120,70,20,${0.12+seededRng(i*31)()*0.15})`}/>
        ))}

        {/* ─── PARTNER CATEGORY LABELS (ground level) ─────────── */}
        {PARTNER_CATS.map((cat) => {
          const count = app.partners.filter((p) => p.category === cat.id).length;
          return (
            <g key={cat.id} className="clickable" onClick={() => setActivePanel("partnerships")}>
              <text x={cat.x} y={GY+56} textAnchor="middle" fill={cat.color}
                fontSize="10" fontWeight="700">
                {cat.icon} {cat.label}
              </text>
              <text x={cat.x} y={GY+70} textAnchor="middle" fill="rgba(255,255,255,0.45)"
                fontSize="8.5">
                {count} đối tác
              </text>
            </g>
          );
        })}

        {/* Market label */}
        <text x="450" y={GY+92} textAnchor="middle"
          fill="rgba(255,255,255,0.35)" fontSize="8.5" letterSpacing="2" fontWeight="300">
          🌍 THỊ TRƯỜNG (ĐẤT) · Market Index: {mkIdx}
        </text>

        {/* ─── FLOATING BADGES ─────────────────────────────────── */}

        {/* Marketing badge (left cloud) */}
        <g className="float-badge clickable" onClick={() => setActivePanel("mkt")}>
          <rect x="95" y="44" width="122" height="28" rx="6"
            fill="rgba(236,72,153,0.88)" stroke="#fce7f3" strokeWidth="1"/>
          <text x="156" y="63" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
            📣 Marketing
          </text>
        </g>

        {/* Thiên thời badge (right cloud) */}
        <g className="float-badge-r clickable" onClick={() => setActivePanel("heaven")}>
          <rect x="620" y="20" width="162" height="40" rx="6"
            fill="rgba(14,165,233,0.88)" stroke="#e0f2fe" strokeWidth="1"/>
          <text x="701" y="37" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
            🌦 Thiên Thời
          </text>
          <text x="701" y="52" textAnchor="middle" fill="rgba(255,255,255,0.80)" fontSize="9.5">
            Heaven Timing: {hvIdx}
          </text>
        </g>

        {/* ─── BRANCH TEAM LABELS ──────────────────────────────── */}
        {/* Right: assistant */}
        <g className="clickable" onClick={() => setActivePanel("assistant")}
           onMouseEnter={(e) => openTooltip("assistant",e)} onMouseLeave={() => setTooltip(null)}>
          <rect x="660" y="128" width="120" height="42" rx="6"
            fill="rgba(8,12,24,0.88)" stroke="#3b82f6" strokeWidth="1.5"/>
          <text x="720" y="145" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">📋 Hành chính</text>
          <text x="720" y="161" textAnchor="middle" fill="#93c5fd" fontSize="9.5">
            {asstProg}% · {health(asstProg).icon} {health(asstProg).label}
          </text>
        </g>

        {/* Left: piano */}
        <g className="clickable" onClick={() => setActivePanel("piano")}
           onMouseEnter={(e) => openTooltip("piano",e)} onMouseLeave={() => setTooltip(null)}>
          <rect x="120" y="130" width="116" height="42" rx="6"
            fill="rgba(8,12,24,0.88)" stroke="#8b5cf6" strokeWidth="1.5"/>
          <text x="178" y="147" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">🎹 Piano</text>
          <text x="178" y="163" textAnchor="middle" fill="#c4b5fd" fontSize="9.5">
            {pianoProg}% · {health(pianoProg).icon} {health(pianoProg).label}
          </text>
        </g>

        {/* Right mid: tech secondary label */}
        <g className="clickable" onClick={() => setActivePanel("tech")}>
          <rect x="616" y="244" width="100" height="36" rx="6"
            fill="rgba(8,12,24,0.85)" stroke="#6366f1" strokeWidth="1.2"/>
          <text x="666" y="259" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">⚙️ Công nghệ</text>
          <text x="666" y="273" textAnchor="middle" fill="#a5b4fc" fontSize="9">
            {techProg}% · {app.projects.length} projects
          </text>
        </g>

        {/* Left mid: hr secondary label */}
        <g className="clickable" onClick={() => setActivePanel("hr")}>
          <rect x="182" y="254" width="100" height="36" rx="6"
            fill="rgba(8,12,24,0.85)" stroke="#f59e0b" strokeWidth="1.2"/>
          <text x="232" y="269" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">👥 Nhân sự</text>
          <text x="232" y="283" textAnchor="middle" fill="#fde68a" fontSize="9">
            {hrProg}% · Rễ cây
          </text>
        </g>

        {/* Partnerships label near grass */}
        <g className="clickable" onClick={() => setActivePanel("partnerships")}>
          <rect x="330" y={GY-42} width="240" height="26" rx="5"
            fill="rgba(8,12,24,0.78)" stroke="#10b981" strokeWidth="1.2"/>
          <text x="450" y={GY-25} textAnchor="middle" fill="#6ee7b7" fontSize="10.5" fontWeight="600">
            🌿 Hợp tác · {partProg}% · {app.partners.length} đối tác
          </text>
        </g>

        {/* ─── CONNECTOR DASHED LINES from branches to cards ─── */}
        <line x1="660" y1="149" x2="648" y2="142" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"/>
        <line x1="236" y1="149" x2="252" y2="148" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"/>
        <line x1="616" y1="262" x2="612" y2="268" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.55"/>
        <line x1="282" y1="262" x2="290" y2="278" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3,2" opacity="0.55"/>

        {/* ─── TOOLTIP ─────────────────────────────────────────── */}
        {tooltip && (
          <g style={{ pointerEvents:"none" }}>
            <rect
              x={Math.min(tooltip.x - 5, 900 - 185)} y={Math.max(tooltip.y - 80, 4)}
              width="178" height="76" rx="8"
              fill="rgba(8,12,26,0.92)" stroke="rgba(148,163,184,0.25)" strokeWidth="1"
            />
            <text x={Math.min(tooltip.x, 900-100)} y={Math.max(tooltip.y-56,24)}
              textAnchor="middle" fill="white" fontSize="12" fontWeight="700">
              {TEAM_LABELS[tooltip.title] ?? tooltip.title}
            </text>
            <text x={Math.min(tooltip.x, 900-100)} y={Math.max(tooltip.y-38,42)}
              textAnchor="middle" fill="#94a3b8" fontSize="10">
              ✅ {tooltip.done}/{tooltip.total} tasks · {tooltip.prog}%
            </text>
            <text x={Math.min(tooltip.x, 900-100)} y={Math.max(tooltip.y-22,58)}
              textAnchor="middle" fill="#94a3b8" fontSize="10">
              {tooltip.kpi}
              {tooltip.overdue > 0 && `  ⚠ ${tooltip.overdue} quá hạn`}
            </text>
          </g>
        )}
      </svg>

      {/* ─── PANEL DRAWER ────────────────────────────────────── */}
      {activePanel && <TreePanel panelId={activePanel} onClose={() => setActivePanel(null)}/>}
    </div>
  );
}
