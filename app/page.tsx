"use client";
import Link from "next/link";
import { useApp } from "@/lib/AppContext";

// ─── Q1 2026 time reference ────────────────────────────────────────────────
const Q1_START = new Date("2026-01-01");
const Q1_END   = new Date("2026-03-31");
const TODAY    = new Date(); // dynamic — always current date
const Q1_TOTAL    = Math.round((Q1_END.getTime()   - Q1_START.getTime()) / 86400000);
const Q1_ELAPSED  = Math.max(0, Math.min(Q1_TOTAL, Math.round((TODAY.getTime() - Q1_START.getTime()) / 86400000)));
const Q1_REMAINING = Q1_TOTAL - Q1_ELAPSED;
const YEAR_START  = new Date(TODAY.getFullYear(), 0, 1);
const YEAR_TOTAL  = ((TODAY.getFullYear() % 4 === 0) ? 366 : 365);
const YEAR_ELAPSED = Math.round((TODAY.getTime() - YEAR_START.getTime()) / 86400000);

// ─── Annual company KPIs ───────────────────────────────────────────────────
const ANNUAL_KPIS = [
  { id: "k1", label: "Dự án triển khai", current: 8,     target: 30,     unit: "dự án",      color: "#6366f1" },
  { id: "k2", label: "Thành viên nền tảng", current: 12400, target: 100000, unit: "thành viên", color: "#ec4899" },
  { id: "k3", label: "Đối tác ký kết",   current: 41,    target: 136,    unit: "đối tác",    color: "#10b981" },
  { id: "k4", label: "Doanh thu năm",    current: 1.4,   target: 10,     unit: "tỷ VND",     color: "#f59e0b" },
];

function getHealth(pct: number) {
  const expected = (Q1_ELAPSED / Q1_TOTAL) * 100;
  const ratio    = expected > 0 ? pct / expected : 1;
  if (ratio >= 0.8) return { label: "Đúng tiến độ",  icon: "🟢", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (ratio >= 0.5) return { label: "Hơi chậm",       icon: "🟡", cls: "bg-amber-50   text-amber-700   border-amber-200"   };
  return             { label: "Nguy hiểm",       icon: "🔴", cls: "bg-red-50     text-red-600     border-red-200"     };
}

function fmtNum(n: number, unit: string) {
  if (unit === "thành viên" && n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  if (unit === "tỷ VND") return `${n}T`;
  return String(n);
}

function avgOKR(krs: { current: number; target: number }[]) {
  if (!krs.length) return 0;
  const total = krs.reduce((s, k) => {
    const pct = k.target > 0 ? Math.min(1, k.current / k.target) : 0;
    return s + pct;
  }, 0);
  return Math.round((total / krs.length) * 100);
}

export default function DashboardPage() {
  const { teams, tasks, lastUpdated, loading, getTeamProgress, getTeamStats, getTeamObjectives, getCompanyObjectives } = useApp();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"/>
        <span className="text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>
  );

  const allWeight   = tasks.reduce((s, t) => s + t.weight, 0);
  const doneWeight  = tasks.filter((t) => t.done).reduce((s, t) => s + t.weight, 0);
  const overallPct  = allWeight > 0 ? Math.round((doneWeight / allWeight) * 100) : 0;
  const totalDone   = tasks.filter((t) => t.done).length;
  const todayStr    = TODAY.toISOString().split("T")[0];
  const totalOverdue = tasks.filter((t) => !t.done && t.deadline < todayStr).length;

  // ── OKR average ──────────────────────────────────────────────────────────
  const allObjs = [...getCompanyObjectives(), ...teams.flatMap((t) => getTeamObjectives(t.id))];
  const allKRs  = allObjs.flatMap((o) => o.keyResults);
  const avgOKRPct = avgOKR(allKRs);

  // ── Teams at risk ─────────────────────────────────────────────────────────
  const teamHealthData = teams.map((t) => ({ team: t, pct: getTeamProgress(t.id), health: getHealth(getTeamProgress(t.id)) }));
  const atRiskCount    = teamHealthData.filter((d) => d.health.label === "Nguy hiểm").length;
  const onTrackCount   = teamHealthData.filter((d) => d.health.label === "Đúng tiến độ").length;

  // ── Bottleneck: owner with most pending tasks ────────────────────────────
  const pending = tasks.filter((t) => !t.done);
  const ownerMap: Record<string, number> = {};
  pending.forEach((t) => { ownerMap[t.owner] = (ownerMap[t.owner] ?? 0) + 1; });
  const bottleneck = Object.entries(ownerMap).sort((a, b) => b[1] - a[1])[0];

  // ── Q1 end forecast per team (linear velocity) ───────────────────────────
  function q1Forecast(pct: number) {
    if (Q1_ELAPSED === 0) return pct;
    const velocity = pct / Q1_ELAPSED;
    return Math.min(100, Math.round(pct + velocity * Q1_REMAINING));
  }

  const timeElapsedPct = Math.round((Q1_ELAPSED / Q1_TOTAL) * 100);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Control Center</span>
            <span className="text-xs text-slate-400">Q1 2026 · Ngày {Q1_ELAPSED}/{Q1_TOTAL} của quý</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan Điều hành</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kiểm soát chiến lược toàn hệ sinh thái · Đã qua {timeElapsedPct}% thời gian Q1</p>
        </div>
        {lastUpdated && (
          <p className="text-xs text-slate-400 shrink-0">
            Cập nhật lúc {new Date(lastUpdated).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* ── Row 1: Summary stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Tiến độ tổng",    value: `${overallPct}%`,              sub: "theo trọng số",       color: "text-indigo-600",  bg: "bg-indigo-50"  },
          { label: "Công việc xong",  value: `${totalDone}/${tasks.length}`, sub: "weighted progress",   color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "OKR trung bình",  value: `${avgOKRPct}%`,               sub: "tất cả kết quả then chốt",color: "text-violet-600",bg: "bg-violet-50"  },
          { label: "Team nguy hiểm",  value: `${atRiskCount}`,              sub: `${onTrackCount} đúng hạn`, color: atRiskCount > 0 ? "text-red-600" : "text-emerald-600", bg: atRiskCount > 0 ? "bg-red-50" : "bg-emerald-50" },
          { label: "Quá hạn",         value: `${totalOverdue}`,             sub: "cần xử lý ngay",      color: totalOverdue > 0 ? "text-red-500" : "text-slate-400", bg: totalOverdue > 0 ? "bg-red-50" : "bg-slate-50" },
          { label: "Thời gian Q1",    value: `${timeElapsedPct}%`,          sub: `${Q1_REMAINING} ngày còn lại`, color: "text-amber-600",bg: "bg-amber-50"  },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-4`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1 leading-tight">{s.label}</p>
            <p className={`text-2xl font-extrabold leading-none mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Annual KPI targets ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">🎯 KPI Chiến lược Năm 2026</h2>
            <p className="text-xs text-slate-400 mt-0.5">Mục tiêu cấp hệ sinh thái · Năm đã qua {Math.round(YEAR_ELAPSED / YEAR_TOTAL * 100)}%</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ANNUAL_KPIS.map((kpi) => {
            const pct = Math.min(100, Math.round((kpi.current / kpi.target) * 100));
            const yearForecast = Math.min(100, Math.round(pct / (YEAR_ELAPSED / YEAR_TOTAL)));
            return (
              <div key={kpi.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{kpi.label}</span>
                  <span className="text-xs font-bold" style={{ color: kpi.color }}>{pct}%</span>
                </div>
                <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  {/* Time elapsed marker */}
                  <div className="absolute top-0 bottom-0 w-px bg-slate-300/70 z-10" style={{ left: `${Math.round(YEAR_ELAPSED / YEAR_TOTAL * 100)}%` }} />
                  <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: kpi.color }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span><span className="font-semibold text-slate-600">{fmtNum(kpi.current, kpi.unit)}</span> / {fmtNum(kpi.target, kpi.unit)} {kpi.unit}</span>
                  <span className="text-slate-400">Dự báo: <span className={yearForecast >= 80 ? "text-emerald-600 font-semibold" : yearForecast >= 50 ? "text-amber-600 font-semibold" : "text-red-500 font-semibold"}>{yearForecast}%</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 3: Team progress + health + forecast ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Tiến độ các phòng ban</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tính theo trọng số · Đường dọc = mức kỳ vọng tại thời điểm hiện tại ({timeElapsedPct}%)</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {teamHealthData.map(({ team, pct, health }, i) => {
            const stats    = getTeamStats(team.id);
            const forecast = q1Forecast(pct);
            const animDelay = `${i * 80}ms`;
            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="group rounded-xl px-3 py-3 -mx-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  {/* Top row: name + health badge + stats */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: team.color }}>
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors w-28 shrink-0 truncate">{team.name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${health.cls} shrink-0`}>
                      {health.icon} {health.label}
                    </span>
                    <div className="hidden sm:flex items-center gap-3 ml-auto text-xs text-slate-400 shrink-0">
                      <span><span className="font-semibold text-slate-600">{stats.done}</span>/{stats.total} xong</span>
                      {stats.overdue > 0 && <span className="text-red-400 font-semibold">⚠ {stats.overdue} quá hạn</span>}
                      <span className="text-slate-400">Dự báo cuối Q1: <span className={forecast >= 80 ? "text-emerald-600 font-bold" : forecast >= 50 ? "text-amber-600 font-bold" : "text-red-500 font-bold"}>{forecast}%</span></span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0 ml-auto sm:ml-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>

                  {/* Bar */}
                  <div className="relative h-7 bg-slate-100 rounded-xl overflow-hidden">
                    {/* Expected-progress marker line */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/40 z-10"
                      style={{ left: `${timeElapsedPct}%` }} />
                    {/* Filled bar */}
                    <div className="absolute left-0 top-0 h-full rounded-xl transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: team.color, minWidth: pct > 0 ? "2rem" : "0", transitionDelay: animDelay }} />
                    {[25, 50, 75].map((mark) => (
                      <div key={mark} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${mark}%` }} />
                    ))}
                    {pct >= 10 && (
                      <span className="absolute left-0 top-0 h-full flex items-center pl-3 text-xs font-bold text-white" style={{ width: `${pct}%` }}>
                        {pct}%
                      </span>
                    )}
                  </div>

                  {/* Mobile forecast */}
                  <div className="sm:hidden flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                    <span>{stats.done}/{stats.total} xong</span>
                    <span>Dự báo cuối Q1: <span className={forecast >= 80 ? "text-emerald-600 font-bold" : forecast >= 50 ? "text-amber-600 font-bold" : "text-red-500 font-bold"}>{forecast}%</span></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* X-axis */}
        <div className="px-6 pb-4">
          <div className="ml-[4.5rem] flex justify-between text-xs text-slate-300 font-medium">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Row 4: Strategic alerts + Bottleneck ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        {/* Strategic alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
          <h3 className="font-bold text-slate-800 text-sm mb-3">⚡ Cảnh báo chiến lược</h3>
          <div className="space-y-2">
            {teamHealthData.filter((d) => d.health.label !== "Đúng tiến độ").length === 0 && (
              <p className="text-xs text-emerald-600 font-semibold">✅ Tất cả phòng ban đang đúng tiến độ!</p>
            )}
            {teamHealthData
              .sort((a, b) => {
                const rank: Record<string, number> = { "Nguy hiểm": 0, "Hơi chậm": 1, "Đúng tiến độ": 2 };
                return rank[a.health.label] - rank[b.health.label];
              })
              .filter((d) => d.health.label !== "Đúng tiến độ")
              .map(({ team, pct, health }) => {
                const gap = Math.round((Q1_ELAPSED / Q1_TOTAL) * 100) - pct;
                return (
                  <Link key={team.id} href={`/teams/${team.id}`}>
                    <div className="flex items-center gap-3 py-1.5 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: team.color }}>
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700">{team.name} — {pct}%</p>
                        <p className="text-[11px] text-slate-400">Chậm {gap}% so với kỳ vọng</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${health.cls} shrink-0`}>
                        {health.icon} {health.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Bottleneck + insights */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
          <h3 className="font-bold text-slate-800 text-sm mb-3">🔍 Phân tích nhanh</h3>
          <div className="space-y-3">
            {/* Bottleneck */}
            {bottleneck && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-amber-800 mb-0.5">⚠ Bottleneck tiềm năng</p>
                <p className="text-sm font-semibold text-amber-900">{bottleneck[0]}</p>
                <p className="text-[11px] text-amber-600">{bottleneck[1]} công việc đang chờ xử lý</p>
              </div>
            )}
            {/* OKR insight */}
            <div className={`rounded-xl px-4 py-3 ${avgOKRPct >= 60 ? "bg-emerald-50 border border-emerald-200" : avgOKRPct >= 40 ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
              <p className={`text-xs font-bold mb-0.5 ${avgOKRPct >= 60 ? "text-emerald-800" : avgOKRPct >= 40 ? "text-amber-800" : "text-red-800"}`}>
                {avgOKRPct >= 60 ? "✅" : avgOKRPct >= 40 ? "🟡" : "🔴"} OKR toàn công ty: {avgOKRPct}%
              </p>
              <p className={`text-[11px] ${avgOKRPct >= 60 ? "text-emerald-700" : avgOKRPct >= 40 ? "text-amber-700" : "text-red-600"}`}>
                {avgOKRPct >= 60 ? "Kết quả then chốt đang tiến triển tốt" : avgOKRPct >= 40 ? "Một số mục tiêu cần thúc đẩy thêm" : "Cần review lại OKR ngay"}
              </p>
            </div>
            {/* Overdue */}
            {totalOverdue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-red-800 mb-0.5">🚨 {totalOverdue} công việc quá hạn</p>
                <p className="text-[11px] text-red-600">Cần xử lý ngay để tránh trễ mục tiêu Q1</p>
              </div>
            )}
            {totalOverdue === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-emerald-800">✅ Không có công việc quá hạn</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Nhấn vào phòng ban để xem chi tiết công việc · Đường dọc trên biểu đồ = mức kỳ vọng tiến độ hôm nay
      </p>
    </div>
  );
}
