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

// ── Projects (Technology / Trunk) ───────────────────────────
export type ProjectStatus = "idea" | "building" | "live";
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  owner: string;
  lastUpdateAt: string;
}

// ── Partners (Grass / Partnerships, 4 categories) ────────────
// 1=Suppliers  2=HR partners  3=Knowledge  4=Financial
export type PartnerCategory = 1 | 2 | 3 | 4;
export type PartnerStatus = "active" | "pipeline";
export interface Partner {
  id: string;
  category: PartnerCategory;
  name: string;
  status: PartnerStatus;
  createdAt: string;
}

// ── Market (Soil singleton) ───────────────────────────────────
export interface Market {
  marketIndex: number;   // 0–100
  notes: string;
  updatedAt: string;
}

// ── Heaven Timing (Rain singleton) ───────────────────────────
export interface HeavenTiming {
  heavenTimingIndex: number;  // 0–100
  rainEnabled: boolean;
  updatedAt: string;
}
