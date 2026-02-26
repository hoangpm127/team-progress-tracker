import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchTeams, fetchTasks, fetchObjectives, fetchAiCache, saveAiCache } from "@/lib/db";
import { ANNUAL_KPIS } from "@/lib/kpiData";

// ─── Constants ─────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const Q1_START = new Date("2026-01-01");
const Q1_END   = new Date("2026-03-31");
const Q1_TOTAL = Math.round((Q1_END.getTime() - Q1_START.getTime()) / 86400000);
// ANNUAL_KPIS imported at top of file from lib/kpiData.ts (single source of truth)

// ─── Snapshot builder (mirrors page.tsx logic, reads from DB) ──────────────
async function buildSnapshot() {
  const [teams, tasks, objectives] = await Promise.all([
    fetchTeams(),
    fetchTasks(),
    fetchObjectives(),
  ]);

  const now      = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const q1E = Math.max(0, Math.min(Q1_TOTAL, Math.round((now.getTime() - Q1_START.getTime()) / 86400000)));
  const q1R = Q1_TOTAL - q1E;

  function teamProgress(teamId: string) {
    const tt    = tasks.filter((t) => t.teamId === teamId);
    const total = tt.reduce((s, t) => s + t.weight, 0);
    if (total === 0) return 0;
    const done = tt.filter((t) => t.done).reduce((s, t) => s + t.weight, 0);
    return Math.round((done / total) * 100);
  }
  function teamStats(teamId: string) {
    const tt = tasks.filter((t) => t.teamId === teamId);
    return {
      done:    tt.filter((t) => t.done).length,
      total:   tt.length,
      overdue: tt.filter((t) => !t.done && t.deadline < todayStr).length,
    };
  }
  function forecast(pct: number) {
    return q1E === 0 ? pct : Math.min(100, Math.round(pct + (pct / q1E) * q1R));
  }
  function healthLabel(pct: number) {
    const expected = q1E > 0 ? (q1E / Q1_TOTAL) * 100 : 0;
    const ratio    = expected > 0 ? pct / expected : 1;
    if (ratio >= 0.8) return "Đúng tiến độ";
    if (ratio >= 0.5) return "Hơi chậm";
    return "Nguy hiểm";
  }

  const allKRs = objectives.flatMap((o) => o.keyResults);
  const avgOKRPct = allKRs.length === 0 ? 0 : Math.round(
    (allKRs.reduce((s, kr) => s + (kr.target > 0 ? Math.min(1, kr.current / kr.target) : 0), 0) / allKRs.length) * 100
  );

  const ownerMap: Record<string, number> = {};
  tasks.filter((t) => !t.done).forEach((t) => { ownerMap[t.owner] = (ownerMap[t.owner] ?? 0) + 1; });
  const bneck = Object.entries(ownerMap).sort((a, b) => b[1] - a[1])[0];

  return {
    date:          now.toLocaleDateString("vi-VN"),
    q1ElapsedDays: q1E,
    q1TotalDays:   Q1_TOTAL,
    q1ElapsedPct:  Math.round((q1E / Q1_TOTAL) * 100),
    avgOKR:        avgOKRPct,
    totalOverdue:  tasks.filter((t) => !t.done && t.deadline < todayStr).length,
    bottleneck:    bneck ? bneck[0] : null,
    kpis: ANNUAL_KPIS.map((k) => ({
      label:   k.label,
      current: k.current,
      target:  k.target,
      pct:     Math.min(100, Math.round((k.current / k.target) * 100)),
    })),
    teams: teams.map((t) => {
      const pct   = teamProgress(t.id);
      const stats = teamStats(t.id);
      return { id: t.id, name: t.name, progress: pct, done: stats.done, total: stats.total, overdue: stats.overdue, forecast: forecast(pct), health: healthLabel(pct) };
    }),
  };
}

// ─── Gemini call ───────────────────────────────────────────────────────────
async function callGemini(snap: Awaited<ReturnType<typeof buildSnapshot>>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY chưa được cấu hình");

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemPrompt = `Bạn là một AI cố vấn chiến lược cho một công ty công nghệ Việt Nam đang vận hành hệ sinh thái kỹ thuật số.
Nhiệm vụ của bạn: phân tích nhanh dữ liệu vận hành Q1 và đưa ra đúng 4 nhận xét ngắn gọn, mỗi nhận xét 1-2 câu, viết bằng tiếng Việt, tập trung vào insight thực tế.

Quy tắc:
- KHÔNG lặp lại số liệu thô đã có trong dashboard.
- Mỗi bullet = 1 insight hoặc 1 khuyến nghị hành động cụ thể.
- Ưu tiên: rủi ro cao nhất → cơ hội bị bỏ lỡ → 1 điểm sáng → 1 khuyến nghị tổng thể.
- Không dùng markdown trong output, chỉ trả về JSON.
- Tone: thẳng thắn, chuyên nghiệp, như CFO nói với CEO.

Trả về JSON dạng: { "bullets": ["...", "...", "...", "..."] }`;

  const teamLines = snap.teams.map((t) =>
    `  - ${t.name}: ${t.progress}% tiến độ | ${t.done}/${t.total} task xong | ${t.overdue} quá hạn | dự báo cuối Q1: ${t.forecast}% | tình trạng: ${t.health}`
  ).join("\n");

  const kpiLines = snap.kpis.map((k) =>
    `  - ${k.label}: ${k.current}/${k.target} (${k.pct}%)`
  ).join("\n");

  const userMessage = `Dữ liệu hệ thống ngày ${snap.date}:

[Thời gian]
- Đã qua ${snap.q1ElapsedDays}/${snap.q1TotalDays} ngày Q1 (${snap.q1ElapsedPct}%)
- OKR trung bình toàn công ty: ${snap.avgOKR}%
- Tổng task quá hạn: ${snap.totalOverdue}
- Bottleneck: ${snap.bottleneck ?? "Không có"}

[KPI năm 2026]
${kpiLines}

[Tiến độ các phòng ban]
${teamLines}

Hãy phân tích và trả về JSON.`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userMessage);
  const text   = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI không trả về JSON hợp lệ. Raw: " + text.slice(0, 200));

  const parsed = JSON.parse(jsonMatch[0]) as { bullets?: string[] };
  if (!Array.isArray(parsed.bullets) || parsed.bullets.length === 0)
    throw new Error("AI không trả về kết quả hợp lệ");

  return parsed.bullets.slice(0, 5);
}

// ─── GET /api/ai-analysis — return cache; refresh if stale ────────────────
export async function GET() {
  try {
    const cache = await fetchAiCache();
    const fresh = cache && (Date.now() - new Date(cache.updatedAt).getTime() < CACHE_TTL_MS);

    if (fresh) {
      return NextResponse.json({ bullets: cache!.bullets, updatedAt: cache!.updatedAt });
    }

    // Stale or missing → refresh from DB → save → return
    const snap    = await buildSnapshot();
    const bullets = await callGemini(snap);
    await saveAiCache(bullets);
    const updatedAt = new Date().toISOString();
    return NextResponse.json({ bullets, updatedAt });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Fall back to stale cache if Gemini fails
    try {
      const stale = await fetchAiCache();
      if (stale) return NextResponse.json({ bullets: stale.bullets, updatedAt: stale.updatedAt, stale: true });
    } catch { /* ignore */ }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

// ─── POST /api/ai-analysis — manual force refresh ─────────────────────────
export async function POST() {
  try {
    const snap    = await buildSnapshot();
    const bullets = await callGemini(snap);
    await saveAiCache(bullets);
    const updatedAt = new Date().toISOString();
    return NextResponse.json({ bullets, updatedAt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
