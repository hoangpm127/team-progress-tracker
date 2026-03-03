export type Role = "guest" | "leader" | "admin";

/**
 * Map: access_codes.label -> team.id
 * Dung de xac dinh leader thuoc mang nao sau khi xac thuc.
 * Ho tro ca nhan cu va nhan moi de tranh vo du lieu dang co.
 */
export const LABEL_TO_TEAM_ID: Record<string, string> = {
  "Marketing / Thương mại": "mkt",
  "Chuyển Đổi / Thương mại": "mkt",

  "Công nghệ": "tech",
  "Công Nghệ": "tech",

  "Hợp tác / Đối tác": "partnerships",
  "Đối Tác": "partnerships",

  "Piano Division": "piano",

  "Hành chính / BOD": "assistant",
  "Trợ Lý / BOD": "assistant",
};
