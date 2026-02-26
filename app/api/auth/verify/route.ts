// app/api/auth/verify/route.ts
// Kiểm tra mã truy cập từ DB — mã lưu dạng SHA-256 hash, không lộ plain text
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { code, step } = (await req.json()) as { code: string; step: 1 | 2 };
    if (!code || !step) return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
    // Validate code length & content to prevent abuse
    if (typeof code !== "string" || code.length < 4 || code.length > 32)
      return NextResponse.json({ ok: false, error: "Mã không hợp lệ." }, { status: 400 });
    if (![1, 2].includes(step))
      return NextResponse.json({ ok: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });

    // Hash mã người dùng nhập vào (SHA-256)
    const hash = createHash("sha256").update(code.trim()).digest("hex");

    const db = supabaseServer();

    if (step === 1) {
      // Tìm leader hoặc admin_step1
      const { data } = await db
        .from("access_codes")
        .select("id, role, label")
        .eq("code_hash", hash)
        .in("role", ["leader", "admin_step1"])
        .single();

      if (!data) return NextResponse.json({ ok: false, error: "Mã không hợp lệ. Vui lòng kiểm tra lại." });

      return NextResponse.json({
        ok: true,
        role: data.role === "admin_step1" ? "admin_step1" : "leader",
        label: data.label,
      });
    }

    // Step 2 — chỉ khớp admin_step2
    const { data } = await db
      .from("access_codes")
      .select("id, role, label")
      .eq("code_hash", hash)
      .eq("role", "admin_step2")
      .single();

    if (!data) return NextResponse.json({ ok: false, error: "Mã PIN xác nhận không đúng." });

    return NextResponse.json({ ok: true, role: "admin", label: "Admin" });
  } catch {
    return NextResponse.json({ ok: false, error: "Lỗi server." }, { status: 500 });
  }
}
