export type TaskStatus = "Todo" | "Doing" | "Done";

export interface Team {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  teamId: string;
  title: string;
  description: string;
  weight: number;
  owner: string;
  deadline: string; // ISO date string
  startDate?: string; // For Gantt (ISO date string)
  status: TaskStatus;
  done: boolean;
}

export interface ActivityEntry {
  id: string;
  teamId: string;
  message: string;
  timestamp: string; // ISO date string
}

// ── OKR ──────────────────────────────────────────────────────────
export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string; // e.g. "%", "đơn hàng", "người"
}

export interface Objective {
  id: string;
  teamId: string; // "company" for company-level
  quarter: string; // e.g. "Q1 2026"
  title: string;
  keyResults: KeyResult[];
}

// ── KR Documents ─────────────────────────────────────────────
export interface KrDocument {
  id: string;
  krId: string;
  fileName: string;
  filePath: string;   // storage path in bucket
  fileSize: number;
  uploadedAt: string; // ISO timestamp
}
