"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { ANNUAL_KPIS } from "@/lib/kpiData";
import React from "react";
import {
  Cog, Megaphone, Users, Handshake, FileText, Building2,
  Target, Bot, Zap, RefreshCw, Clock, AlertTriangle, CheckCircle2,
  Rocket, FolderOpen, Inbox,
} from "lucide-react";

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

// ─── 30 Projects ─────────────────────────────────────────────────────────────
type ProjectDoc = { icon: string; name: string; type: string; url?: string; desc: string };
type Project = { id: number; name: string; active: boolean; stages: string[]; note: string; docs: ProjectDoc[] };
const PROJECTS: Project[] = [
  { id: 1,  name: "Xgroup Platform Web",           active: true,  stages: ["done","done","active"], note: "Ra thị trường Q1 2026",
    docs: [
      { icon: "📋", name: "Tài liệu nghiệp vụ tổng thể", type: "PDF", desc: "Mô tả toàn bộ luồng nghiệp vụ nền tảng web" },
      { icon: "🎨", name: "Thiết kế UI/UX Figma", type: "Figma", url: "#", desc: "Mockup & prototype giao diện người dùng" },
      { icon: "🔧", name: "Tài liệu kỹ thuật API", type: "Notion", url: "#", desc: "Đặc tả endpoint REST, auth, rate limit" },
      { icon: "✅", name: "Test cases & QA Checklist", type: "Sheet", desc: "Danh sách kiểm thử chức năng & regression" },
    ]
  },
  { id: 2,  name: "Xgroup Mobile App",              active: true,  stages: ["done","active","pending"], note: "Đang phát triển demo",
    docs: [
      { icon: "📋", name: "Product Requirements Document", type: "PDF", desc: "PRD đầy đủ cho iOS & Android" },
      { icon: "🎨", name: "Mobile UI Prototype", type: "Figma", url: "#", desc: "Prototype tương tác, user flow" },
      { icon: "📱", name: "Tech Stack & Architecture", type: "Notion", desc: "React Native, state management, CI/CD" },
    ]
  },
  { id: 3,  name: "AI Content Assistant",           active: true,  stages: ["done","active","pending"], note: "Tích hợp AI nội bộ",
    docs: [
      { icon: "🤖", name: "AI Model Specification", type: "PDF", desc: "Đặc tả mô hình LLM, fine-tuning strategy" },
      { icon: "📋", name: "Luồng nghiệp vụ AI Assistant", type: "Notion", desc: "Use case, prompt engineering, safety" },
      { icon: "🔧", name: "Integration Guide", type: "Doc", desc: "Hướng dẫn tích hợp vào hệ thống hiện tại" },
    ]
  },
  { id: 4,  name: "Partner Management System",      active: true,  stages: ["done","done","done"],   note: "Đã vận hành",
    docs: [
      { icon: "📋", name: "Hướng dẫn sử dụng", type: "PDF", desc: "User manual cho partner & admin" },
      { icon: "🔧", name: "System Architecture", type: "Notion", desc: "Sơ đồ kiến trúc & database schema" },
      { icon: "📊", name: "SLA & KPI Dashboard", type: "Sheet", desc: "Chỉ tiêu vận hành & báo cáo định kỳ" },
    ]
  },
  { id: 5,  name: "Payment Gateway Integration",    active: true,  stages: ["done","done","active"], note: "Kết nối cổng thanh toán",
    docs: [
      { icon: "💳", name: "Payment Flow Diagram", type: "PDF", desc: "Luồng thanh toán, refund, dispute handling" },
      { icon: "🔒", name: "Security & Compliance", type: "Doc", desc: "PCI-DSS, mã hóa dữ liệu thẻ" },
      { icon: "🔧", name: "Webhook & API Docs", type: "Notion", desc: "Tích hợp webhook thông báo trạng thái" },
    ]
  },
  { id: 6,  name: "Business Intelligence Dashboard",active: true,  stages: ["done","done","active"], note: "Phân tích kinh doanh",
    docs: [
      { icon: "📊", name: "Dashboard Requirements", type: "PDF", desc: "Danh sách metrics, biểu đồ, drill-down" },
      { icon: "🗄️", name: "Data Model & ETL Pipeline", type: "Notion", desc: "Sơ đồ data warehouse, cronjob" },
      { icon: "📋", name: "Báo cáo mẫu & Template", type: "Sheet", desc: "Các template báo cáo định kỳ" },
    ]
  },
  { id: 7,  name: "Developer API Marketplace",      active: true,  stages: ["done","active","pending"], note: "Marketplace API mở",
    docs: [
      { icon: "🔧", name: "API Catalog & Docs", type: "Notion", url: "#", desc: "Danh mục API public, sandbox, pricing" },
      { icon: "📋", name: "Onboarding Developer Guide", type: "PDF", desc: "Hướng dẫn đăng ký & tích hợp cho dev" },
      { icon: "📊", name: "Usage Analytics Spec", type: "Doc", desc: "Theo dõi lượt gọi, quota, billing" },
    ]
  },
  { id: 8,  name: "Internal CRM System",            active: true,  stages: ["done","done","active"], note: "CRM nội bộ",
    docs: [
      { icon: "📋", name: "Luồng nghiệp vụ CRM", type: "PDF", desc: "Pipeline sale, chăm sóc khách hàng, escalation" },
      { icon: "🎨", name: "CRM UI Wireframe", type: "Figma", desc: "Thiết kế giao diện CRM nội bộ" },
      { icon: "🗄️", name: "Database Schema", type: "Notion", desc: "Cấu trúc bảng dữ liệu khách hàng, contact" },
    ]
  },
  { id: 9,  name: "E-learning Platform",            active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "Ý tưởng & Scope ban đầu", type: "Doc", desc: "Brainstorm, target user, MVP features" }] },
  { id: 10, name: "Customer Loyalty Program",       active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "Loyalty Program Concept", type: "Doc", desc: "Cơ chế điểm thưởng, tier, redemption" }] },
  { id: 11, name: "Supply Chain Management",        active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 12, name: "HR Performance Portal",          active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "HR Portal Requirements", type: "Doc", desc: "KPI cá nhân, review 360, OKR cá nhân" }] },
  { id: 13, name: "Event Management System",        active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 14, name: "B2B Commerce Portal",            active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "B2B Commerce Scope", type: "Doc", desc: "Luồng đặt hàng B2B, pricing, approval" }] },
  { id: 15, name: "Social Commerce Features",       active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 16, name: "Inventory Management",           active: false, stages: ["pending","pending","pending"], note: "Q4 2026", docs: [] },
  { id: 17, name: "Customer Support System",        active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "Support Ticket Flow", type: "Doc", desc: "Luồng xử lý ticket, SLA, escalation" }] },
  { id: 18, name: "Affiliate Marketing Platform",   active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 19, name: "Data Warehouse v2",              active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "DWH v2 Migration Plan", type: "Doc", desc: "Kế hoạch nâng cấp data warehouse" }] },
  { id: 20, name: "Security Audit System",          active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 21, name: "Multi-language Support",         active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "i18n Scope & Language List", type: "Doc", desc: "Danh sách ngôn ngữ, chiến lược dịch thuật" }] },
  { id: 22, name: "Partner API v2",                 active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 23, name: "Mobile Payment App",             active: false, stages: ["pending","pending","pending"], note: "Q4 2026", docs: [] },
  { id: 24, name: "Business Process Automation",    active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 25, name: "Marketing Automation Suite",     active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "Marketing Automation Blueprint", type: "Doc", desc: "Email, SMS, push workflow tự động" }] },
  { id: 26, name: "Revenue Analytics Engine",       active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 27, name: "Customer Segmentation AI",       active: false, stages: ["pending","pending","pending"], note: "Q4 2026", docs: [] },
  { id: 28, name: "Chatbot Support 24/7",           active: false, stages: ["active","pending","pending"], note: "Q2 2026", docs: [{ icon: "📝", name: "Chatbot Flow & Intent Map", type: "Doc", desc: "Kịch bản hội thoại, intent, fallback" }] },
  { id: 29, name: "Document Management System",     active: false, stages: ["pending","pending","pending"], note: "Q3 2026", docs: [] },
  { id: 30, name: "Enterprise Analytics Dashboard", active: false, stages: ["pending","pending","pending"], note: "Q4 2026", docs: [] },
];

// ─── Team icons (lucide glyph) ──────────────────────────────────────────────────
const TEAM_ICON_MAP: Record<string, React.FC<{ size?: number; strokeWidth?: number }>> = {
  tech: Cog,
  mkt: Megaphone,
  marketing: Megaphone,
  hr: Users,
  partnerships: Handshake,
  assistant: FileText,
};
function TeamIcon({ id, size = 13 }: { id: string; size?: number }) {
  const Icon = TEAM_ICON_MAP[id] ?? Building2;
  return <Icon size={size} strokeWidth={2} />;
}

// ─── Stage hues (ý tưởng=red, demo=yellow, ra thị trường=green) ──────────────
const STAGE_HUES = ["#ef4444", "#eab308", "#22c55e"];

function getHealth(pct: number) {
  const expected = (Q1_ELAPSED / Q1_TOTAL) * 100;
  const ratio    = expected > 0 ? pct / expected : 1;
  if (ratio >= 0.8) return { label: "Đúng tiến độ", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (ratio >= 0.5) return { label: "Hơi chậm",      cls: "bg-amber-50   text-amber-700   border-amber-200"   };
  return             { label: "Nguy hiểm",      cls: "bg-red-50     text-red-600     border-red-200"     };
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
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string[]>([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState<string | null>(null);
  const [aiUpdatedAt, setAiUpdatedAt] = useState<Date | null>(null);

  // ── AI analysis helpers ─────────────────────────────────────────────────
  const fetchAI = async (method: "GET" | "POST") => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res  = await fetch("/api/ai-analysis", { method });
      const data = await res.json() as { bullets?: string[]; updatedAt?: string; error?: string };
      if (!res.ok || data.error) { setAiError(data.error ?? "Lỗi không xác định từ server"); }
      else { setAiAnalysis(data.bullets ?? []); setAiUpdatedAt(data.updatedAt ? new Date(data.updatedAt) : new Date()); }
    } catch { setAiError("Không thể kết nối server. Kiểm tra lại mạng hoặc API key."); }
    finally { setAiLoading(false); }
  };

  // Load cached analysis on mount (GET — instant if cache fresh, ~3s if stale)
  useEffect(() => {
    if (loading) return;
    fetchAI("GET");
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 leading-tight"
          style={{ background: "linear-gradient(135deg, #38E1FF 0%, #51F3FF 50%, #20CFED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 16px rgba(56,225,255,0.45))" }}>
          Tổng Quan Điều Hành
        </h1>
        <p className="text-sm font-semibold max-w-xs mx-auto leading-relaxed tracking-widest uppercase" style={{ color: "#6B9AC4" }}>Năng Lượng — Trí Tuệ — Tốc Độ</p>
        {lastUpdated && (
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Live · Cập nhật lúc {new Date(lastUpdated).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {/* ── Row 1: Summary stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Xgroup",         value: `${overallPct}%`,              sub: "theo trọng số",             accent: "#6366f1", noBar: true },
          { label: "CV hoàn thành",  value: `${totalDone}/${tasks.length}`, sub: "weighted progress",         accent: "#10b981" },
          { label: "OKR trung bình", value: `${avgOKRPct}%`,               sub: "kết quả then chốt",         accent: "#8b5cf6" },
          { label: "Team nguy hiểm", value: `${atRiskCount}`,              sub: `${onTrackCount} đúng hạn`,  accent: atRiskCount > 0 ? "#ef4444" : "#10b981" },
          { label: "Quá hạn",        value: `${totalOverdue}`,             sub: "cần xử lý ngay",            accent: totalOverdue > 0 ? "#f97316" : "#94a3b8" },
          { label: "Thời gian Q1",   value: `${timeElapsedPct}%`,          sub: `${Q1_REMAINING} ngày còn`, accent: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="stat-card bg-white rounded-2xl px-4 py-4 text-center relative overflow-hidden border border-slate-100/60"
        style={{ boxShadow: `0 2px 16px -4px ${s.accent}22, 0 1px 3px rgba(0,0,0,0.4)`, background: "linear-gradient(135deg, #0D2548 0%, #0A1E38 100%)", border: "1px solid rgba(56,225,255,0.12)" }}>
            {'noBar' in s && s.noBar ? null : (
              <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}cc, transparent)` }} />
            )}
            <p className="text-[10px] font-bold mb-1.5 leading-tight uppercase tracking-wider" style={{ color: "#6B9AC4" }}>{s.label}</p>
            <p className="text-[1.6rem] font-black leading-none mb-1 tabular-nums" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-[10px] leading-tight" style={{ color: "#4A7A9B" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Annual KPI targets ──────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 px-6 py-5 mb-6" style={{ boxShadow: "0 4px 24px -4px rgba(56,225,255,0.08), 0 1px 3px rgba(0,0,0,0.4)" }}>
        <div className="text-center mb-5">
          <h2 className="font-bold text-base tracking-tight flex items-center justify-center gap-2" style={{ color: "#EEF6FF" }}><Target size={14} style={{ color: "#38E1FF" }} /> KPI Chiến Lược Năm 2026</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {ANNUAL_KPIS.map((kpi) => {
            const pct = Math.min(100, Math.round((kpi.current / kpi.target) * 100));
            const yearForecast = Math.min(100, Math.round(pct / (YEAR_ELAPSED / YEAR_TOTAL)));
            return (
              <div key={kpi.id}
                className={`flex flex-col gap-2 ${'clickable' in kpi && kpi.clickable ? 'cursor-pointer hover:bg-indigo-50 rounded-xl p-2 -m-2 transition-colors' : ''}`}
                onClick={'clickable' in kpi && kpi.clickable ? () => setProjectModalOpen(true) : undefined}
                title={'clickable' in kpi && kpi.clickable ? 'Click để xem 30 dự án' : undefined}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{kpi.label}</span>
                  <span className="text-xs font-bold" style={{ color: kpi.color }}>{pct}%</span>
                </div>
                <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50 z-10" style={{ left: `${Math.round(YEAR_ELAPSED / YEAR_TOTAL * 100)}%` }} />
                  <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${kpi.color}99, ${kpi.color})`, boxShadow: pct > 5 ? `0 0 8px -1px ${kpi.color}80` : 'none' }} />
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 overflow-hidden mb-6" style={{ boxShadow: "0 4px 24px -4px rgba(56,225,255,0.08), 0 1px 3px rgba(0,0,0,0.4)" }}>
        <div className="text-center px-6 py-5" style={{ borderBottom: "1px solid rgba(56,225,255,0.10)" }}>
          <h2 className="font-bold text-base tracking-tight" style={{ color: "#EEF6FF" }}>Tiến Độ Các Phòng Ban</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B9AC4" }}>Tính theo trọng số · Đường dọc = mức kỳ vọng hôm nay ({timeElapsedPct}%)</p>
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
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center shadow-sm text-white"
                      style={{ backgroundColor: team.color }}>
                      <TeamIcon id={team.id} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors w-28 shrink-0 truncate">{team.name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${health.cls} shrink-0`}>
                      {health.label}
                    </span>
                    <div className="hidden sm:flex items-center gap-3 ml-auto text-xs text-slate-400 shrink-0">
                      <span><span className="font-semibold text-slate-600">{stats.done}</span>/{stats.total} xong</span>
                      {stats.overdue > 0 && <span className="text-red-400 font-semibold flex items-center gap-0.5"><AlertTriangle size={10} /> {stats.overdue} quá hạn</span>}
                      <span className="text-slate-400">Dự báo cuối Q1: <span className={forecast >= 80 ? "text-emerald-600 font-bold" : forecast >= 50 ? "text-amber-600 font-bold" : "text-red-500 font-bold"}>{forecast}%</span></span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0 ml-auto sm:ml-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>

                  {/* Bar */}
                  <div className="relative h-7 rounded-xl overflow-hidden"
                    style={{ background: "rgba(10,25,50,0.7)" }}>
                    {/* Expected-progress marker line */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/40 z-10"
                      style={{ left: `${timeElapsedPct}%` }} />
                    {/* Filled bar */}
                    <div className="absolute left-0 top-0 h-full rounded-xl transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${team.color}bb, ${team.color})`, boxShadow: pct > 0 ? `0 2px 12px -2px ${team.color}66` : 'none', minWidth: pct > 0 ? "2rem" : "0", transitionDelay: animDelay }} />
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
          <div className="ml-[4.5rem] flex justify-between text-xs font-medium" style={{ color: "#3B6899" }}>
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Row 4: AI Analysis + Cảnh Báo (merged panel) ─────────────────── */}
      <div className="relative backdrop-blur-sm rounded-2xl px-5 py-5 mb-6 overflow-hidden"
        style={{ background: "rgba(10,25,54,0.90)", border: "1px solid rgba(56,225,255,0.15)", boxShadow: "0 4px 32px -4px rgba(56,225,255,0.14), 0 1px 4px rgba(0,0,0,0.4)" }}>
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(14,111,174,0.12) 0%, rgba(18,184,232,0.06) 100%)" }} />
        <div className="relative z-10">

          {/* Two-column body */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">

            {/* ── Left: AI Quick Analysis ── */}
            <div>
              <div className="mb-3">
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 mb-1" style={{ color: "#EEF6FF" }}>
                  <Bot size={14} strokeWidth={2} className="shrink-0" style={{ color: "#38E1FF" }} />
                  Phân Tích Nhanh · AI
                </h3>
                <div className="flex items-center gap-1.5">
                  {aiLoading
                    ? <span className="text-[10px] text-indigo-400 animate-pulse flex items-center gap-1"><div className="w-2.5 h-2.5 border border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" /> Đang cập nhật...</span>
                    : aiUpdatedAt
                      ? <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={9} /> Cập nhật lúc {aiUpdatedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · tự động mỗi 2 giờ</span>
                      : <span className="text-[10px] text-slate-300">Tự động cập nhật mỗi 2 giờ</span>
                  }
                </div>
              </div>
              <div className="space-y-2">
                {aiLoading && aiAnalysis.length === 0 && (
                  <div className="flex items-center gap-3 py-5 text-indigo-500">
                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin shrink-0" />
                    <p className="text-xs leading-relaxed">AI đang đọc toàn bộ dữ liệu hệ thống và phân tích...</p>
                  </div>
                )}
                {aiError && !aiLoading && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-red-700 mb-0.5 flex items-center gap-1">
                      <AlertTriangle size={12} /> Không thể phân tích
                    </p>
                    <p className="text-[11px] text-red-600">{aiError}</p>
                  </div>
                )}
                {aiAnalysis.length > 0 && (
                  <ul className="space-y-2">
                    {aiAnalysis.map((bullet, i) => (
                      <li key={i} className={`flex gap-3 items-start rounded-xl px-3 py-2.5 transition-opacity ${aiLoading ? "opacity-40" : ""}`}
                        style={{ background: "linear-gradient(135deg, rgba(10,37,90,0.7), rgba(14,50,108,0.5))", border: "1px solid rgba(56,225,255,0.18)" }}>
                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                          style={{ background: "linear-gradient(135deg, #0E6FAE, #12B8E8)", boxShadow: "0 0 8px rgba(56,225,255,0.4)" }}>{i + 1}</span>
                        <p className="text-xs leading-relaxed" style={{ color: "#B8D7F2" }}>{bullet}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* ── Right: Strategic Alerts ── */}
            <div>
              <h3 className="font-bold text-sm mb-3 tracking-tight flex items-center gap-2" style={{ color: "#EEF6FF" }}>
                <Zap size={14} strokeWidth={2} className="shrink-0" style={{ color: "#38E1FF" }} />
                Cảnh Báo Chiến Lược
              </h3>
              <div className="space-y-2">
                {teamHealthData.filter((d) => d.health.label !== "Đúng tiến độ").length === 0 && (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Tất cả phòng ban đang đúng tiến độ!
                  </p>
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
                          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: team.color }}>
                            <TeamIcon id={team.id} size={11} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700">{team.name} — {pct}%</p>
                            <p className="text-[11px] text-slate-400">Chậm {gap}% so với kỳ vọng</p>
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${health.cls} shrink-0`}>
                            {health.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>

          </div>

          {/* Centered refresh button */}
          <div className="flex justify-center pt-3" style={{ borderTop: "1px solid rgba(56,225,255,0.10)" }}>
            <button
              onClick={() => fetchAI("POST")}
              disabled={aiLoading}
              className="px-8 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #0E6FAE, #12B8E8)", color: "white", boxShadow: "0 4px 16px -2px rgba(56,225,255,0.40)" }}
            >
              <RefreshCw size={12} />
              {aiLoading ? "Đang phân tích..." : "Cập nhật ngay"}
            </button>
          </div>

        </div>
      </div>

      {/* ── Projects Modal ─────────────────────────────────────────────────── */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setProjectModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}
            style={{ background: "#081D3D", border: "1px solid rgba(56,225,255,0.20)", boxShadow: "0 24px 80px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(56,225,255,0.10)" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(56,225,255,0.10)" }}>
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "#EEF6FF", letterSpacing: "0.06em" }}><Rocket size={16} style={{ color: "#38E1FF" }} /> 30 DỰ ÁN TRIỂN KHAI</h2>
                <p className="text-xs mt-0.5" style={{ color: "#6B9AC4" }}>8 đang triển khai · 22 đang lên kế hoạch</p>
              </div>
              <button onClick={() => setProjectModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors"
                style={{ color: "#6B9AC4", background: "rgba(56,225,255,0.06)" }}>✕</button>
            </div>
            {/* Modal body */}
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROJECTS.map((p) => {
                  const stageLabels = ["Ý tưởng", "Demo", "Ra thị trường"];
                  return (
                    <div key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                        p.active
                          ? "hover:shadow-md"
                          : "opacity-50 hover:opacity-75"
                      }`}
                      style={p.active ? {
                        borderColor: "rgba(56,225,255,0.30)",
                        background: "linear-gradient(135deg, rgba(14,111,174,0.12) 0%, rgba(18,184,232,0.06) 100%)",
                        boxShadow: "0 2px 12px -2px rgba(56,225,255,0.12)"
                      } : {
                        borderColor: "rgba(56,225,255,0.08)",
                        background: "rgba(10,25,50,0.6)"
                      }}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <span className={`mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                          p.active ? "text-white" : "text-xs font-bold"
                        }`}
                          style={p.active ? { background: "linear-gradient(135deg, #0E6FAE, #12B8E8)" } : { background: "rgba(56,225,255,0.10)", color: "#6B9AC4" }}
                        >{String(p.id).padStart(2, "0")}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight" style={{ color: "#EEF6FF" }}>{p.name}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#6B9AC4" }}>{p.note}</p>
                        </div>
                        {p.docs.length > 0 && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(56,225,255,0.12)", color: "#38E1FF" }}>{p.docs.length} tài liệu</span>
                        )}
                      </div>
                      {/* Stages */}
                      <div className="flex gap-1.5">
                        {p.stages.map((s, si) => (
                          <div key={si} className="flex-1 text-center">
                            <div className="h-1.5 rounded-full mb-1" style={{ background: s === "pending" ? `${STAGE_HUES[si]}40` : STAGE_HUES[si] }} />
                            <p className="text-[10px] font-medium" style={{ color: s === "pending" ? `${STAGE_HUES[si]}99` : STAGE_HUES[si] }}>{stageLabels[si]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-center mt-4" style={{ color: "#4A7A9B" }}>
        Nhấn vào phòng ban để xem chi tiết công việc · Đường dọc trên biểu đồ = mức kỳ vọng tiến độ hôm nay
      </p>

      {/* ── Project Document Detail Modal ─────────────────────────────── */}
      {selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}
            style={{ background: "#081D3D", border: "1px solid rgba(56,225,255,0.20)", boxShadow: "0 24px 80px -8px rgba(0,0,0,0.8)" }}>
            {/* Header */}
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(56,225,255,0.10)" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-white`}
                      style={selectedProject.active ? { background: "linear-gradient(135deg, #0E6FAE, #12B8E8)" } : { background: "rgba(56,225,255,0.10)", color: "#6B9AC4" }}>
                      {String(selectedProject.id).padStart(2, "0")}
                    </span>
                    {selectedProject.active && <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Đang triển khai</span>}
                  </div>
                  <h3 className="font-bold text-base text-center" style={{ color: "#EEF6FF" }}>{selectedProject.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#6B9AC4" }}>{selectedProject.note}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ color: "#6B9AC4", background: "rgba(56,225,255,0.06)" }}>✕</button>
              </div>
              {/* Stages recap */}
              <div className="flex gap-2 mt-3">
                {(["Ý tưởng", "Demo", "Ra thị trường"] as const).map((lbl, si) => {
                  const s = selectedProject.stages[si];
                  return (
                    <div key={si} className="flex-1 text-center">
                      <div className="h-1.5 rounded-full mb-1" style={{ background: s === "pending" ? `${STAGE_HUES[si]}40` : STAGE_HUES[si] }} />
                      <p className="text-[10px] font-medium" style={{ color: s === "pending" ? `${STAGE_HUES[si]}99` : STAGE_HUES[si] }}>{lbl}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Docs */}
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "#6B9AC4" }}><FolderOpen size={12} /> Tài liệu đính kèm</p>
              {selectedProject.docs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="flex justify-center mb-2"><Inbox size={36} style={{ color: "rgba(100,116,139,0.4)" }} /></div>
                  <p className="text-sm">Chưa có tài liệu nào</p>
                  <p className="text-xs mt-1">Dự án đang trong giai đoạn lên kế hoạch</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProject.docs.map((doc, di) => (
                    <div key={di}
                      onClick={() => doc.url && window.open(doc.url, "_blank")}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        doc.url ? "cursor-pointer" : ""
                      }`}
                      style={doc.url ? {
                        background: "linear-gradient(135deg, rgba(14,111,174,0.12) 0%, rgba(18,184,232,0.06) 100%)",
                        borderColor: "rgba(56,225,255,0.25)"
                      } : {
                        background: "rgba(10,25,50,0.5)",
                        borderColor: "rgba(56,225,255,0.10)"
                      }}
                    >
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(56,225,255,0.10)" }}>
                        <FileText size={15} style={{ color: "#38E1FF" }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate" style={{ color: "#EEF6FF" }}>{doc.name}</p>
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(56,225,255,0.10)", color: "#38E1FF" }}>{doc.type}</span>
                          {doc.url && <span className="shrink-0 text-[10px]" style={{ color: "#38E1FF" }}>↗ Mở</span>}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: "#6B9AC4" }}>{doc.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
