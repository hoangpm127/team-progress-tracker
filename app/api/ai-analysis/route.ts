import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Types ─────────────────────────────────────────────────────────────────
interface TeamSummary {
  id: string;
  name: string;
  progress: number;   // 0-100
  done: number;
  total: number;
  overdue: number;
  forecast: number;   // projected % by end of Q1
  health: string;     // "Đúng tiến độ" | "Hơi chậm" | "Nguy hiểm"
}

interface SystemSnapshot {
  date: string;
  q1ElapsedDays: number;
  q1TotalDays: number;
  q1ElapsedPct: number;        // % thời gian Q1 đã qua
  avgOKR: number;              // % trung bình OKR toàn công ty
  totalOverdue: number;        // tổng task quá hạn
  bottleneck: string | null;   // tên team bottleneck
  kpis: { label: string; current: number | string; target: number | string; pct: number }[];
  teams: TeamSummary[];
}

// ─── POST /api/ai-analysis ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY chưa được cấu hình trong .env.local" },
      { status: 500 }
    );
  }

  let body: SystemSnapshot;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // ── Build the system prompt ──────────────────────────────────────────────
  const systemPrompt = `Bạn là một AI cố vấn chiến lược cho một công ty công nghệ Việt Nam đang vận hành hệ sinh thái kỹ thuật số.
Nhiệm vụ của bạn: phân tích nhanh dữ liệu vận hành Q1 và đưa ra đúng 4 nhận xét ngắn gọn, mỗi nhận xét 1-2 câu, viết bằng tiếng Việt, tập trung vào insight thực tế.

Quy tắc:
- KHÔNG lặp lại số liệu thô đã có trong dashboard.
- Mỗi bullet = 1 insight hoặc 1 khuyến nghị hành động cụ thể.
- Ưu tiên: rủi ro cao nhất → cơ hội bị bỏ lỡ → 1 điểm sáng → 1 khuyến nghị tổng thể.
- Không dùng markdown trong output, chỉ trả về JSON.
- Tone: thẳng thắn, chuyên nghiệp, như CFO nói với CEO.

Trả về JSON dạng: { "bullets": ["...", "...", "...", "..."] }`;

  // ── Build the user message with snapshot data ────────────────────────────
  const snap = body;
  const teamLines = snap.teams
    .map(
      (t) =>
        `  - ${t.name}: ${t.progress}% tiến độ | ${t.done}/${t.total} task xong | ${t.overdue} quá hạn | dự báo cuối Q1: ${t.forecast}% | tình trạng: ${t.health}`
    )
    .join("\n");

  const kpiLines = snap.kpis
    .map((k) => `  - ${k.label}: ${k.current}/${k.target} (${k.pct}%)`)
    .join("\n");

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

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 600,
        responseMimeType: "application/json",
      },
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userMessage);
    const text   = result.response.text();
    const parsed = JSON.parse(text) as { bullets?: string[] };

    if (!Array.isArray(parsed.bullets) || parsed.bullets.length === 0) {
      return NextResponse.json({ error: "AI không trả về kết quả hợp lệ" }, { status: 502 });
    }

    return NextResponse.json({ bullets: parsed.bullets.slice(0, 5) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Gemini error: ${msg}` }, { status: 502 });
  }
}
