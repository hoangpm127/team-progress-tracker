"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/AppContext";
import { ANNUAL_KPIS } from "@/lib/kpiData";
import { LABEL_TO_TEAM_ID } from "@/lib/authConfig";

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

// ─── Team icons ────────────────────────────────────────────────────────────────
const TEAM_ICONS: Record<string, string> = {
  tech: "⚙️",
  mkt: "📣",
  marketing: "📣",
  hr: "👥",
  partnerships: "🤝",
  assistant: "📋",
};
function teamIcon(id: string) {
  return TEAM_ICONS[id] ?? "🏢";
}

// ─── Partner groups (3 tiers) ─────────────────────────────────────────────────
const PARTNER_CATS = [
  { key: "contacted", label: "Đã tiếp cận",  color: "#ef4444", bg: "#fef2f2", border: "#fecaca", dot: "🔴", target: 60,
    desc: "Đã có buổi gặp hoặc giới thiệu sơ bộ — chưa đánh giá tiềm năng",
    list: ["FPT Software","Viettel","Vingroup","BIDV","Techcombank","VinFast","Tiki","VNG Corporation","Grab Vietnam","Lazada Vietnam","Sun Group","BRG Group","T&T Group"] },
  { key: "noted",     label: "Đã ghi nhớ",   color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", dot: "🟡", target: 40,
    desc: "Đã xác nhận quan tâm — đang trong giai đoạn đàm phán hoặc thử nghiệm",
    list: ["VPBank","ACB","Masan Group","TH True Milk","Kido Group","Hoà Phát","Vinamilk","Thế Giới Di Động","FPT Retail","An Phát Holdings","PAN Group","Sabeco","Habeco","PNJ","Gelex"] },
  { key: "partnered", label: "Đã hợp tác",   color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", dot: "🟢", target: 36,
    desc: "Đã ký kết hợp đồng — đang triển khai hợp tác thực tế",
    list: ["MoMo","VNPay","ZaloPay","VinaPhone","MobiFone","Be Group","Ahamove","UrBox","Homebase","GHN","GHTK","Propzy","OnPoint"] },
];

// ─── GMV OKR by division ──────────────────────────────────────────────────────
const GMV_DIVISIONS = [
  { name: "Marketing / Thương mại", icon: "📣", color: "#ec4899", current: 3.2, target: 20, note: "GMV từ kênh marketing & TMĐT" },
  { name: "Công nghệ",              icon: "⚙️", color: "#6366f1", current: 2.1, target: 15, note: "GMV từ nền tảng & API marketplace" },
  { name: "Hợp tác / Đối tác",      icon: "🤝", color: "#10b981", current: 1.8, target: 8,  note: "GMV từ mạng lưới đối tác chiến lược" },
  { name: "Piano Division",         icon: "🎹", color: "#8b5cf6", current: 0.7, target: 4,  note: "GMV từ dịch vụ & sản phẩm Piano" },
  { name: "Hành chính / BOD",        icon: "📋", color: "#3b82f6", current: 0.4, target: 3,  note: "GMV từ dịch vụ vận hành & hỗ trợ" },
];

// ─── Revenue by division ──────────────────────────────────────────────────────
const REVENUE_DIVISIONS = [
  { name: "Công nghệ",              icon: "⚙️", color: "#6366f1", current: 0.50, target: 3.5, note: "License, SaaS, API fee" },
  { name: "Marketing / Thương mại", icon: "📣", color: "#ec4899", current: 0.40, target: 3.0, note: "Hoa hồng, quảng cáo, affiliate" },
  { name: "Hợp tác / Đối tác",      icon: "🤝", color: "#10b981", current: 0.30, target: 2.0, note: "Revenue share, referral fee" },
  { name: "Piano Division",         icon: "🎹", color: "#8b5cf6", current: 0.15, target: 1.0, note: "Học phí, dịch vụ âm nhạc" },
  { name: "Hành chính / BOD",        icon: "📋", color: "#3b82f6", current: 0.05, target: 0.5, note: "Dịch vụ vận hành, tư vấn" },
];

// ─── Member distribution by platform ─────────────────────────────────────────
const MEMBER_PLATFORMS = [
  { name: "Xgroup Web Platform", icon: "🌐", color: "#6366f1", current: 5200,  target: 40000, monthlyNew: 2100,  desc: "Người dùng đăng ký nền tảng web" },
  { name: "Mobile App",          icon: "📱", color: "#ec4899", current: 3100,  target: 30000, monthlyNew: 1350,  desc: "Lượt cài đặt & tài khoản kích hoạt" },
  { name: "Partner Portal",      icon: "🤝", color: "#10b981", current: 2800,  target: 20000, monthlyNew: 980,   desc: "Doanh nghiệp & đối tác đăng ký" },
  { name: "E-learning",          icon: "📚", color: "#8b5cf6", current: 800,   target: 6000,  monthlyNew: 280,   desc: "Học viên tích cực trong tháng" },
  { name: "Commerce Portal",     icon: "🛒", color: "#f59e0b", current: 500,   target: 4000,  monthlyNew: 195,   desc: "Người bán & cửa hàng hoạt động" },
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
  const { teams, tasks, lastUpdated, loading, getTeamProgress, getTeamStats, getTeamObjectives, getCompanyObjectives,
          role, roleName, setAuth, logoutAuth } = useApp();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string[]>([]);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState<string | null>(null);
  const [aiUpdatedAt, setAiUpdatedAt] = useState<Date | null>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [gmvModalOpen, setGmvModalOpen] = useState(false);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ bullets: string[]; at: Date }[]>([]);
  const [showAiHistory, setShowAiHistory] = useState(false);
  // ── Auth state (modal-only — role/roleName live in AppContext) ────────────
  const [authOpen, setAuthOpen]   = useState(false);
  const [authStep, setAuthStep]   = useState<1 | 2>(1);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  async function handleAuthSubmit() {
    const code = authInput.trim();
    if (!code || authLoading) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const res  = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, step: authStep }),
      });
      const data = await res.json() as { ok: boolean; role?: string; label?: string; error?: string };
      if (!data.ok) {
        setAuthError(data.error ?? "Mã không hợp lệ.");
      } else if (data.role === "admin_step1") {
        // Đúng mã admin bước 1 — yêu cầu PIN bước 2
        setAuthStep(2); setAuthInput("");
      } else {
        const assignedRole = data.role as import("@/lib/authConfig").Role;
        const label = data.label ?? "";
        setAuth(assignedRole, label, LABEL_TO_TEAM_ID[label] ?? "");
        setAuthOpen(false); setAuthInput(""); setAuthStep(1);
      }
    } catch {
      setAuthError("Ẩ, không kết nối được server. Thử lại.");
    } finally {
      setAuthLoading(false);
    }
  }

  function closeAuth() {
    setAuthOpen(false); setAuthInput(""); setAuthError(""); setAuthStep(1); setAuthLoading(false);
  }

  // ── AI analysis helpers ─────────────────────────────────────────────────
  const fetchAI = async (method: "GET" | "POST") => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res  = await fetch("/api/ai-analysis", { method });
      const data = await res.json() as { bullets?: string[]; updatedAt?: string; error?: string };
      if (!res.ok || data.error) { setAiError(data.error ?? "Lỗi không xác định từ server"); }
      else {
        const newBullets = data.bullets ?? [];
        // Save previous analysis to history when force-refreshing (POST)
        setAiAnalysis(prev => {
          if (method === "POST" && prev.length > 0) {
            setAiUpdatedAt(prevAt => {
              if (prevAt) setAiHistory(h => [{ bullets: prev.slice(0, 3), at: prevAt }, ...h].slice(0, 5));
              return data.updatedAt ? new Date(data.updatedAt) : new Date();
            });
          } else {
            setAiUpdatedAt(data.updatedAt ? new Date(data.updatedAt) : new Date());
          }
          return newBullets;
        });
      }
    } catch { setAiError("Không thể kết nối server. Kiểm tra lại mạng hoặc API key."); }
    finally { setAiLoading(false); }
  };

  function handleKpiClick(id: string) {
    if (id === "k1") { setProjectModalOpen(true); return; }
    // k2–k5 — yêu cầu đăng nhập leader / admin
    if (role === "guest") { setAuthOpen(true); return; }
    if (id === "k2") setMemberModalOpen(true);
    else if (id === "k3") setPartnerModalOpen(true);
    else if (id === "k4") setRevenueModalOpen(true);
    else if (id === "k5") setGmvModalOpen(true);
  }

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

      {/* ── Floating auth button (fixed top-right) ───────────────────────── */}
      <div className="fixed top-4 right-4 z-40">
        {role === "guest" ? (
          <button onClick={() => setAuthOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 backdrop-blur border border-slate-200 shadow-lg hover:shadow-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all">
            🔐 <span>Quản lý</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl bg-white/95 backdrop-blur border border-emerald-200 shadow-lg text-xs font-semibold text-emerald-700">
            <span>{role === "admin" ? "👑" : "👷"} {roleName}</span>
            <button
              onClick={() => { logoutAuth(); setAuthStep(1); setAuthInput(""); setAuthError(""); }}
              className="w-5 h-5 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors" title="Đăng xuất">✕</button>
          </div>
        )}
      </div>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-600 tracking-wide">Q1 2026 · Ngày {Q1_ELAPSED}/{Q1_TOTAL} của quý</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 leading-tight"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #6d28d9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Tổng Quan Điều Hành
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">Bám sát chiến lược từ GSX · Mọi mục tiêu, tiến độ &amp; rủi ro đều hiện diện tại đây</p>
        {lastUpdated && (
          <p className="text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
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
            style={{ boxShadow: `0 2px 16px -4px ${s.accent}26, 0 1px 3px rgba(0,0,0,0.04)` }}>
            {'noBar' in s && s.noBar ? null : (
              <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}cc, transparent)` }} />
            )}
            <p className="text-[10px] font-bold text-slate-400 mb-1.5 leading-tight uppercase tracking-wider">{s.label}</p>
            <p className="text-[1.6rem] font-black leading-none mb-1 tabular-nums" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-[10px] text-slate-400 leading-tight">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2: Annual KPI targets ──────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 px-6 py-5 mb-6" style={{ boxShadow: "0 4px 24px -4px rgba(15,23,42,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="text-center mb-5">
          <h2 className="font-bold text-slate-800 text-base tracking-tight">🎯 KPI Chiến Lược Năm 2026</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Mục tiêu cấp hệ sinh thái · Năm đã qua {Math.round(YEAR_ELAPSED / YEAR_TOTAL * 100)}%</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {ANNUAL_KPIS.map((kpi) => {
            const pct = Math.min(100, Math.round((kpi.current / kpi.target) * 100));
            const yearForecast = Math.min(100, Math.round(pct / (YEAR_ELAPSED / YEAR_TOTAL)));
            const restricted = role === "guest" && kpi.id !== "k1" && 'clickable' in kpi && kpi.clickable;
            return (
                <div key={kpi.id}
                  className={`relative flex flex-col gap-2 ${'clickable' in kpi && kpi.clickable ? 'cursor-pointer hover:bg-indigo-50 rounded-xl p-2 -m-2 transition-colors' : ''}`}
                  onClick={'clickable' in kpi && kpi.clickable ? () => handleKpiClick(kpi.id) : undefined}
                  title={'clickable' in kpi && kpi.clickable ? (restricted ? 'Đăng nhập để xem chi tiết nội bộ' : 'Click để xem chi tiết') : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      {kpi.label}
                      {restricted && <span className="text-slate-300 text-[10px]">🔒</span>}
                    </span>
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 overflow-hidden mb-6" style={{ boxShadow: "0 4px 24px -4px rgba(15,23,42,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100/60">
          <div>
            <h2 className="font-bold text-slate-800 text-base tracking-tight">Tiến Độ Các Phòng Ban</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tính theo trọng số · Đường dọc = mức kỳ vọng hôm nay ({timeElapsedPct}%)</p>
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
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center shadow-sm text-base"
                      style={{ backgroundColor: team.color }}>
                      {teamIcon(team.id)}
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
          <div className="ml-[4.5rem] flex justify-between text-xs text-slate-300 font-medium">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Row 4: Bottleneck + Strategic alerts ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        {/* AI Quick Analysis */}
        <div className="relative bg-white/85 backdrop-blur-sm rounded-2xl border border-indigo-100/60 px-5 py-4 flex flex-col overflow-hidden"
          style={{ boxShadow: "0 4px 32px -4px rgba(99,102,241,0.18), 0 1px 4px rgba(0,0,0,0.04)" }}>
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(238,242,255,0.6) 0%, rgba(245,243,255,0.4) 100%)" }} />
          <div className="relative z-10">
          {/* Header + timestamp */}
          <div className="mb-3 text-center">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">🤖 Phân Tích Nhanh · AI</h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              {aiLoading
                ? <span className="text-[10px] text-indigo-400 animate-pulse">⏳ Đang cập nhật...</span>
                : aiUpdatedAt
                  ? <span className="text-[10px] text-slate-400">⏰ Cập nhật lúc {aiUpdatedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · tự động mỗi 2 giờ</span>
                  : <span className="text-[10px] text-slate-300">Tự động cập nhật mỗi 2 giờ</span>
              }
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 space-y-2">

            {/* Loading */}
            {aiLoading && aiAnalysis.length === 0 && (
              <div className="flex items-center gap-3 py-5 text-indigo-500">
                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin shrink-0" />
                <p className="text-xs leading-relaxed">AI đang đọc toàn bộ dữ liệu hệ thống và phân tích...</p>
              </div>
            )}

            {/* Error */}
            {aiError && !aiLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-red-700 mb-0.5">⚠ Không thể phân tích</p>
                <p className="text-[11px] text-red-600">{aiError}</p>
              </div>
            )}

            {/* AI bullets */}
            {aiAnalysis.length > 0 && (
              <ul className="space-y-2">
                {aiAnalysis.slice(0, 3).map((bullet, i) => (
                  <li key={i} className={`flex gap-3 items-start rounded-xl px-3 py-2.5 transition-opacity ${aiLoading ? "opacity-40" : ""}`}
                    style={{ background: "linear-gradient(135deg, rgba(238,242,255,0.8), rgba(245,243,255,0.6))", border: "1px solid rgba(165,180,252,0.3)" }}>
                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white mt-0.5"
                      style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}>{i + 1}</span>
                    <p className="text-xs text-slate-700 leading-relaxed">{bullet}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Manual trigger button */}
          <button
            onClick={() => fetchAI("POST")}
            disabled={aiLoading}
            className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", boxShadow: "0 4px 16px -2px rgba(99,102,241,0.4)" }}
          >
            {aiLoading ? "⏳ Đang phân tích..." : "🔄 Cập nhật ngay"}
          </button>

          {/* AI History */}
          {aiHistory.length > 0 && (
            <div className="mt-3">
              <button onClick={() => setShowAiHistory(v => !v)}
                className="text-[11px] text-indigo-400 hover:text-indigo-600 font-semibold flex items-center gap-1.5 mx-auto">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                {showAiHistory ? "Ẩn" : "Xem"} lịch sử phân tích ({aiHistory.length})
              </button>
              {showAiHistory && (
                <div className="mt-3 space-y-3">
                  {aiHistory.map((h, hi) => (
                    <div key={hi} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] text-slate-400 mb-2 font-semibold">
                        📅 {h.at.toLocaleDateString("vi-VN")} · {h.at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <ul className="space-y-1.5">
                        {h.bullets.map((b, bi) => (
                          <li key={bi} className="flex gap-2 text-xs text-slate-500">
                            <span className="shrink-0 w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">{bi + 1}</span>
                            <p className="leading-relaxed">{b}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Strategic alerts (now second) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/70 px-5 py-4" style={{ boxShadow: "0 4px 24px -4px rgba(15,23,42,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 className="font-bold text-slate-800 text-sm mb-3 text-center tracking-tight">⚡ Cảnh Báo Chiến Lược</h3>
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
                      <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-sm"
                        style={{ backgroundColor: team.color }}>
                        {teamIcon(team.id)}
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

      </div>

      {/* ── Projects Modal ─────────────────────────────────────────────────── */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setProjectModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: "'Times New Roman', Georgia, serif", letterSpacing: "0.08em" }}>🚀 30 DỰ ÁN TRIỂN KHAI</h2>
                <p className="text-xs text-slate-400 mt-0.5">8 đang triển khai · 22 đang lên kế hoạch</p>
              </div>
              <button onClick={() => setProjectModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">✕</button>
            </div>
            {/* Modal body */}
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROJECTS.map((p) => {
                  const stageLabels = ["Ý tưởng", "Demo", "Ra thị trường"];
                  const stageColors = { done: "bg-emerald-500", active: "bg-indigo-500", pending: "bg-slate-200" };
                  const stageText  = { done: "text-emerald-700", active: "text-indigo-700", pending: "text-slate-400" };
                  return (
                    <div key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                        p.active
                          ? "border-indigo-200 bg-indigo-50 shadow-sm hover:border-indigo-400 hover:shadow-md"
                          : "border-slate-100 bg-white opacity-50 hover:opacity-75 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <span className={`mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                          p.active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                        }`}>{String(p.id).padStart(2, "0")}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{p.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.note}</p>
                        </div>
                        {p.docs.length > 0 && (
                          <span className="shrink-0 text-[10px] bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full">{p.docs.length} tài liệu</span>
                        )}
                      </div>
                      {/* Stages */}
                      <div className="flex gap-1.5">
                        {p.stages.map((s, si) => (
                          <div key={si} className="flex-1 text-center">
                            <div className={`h-1.5 rounded-full mb-1 ${stageColors[s as keyof typeof stageColors]}`} />
                            <p className={`text-[10px] font-medium ${stageText[s as keyof typeof stageText]}`}>{stageLabels[si]}</p>
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

      <p className="text-xs text-slate-400 text-center">
        Nhấn vào phòng ban để xem chi tiết công việc · Đường dọc trên biểu đồ = mức kỳ vọng tiến độ hôm nay
      </p>

      {/* ── Partner Modal ────────────────────────────────────────────────── */}
      {partnerModalOpen && (() => {
        const signedPct = Math.round(13 / 136 * 100);
        const pipelinePct = Math.round(41 / 136 * 100);
        const yearExpPct = Math.round(YEAR_ELAPSED / YEAR_TOTAL * 100);
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPartnerModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">🤝 Đối Tác Ký Kết</h2>
                <p className="text-xs text-slate-400 mt-0.5">13 ký kết · 41 trong pipeline · Mục tiêu 136 đối tác cuối năm</p>
              </div>
              <button onClick={() => setPartnerModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-5">
              {/* Progress vs annual target */}
              <div className="rounded-2xl p-4 border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">📈 Tiến độ tổng thể</span>
                  <span className="text-xs text-slate-400">Năm đã qua {yearExpPct}%</span>
                </div>
                {/* Signed bar */}
                <div className="relative h-4 bg-white rounded-full overflow-hidden border border-slate-200 mb-1">
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pipelinePct}%`, background: "linear-gradient(90deg,#fde68a,#fbbf24)" }} />
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${signedPct}%`, background: "linear-gradient(90deg,#6ee7b7,#10b981)" }} />
                  {/* expected marker */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400" style={{ left: `${yearExpPct}%` }} />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
                  <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1" />🟢 Ký kết: <b className="text-slate-700">13</b> / 136</span>
                  <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-300 mr-1" />🟡 Pipeline: <b className="text-slate-700">41</b> / 136</span>
                  <span className="ml-auto text-slate-400">│ dọc = kỳ vọng hôm nay</span>
                </div>
              </div>
              {/* Funnel summary */}
              <div className="grid grid-cols-3 gap-3">
                {PARTNER_CATS.map(cat => {
                  const pct = Math.round(cat.list.length / cat.target * 100);
                  return (
                    <div key={cat.key} className="rounded-xl p-3 border text-center" style={{ background: cat.bg, borderColor: cat.border }}>
                      <div className="text-xl mb-1">{cat.dot}</div>
                      <div className="font-black text-xl" style={{ color: cat.color }}>{cat.list.length}<span className="text-sm font-normal text-slate-400">/{cat.target}</span></div>
                      <div className="text-[11px] font-bold" style={{ color: cat.color }}>{cat.label}</div>
                      <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{pct}% mục tiêu</div>
                    </div>
                  );
                })}
              </div>
              {/* Funnel flow arrow */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span className="px-3 py-1.5 rounded-full font-semibold bg-red-50 text-red-500 border border-red-100">13 Tiếp cận</span>
                <span>→</span>
                <span className="px-3 py-1.5 rounded-full font-semibold bg-amber-50 text-amber-500 border border-amber-100">15 Ghi nhớ</span>
                <span>→</span>
                <span className="px-3 py-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">13 Ký kết ✅</span>
              </div>
              {/* Per-group detail */}
              {PARTNER_CATS.map(cat => (
                <div key={cat.key} className="rounded-2xl border overflow-hidden" style={{ borderColor: cat.border }}>
                  <div className="flex items-center gap-2 px-4 py-3" style={{ background: cat.bg }}>
                    <span className="text-base">{cat.dot}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm" style={{ color: cat.color }}>{cat.label}</h3>
                        <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.list.length} / {cat.target} ({Math.round(cat.list.length/cat.target*100)}%)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100">
                    <div className="h-full" style={{ width: `${Math.round(cat.list.length/cat.target*100)}%`, background: `linear-gradient(90deg,${cat.color}80,${cat.color})` }} />
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {cat.list.map(name => (
                      <span key={name} className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                        style={{ background: cat.bg, borderColor: cat.border, color: cat.color }}>{name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── GMV Modal ────────────────────────────────────────────────────── */}
      {gmvModalOpen && (() => {
        const yearFrac = YEAR_ELAPSED / YEAR_TOTAL;
        const yearExpPct = Math.round(yearFrac * 100);
        const monthsEl = YEAR_ELAPSED / 30.44;
        const monthsLeft = (YEAR_TOTAL - YEAR_ELAPSED) / 30.44;
        const totalCurrent = 8.2, totalTarget = 50;
        const totalPct = Math.round(totalCurrent / totalTarget * 100);
        const totalForecast = yearFrac > 0 ? +(totalCurrent / yearFrac).toFixed(1) : 0;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setGmvModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">📊 GMV Năm 2026</h2>
                <p className="text-xs text-slate-400 mt-0.5">8.2T / 50T VND · Năm đã qua {yearExpPct}% · OKR 5 mảng</p>
              </div>
              <button onClick={() => setGmvModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Total summary */}
              <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#f5f3ff,#eef2ff)", border: "1px solid #ddd6fe" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">🏢 Tổng Xgroup</span>
                  <span className="text-sm font-black text-violet-600">{totalPct}%</span>
                </div>
                <div className="relative h-4 bg-white/70 rounded-full overflow-hidden mb-2">
                  <div className="h-4 rounded-full" style={{ width: `${totalPct}%`, background: "linear-gradient(90deg,#8b5cf6,#6366f1)" }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/70" style={{ left: `${yearExpPct}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-violet-700">8.2T</div>
                    <div className="text-[10px] text-slate-400">Thực tế</div>
                  </div>
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-slate-600">{totalForecast}T</div>
                    <div className="text-[10px] text-slate-400">Dự báo cuối năm</div>
                  </div>
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-slate-600">{+(totalCurrent / monthsEl).toFixed(1)}T</div>
                    <div className="text-[10px] text-slate-400">Trung bình/tháng</div>
                  </div>
                </div>
              </div>
              {/* Per division */}
              {GMV_DIVISIONS.map(d => {
                const pct = Math.round(d.current / d.target * 100);
                const ratio = yearExpPct > 0 ? pct / yearExpPct : 1;
                const health = ratio >= 0.8 ? { icon: "🟢", label: "Đúng tiến độ", c: "#10b981", bg: "#f0fdf4" }
                             : ratio >= 0.5 ? { icon: "🟡", label: "Hơi chậm",     c: "#f59e0b", bg: "#fffbeb" }
                             :                { icon: "🔴", label: "Chưa đạt",     c: "#ef4444", bg: "#fef2f2" };
                const forecast = yearFrac > 0 ? +(d.current / yearFrac).toFixed(1) : 0;
                const monthlyAvg = monthsEl > 0 ? +(d.current / monthsEl).toFixed(2) : 0;
                const monthlyNeed = monthsLeft > 0 ? +(( d.target - d.current) / monthsLeft).toFixed(2) : 0;
                return (
                  <div key={d.name} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${d.color}30` }}>
                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: `${d.color}0d` }}>
                      <span className="text-xl">{d.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">{d.name}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: health.bg, color: health.c }}>{health.icon} {health.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{d.note}</p>
                      </div>
                    </div>
                    {/* Progress bar with expected marker */}
                    <div className="px-4 pt-3 pb-1">
                      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(pct,100)}%`, background: `linear-gradient(90deg,${d.color}70,${d.color})` }} />
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60" style={{ left: `${yearExpPct}%` }} />
                      </div>
                    </div>
                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100 px-4 pb-3 pt-1">
                      <div className="text-center pr-2">
                        <div className="text-sm font-black" style={{ color: d.color }}>{pct}%</div>
                        <div className="text-[10px] text-slate-400">Hoàn thành</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-sm font-bold text-slate-700">{d.current}T</div>
                        <div className="text-[10px] text-slate-400">Thực tế</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-sm font-bold text-slate-600">{forecast}T</div>
                        <div className="text-[10px] text-slate-400">Dự báo / năm</div>
                      </div>
                      <div className="text-center pl-2">
                        <div className="text-sm font-bold text-rose-500">{monthlyNeed}T</div>
                        <div className="text-[10px] text-slate-400">Cần/tháng</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── Revenue Modal ─────────────────────────────────────────────────── */}
      {revenueModalOpen && (() => {
        const yearFrac = YEAR_ELAPSED / YEAR_TOTAL;
        const yearExpPct = Math.round(yearFrac * 100);
        const monthsEl = YEAR_ELAPSED / 30.44;
        const monthsLeft = (YEAR_TOTAL - YEAR_ELAPSED) / 30.44;
        const totalCurrent = 1.4, totalTarget = 10;
        const totalPct = Math.round(totalCurrent / totalTarget * 100);
        const totalForecast = yearFrac > 0 ? +(totalCurrent / yearFrac).toFixed(1) : 0;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRevenueModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">💰 Doanh Thu Năm 2026</h2>
                <p className="text-xs text-slate-400 mt-0.5">1.4T / 10T VND · Năm đã qua {yearExpPct}% · Holding & 5 mảng</p>
              </div>
              <button onClick={() => setRevenueModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Holding total */}
              <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fde68a" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">🏢 Holding (Tổng)</span>
                  <span className="text-sm font-black text-amber-600">{totalPct}%</span>
                </div>
                <div className="relative h-4 bg-white/70 rounded-full overflow-hidden mb-2">
                  <div className="h-4 rounded-full" style={{ width: `${totalPct}%`, background: "linear-gradient(90deg,#f59e0b,#d97706)" }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/70" style={{ left: `${yearExpPct}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-amber-600">1.4T</div>
                    <div className="text-[10px] text-slate-400">Thực tế</div>
                  </div>
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-slate-600">{totalForecast}T</div>
                    <div className="text-[10px] text-slate-400">Dự báo cuối năm</div>
                  </div>
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-slate-600">{+(totalCurrent / monthsEl).toFixed(2)}T</div>
                    <div className="text-[10px] text-slate-400">Trung bình/tháng</div>
                  </div>
                </div>
              </div>
              {/* Per division */}
              {REVENUE_DIVISIONS.map(d => {
                const pct = Math.round(d.current / d.target * 100);
                const ratio = yearExpPct > 0 ? pct / yearExpPct : 1;
                const health = ratio >= 0.8 ? { icon: "🟢", label: "Đúng tiến độ", c: "#10b981", bg: "#f0fdf4" }
                             : ratio >= 0.5 ? { icon: "🟡", label: "Hơi chậm",     c: "#f59e0b", bg: "#fffbeb" }
                             :                { icon: "🔴", label: "Chưa đạt",     c: "#ef4444", bg: "#fef2f2" };
                const forecast = yearFrac > 0 ? +(d.current / yearFrac).toFixed(2) : 0;
                const monthlyNeed = monthsLeft > 0 ? +(( d.target - d.current) / monthsLeft).toFixed(2) : 0;
                const sharePct = Math.round(d.current / totalCurrent * 100);
                return (
                  <div key={d.name} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${d.color}30` }}>
                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: `${d.color}0d` }}>
                      <span className="text-xl">{d.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">{d.name}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: health.bg, color: health.c }}>{health.icon} {health.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{d.note} · <b className="text-slate-500">{sharePct}%</b> tổng doanh thu</p>
                      </div>
                    </div>
                    <div className="px-4 pt-3 pb-1">
                      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(pct,100)}%`, background: `linear-gradient(90deg,${d.color}70,${d.color})` }} />
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60" style={{ left: `${yearExpPct}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100 px-4 pb-3 pt-1">
                      <div className="text-center pr-2">
                        <div className="text-sm font-black" style={{ color: d.color }}>{pct}%</div>
                        <div className="text-[10px] text-slate-400">Hoàn thành</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-sm font-bold text-slate-700">{d.current}T</div>
                        <div className="text-[10px] text-slate-400">Thực tế</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-sm font-bold text-slate-600">{forecast}T</div>
                        <div className="text-[10px] text-slate-400">Dự báo / năm</div>
                      </div>
                      <div className="text-center pl-2">
                        <div className="text-sm font-bold text-rose-500">{monthlyNeed}T</div>
                        <div className="text-[10px] text-slate-400">Cần/tháng</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── Member Platform Modal ─────────────────────────────────────────── */}
      {memberModalOpen && (() => {
        const yearFrac = YEAR_ELAPSED / YEAR_TOTAL;
        const yearExpPct = Math.round(yearFrac * 100);
        const monthsEl = YEAR_ELAPSED / 30.44;
        const monthsLeft = (YEAR_TOTAL - YEAR_ELAPSED) / 30.44;
        const totalCurrent = 12400, totalTarget = 100000;
        const totalPct = Math.round(totalCurrent / totalTarget * 100);
        const totalForecast = yearFrac > 0 ? Math.round(totalCurrent / yearFrac) : 0;
        const totalMonthlyNeed = monthsLeft > 0 ? Math.round((totalTarget - totalCurrent) / monthsLeft) : 0;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setMemberModalOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">👥 Thành Viên Nền Tảng</h2>
                <p className="text-xs text-slate-400 mt-0.5">12,400 / 100,000 · Năm đã qua {yearExpPct}% · 5 nền tảng</p>
              </div>
              <button onClick={() => setMemberModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 text-lg">✕</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Total summary */}
              <div className="rounded-2xl p-4 border border-indigo-100" style={{ background: "linear-gradient(135deg,#eef2ff,#f5f3ff)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">🌐 Toàn hệ sinh thái</span>
                  <span className="text-sm font-black text-indigo-600">{totalPct}%</span>
                </div>
                <div className="relative h-4 bg-white/70 rounded-full overflow-hidden mb-2">
                  <div className="h-4 rounded-full" style={{ width: `${totalPct}%`, background: "linear-gradient(90deg,#818cf8,#6366f1)" }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/70" style={{ left: `${yearExpPct}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-indigo-600">12,400</div>
                    <div className="text-[10px] text-slate-400">Thực tế</div>
                  </div>
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-slate-600">{totalForecast.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">Dự báo cuối năm</div>
                  </div>
                  <div className="rounded-xl bg-white/80 py-2">
                    <div className="text-sm font-black text-rose-500">{totalMonthlyNeed.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">Cần thêm/tháng</div>
                  </div>
                </div>
              </div>
              {/* Per platform */}
              {MEMBER_PLATFORMS.map(p => {
                const pct = Math.round(p.current / p.target * 100);
                const sharePct = Math.round(p.current / totalCurrent * 100);
                const ratio = yearExpPct > 0 ? pct / yearExpPct : 1;
                const health = ratio >= 0.8 ? { icon: "🟢", label: "Đúng tiến độ", c: "#10b981", bg: "#f0fdf4" }
                             : ratio >= 0.5 ? { icon: "🟡", label: "Hơi chậm",     c: "#f59e0b", bg: "#fffbeb" }
                             :                { icon: "🔴", label: "Chưa đạt",     c: "#ef4444", bg: "#fef2f2" };
                const forecast = yearFrac > 0 ? Math.round(p.current / yearFrac) : 0;
                const monthlyNeed = monthsLeft > 0 ? Math.round((p.target - p.current) / monthsLeft) : 0;
                return (
                  <div key={p.name} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${p.color}30` }}>
                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: `${p.color}0d` }}>
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">{p.name}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: health.bg, color: health.c }}>{health.icon} {health.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="px-4 pt-3 pb-1">
                      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${Math.min(pct,100)}%`, background: `linear-gradient(90deg,${p.color}70,${p.color})` }} />
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60" style={{ left: `${yearExpPct}%` }} />
                      </div>
                    </div>
                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100 px-4 pb-3 pt-1">
                      <div className="text-center pr-2">
                        <div className="text-sm font-black" style={{ color: p.color }}>{pct}%</div>
                        <div className="text-[10px] text-slate-400">Mục tiêu</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-sm font-bold text-slate-700">{p.current.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Thực tế</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-sm font-bold text-slate-600">{p.monthlyNew.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Mới/tháng</div>
                      </div>
                      <div className="text-center pl-2">
                        <div className="text-sm font-bold text-rose-500">{monthlyNeed.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Cần/tháng</div>
                      </div>
                    </div>
                    {/* Share badge */}
                    <div className="px-4 pb-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: p.color }}>{sharePct}% tổng thành viên</span>
                      <span className="text-[11px] text-slate-400 ml-2">Dự báo cuối năm: <b className="text-slate-600">{forecast.toLocaleString()}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── Auth Modal ───────────────────────────────────────────────────── */}
      {authOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={closeAuth}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100"
              style={{ background: authStep === 2 ? "linear-gradient(135deg,#fef3c7,#fffbeb)" : "linear-gradient(135deg,#eef2ff,#f5f3ff)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800 text-base">
                    {authStep === 1 ? "🔐 Truy cập nội bộ" : "👑 Xác nhận Admin"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {authStep === 1 ? "Nhập mã phân quyền của bạn để tiếp tục" : "Nhập mã PIN xác nhận (bước 2 / 2)"}
                  </p>
                </div>
                <button onClick={closeAuth} className="w-8 h-8 rounded-full hover:bg-white/60 flex items-center justify-center text-slate-400 text-sm">✕</button>
              </div>
            </div>

            {/* Input */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-2">
                  {authStep === 1 ? "Mã truy cập" : "Mã PIN xác nhận"}
                </label>
                <input
                  type="password"
                  value={authInput}
                  onChange={e => { setAuthInput(e.target.value); setAuthError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleAuthSubmit()}
                  placeholder={authStep === 1 ? "Nhập mã leader hoặc admin..." : "Nhập mã PIN thứ 2..."}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-mono tracking-widest"
                  autoFocus
                  disabled={authLoading}
                />
                {authError && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">⚠️ {authError}</p>
                )}
              </div>

              <button
                onClick={handleAuthSubmit}
                disabled={!authInput.trim() || authLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {authLoading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Đang kiểm tra...</>
                ) : authStep === 1 ? "Xác nhận →" : "Xác nhận Admin ✓"}
              </button>

              {/* Role info */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-500 mb-1">Cấp độ truy cập:</div>
                <div className="flex items-center gap-2">🏠 <span><b className="text-slate-600">Khách</b> — Xem tổng quan, không cần mã</span></div>
                <div className="flex items-center gap-2">👷 <span><b className="text-slate-600">Lãnh đạo mảng</b> — Mã 1 chiều do Admin cấp</span></div>
                <div className="flex items-center gap-2">👑 <span><b className="text-slate-600">Admin</b> — Mã Admin + PIN xác nhận (2 bước)</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Project Document Detail Modal ─────────────────────────────── */}
      {selectedProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      selectedProject.active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}>{String(selectedProject.id).padStart(2, "0")}</span>
                    {selectedProject.active && <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">🟢 Đang triển khai</span>}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base text-center">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedProject.note}</p>
                </div>
                <button onClick={() => setSelectedProject(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">✕</button>
              </div>
              {/* Stages recap */}
              <div className="flex gap-2 mt-3">
                {(["Ý tưởng", "Demo", "Ra thị trường"] as const).map((lbl, si) => {
                  const s = selectedProject.stages[si];
                  const dot = s === "done" ? "bg-emerald-500" : s === "active" ? "bg-indigo-500" : "bg-slate-200";
                  const txt = s === "done" ? "text-emerald-700" : s === "active" ? "text-indigo-700" : "text-slate-400";
                  return (
                    <div key={si} className="flex-1 text-center">
                      <div className={`h-1.5 rounded-full mb-1 ${dot}`} />
                      <p className={`text-[10px] font-medium ${txt}`}>{lbl}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Docs */}
            <div className="p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">📂 Tài liệu đính kèm</p>
              {selectedProject.docs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">Chưa có tài liệu nào</p>
                  <p className="text-xs mt-1">Dự án đang trong giai đoạn lên kế hoạch</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProject.docs.map((doc, di) => (
                    <div key={di}
                      onClick={() => doc.url && window.open(doc.url, "_blank")}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        doc.url
                          ? "border-indigo-100 bg-indigo-50 hover:border-indigo-300 hover:shadow-sm cursor-pointer"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <span className="text-xl shrink-0">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                          <span className="shrink-0 text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{doc.type}</span>
                          {doc.url && <span className="shrink-0 text-[10px] text-indigo-500">↗ Mở</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{doc.desc}</p>
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
