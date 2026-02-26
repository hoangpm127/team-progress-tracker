// ─────────────────────────────────────────────────────────────
//  Phân quyền — kiểu dữ liệu Role
//  (Mã truy cập thực tế lưu trên Supabase, bảng access_codes)
// ─────────────────────────────────────────────────────────────
export type Role = "guest" | "leader" | "admin";

/**
 * Map: access_codes.label  →  team.id
 * Dùng để xác định leader thuộc mảng nào sau khi xác thực.
 */
export const LABEL_TO_TEAM_ID: Record<string, string> = {
  "Marketing / Thương mại": "mkt",
  "Công nghệ":               "tech",
  "Hợp tác / Đối tác":      "partnerships",
  "Piano Division":          "piano",
  "Hành chính / BOD":        "assistant",
};
