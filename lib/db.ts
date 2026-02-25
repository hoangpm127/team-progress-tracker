/**
 * lib/db.ts  — Supabase data-access layer
 *
 * All raw Supabase queries live here so AppContext stays clean.
 * Tables: teams · tasks · objectives · key_results · activity
 *         projects · partners · market · heaven_timing
 */
import { supabase } from "./supabase";
import { Team, Task, TaskStatus, ActivityEntry, Objective, KeyResult, KrDocument,
         Project, Partner, Market, HeavenTiming } from "./types";

// ── helpers ──────────────────────────────────────────────────

function taskFromRow(row: Record<string, unknown>): Task {
  return {
    id:          row.id          as string,
    teamId:      row.team_id     as string,
    title:       row.title       as string,
    description: row.description as string,
    weight:      row.weight      as number,
    owner:       row.owner       as string,
    deadline:    row.deadline    as string,
    startDate:   (row.start_date as string | null) ?? undefined,
    status:      row.status      as TaskStatus,
    done:        row.done        as boolean,
  };
}

function objFromRows(
  objRow: Record<string, unknown>,
  krRows: Record<string, unknown>[]
): Objective {
  return {
    id:      objRow.id      as string,
    teamId:  objRow.team_id as string,
    quarter: objRow.quarter as string,
    title:   objRow.title   as string,
    keyResults: krRows
      .filter((kr) => kr.objective_id === objRow.id)
      .map((kr) => ({
        id:      kr.id      as string,
        title:   kr.title   as string,
        current: kr.current as number,
        target:  kr.target  as number,
        unit:    kr.unit    as string,
      })),
  };
}

// ── READ ─────────────────────────────────────────────────────

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from("teams").select("*");
  if (error) throw error;
  return (data ?? []) as Team[];
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("deadline", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(taskFromRow);
}

export async function fetchObjectives(): Promise<Objective[]> {
  const [objRes, krRes] = await Promise.all([
    supabase.from("objectives").select("*"),
    supabase.from("key_results").select("*"),
  ]);
  if (objRes.error) throw objRes.error;
  if (krRes.error)  throw krRes.error;

  const krRows  = krRes.data  ?? [];
  return (objRes.data ?? []).map((o) => objFromRows(o, krRows));
}

export async function fetchActivity(): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from("activity")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id:        r.id        as string,
    teamId:    r.team_id   as string,
    message:   r.message   as string,
    timestamp: r.timestamp as string,
  }));
}

// ── TASKS ────────────────────────────────────────────────────

export async function dbAddTask(task: Task): Promise<void> {
  const { error } = await supabase.from("tasks").insert({
    id:          task.id,
    team_id:     task.teamId,
    title:       task.title,
    description: task.description,
    weight:      task.weight,
    owner:       task.owner,
    deadline:    task.deadline,
    start_date:  task.startDate ?? null,
    status:      task.status,
    done:        task.done,
  });
  if (error) console.error("[db] addTask", error);
}

export async function dbUpdateTask(
  taskId: string,
  updates: Partial<Omit<Task, "id" | "teamId">>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.title       !== undefined) payload.title       = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.weight      !== undefined) payload.weight      = updates.weight;
  if (updates.owner       !== undefined) payload.owner       = updates.owner;
  if (updates.deadline    !== undefined) payload.deadline    = updates.deadline;
  if (updates.startDate   !== undefined) payload.start_date  = updates.startDate;
  if (updates.status      !== undefined) payload.status      = updates.status;
  if (updates.done        !== undefined) payload.done        = updates.done;

  const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
  if (error) console.error("[db] updateTask", error);
}

export async function dbDeleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) console.error("[db] deleteTask", error);
}

// ── ACTIVITY ──────────────────────────────────────────────────

export async function dbAddActivity(entry: ActivityEntry): Promise<void> {
  const { error } = await supabase.from("activity").insert({
    id:        entry.id,
    team_id:   entry.teamId,
    message:   entry.message,
    timestamp: entry.timestamp,
  });
  if (error) console.error("[db] addActivity", error);
}

// ── OBJECTIVES ────────────────────────────────────────────────

export async function dbAddObjective(obj: Objective): Promise<void> {
  const { error: objErr } = await supabase.from("objectives").insert({
    id:      obj.id,
    team_id: obj.teamId,
    quarter: obj.quarter,
    title:   obj.title,
  });
  if (objErr) { console.error("[db] addObjective", objErr); return; }

  if (obj.keyResults.length > 0) {
    const { error: krErr } = await supabase.from("key_results").insert(
      obj.keyResults.map((kr) => ({
        id:           kr.id,
        objective_id: obj.id,
        title:        kr.title,
        current:      kr.current,
        target:       kr.target,
        unit:         kr.unit,
      }))
    );
    if (krErr) console.error("[db] addObjective KRs", krErr);
  }
}

export async function dbUpdateObjective(
  objId: string,
  updates: Partial<Omit<Objective, "id">>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.teamId  !== undefined) payload.team_id = updates.teamId;
  if (updates.quarter !== undefined) payload.quarter  = updates.quarter;
  if (updates.title   !== undefined) payload.title    = updates.title;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase.from("objectives").update(payload).eq("id", objId);
    if (error) console.error("[db] updateObjective", error);
  }
}

export async function dbDeleteObjective(objId: string): Promise<void> {
  // key_results cascade-delete automatically (FK ON DELETE CASCADE)
  const { error } = await supabase.from("objectives").delete().eq("id", objId);
  if (error) console.error("[db] deleteObjective", error);
}

// ── KEY RESULTS ───────────────────────────────────────────────

export async function dbAddKeyResult(objId: string, kr: KeyResult): Promise<void> {
  const { error } = await supabase.from("key_results").insert({
    id:           kr.id,
    objective_id: objId,
    title:        kr.title,
    current:      kr.current,
    target:       kr.target,
    unit:         kr.unit,
  });
  if (error) console.error("[db] addKeyResult", error);
}

export async function dbUpdateKeyResult(krId: string, current: number): Promise<void> {
  const { error } = await supabase
    .from("key_results")
    .update({ current })
    .eq("id", krId);
  if (error) console.error("[db] updateKeyResult", error);
}

export async function dbDeleteKeyResult(krId: string): Promise<void> {
  const { error } = await supabase.from("key_results").delete().eq("id", krId);
  if (error) console.error("[db] deleteKeyResult", error);
}

// ── KR DOCUMENTS ──────────────────────────────────────────────

export async function fetchKrDocuments(krId: string): Promise<KrDocument[]> {
  const { data, error } = await supabase
    .from("kr_documents")
    .select("*")
    .eq("kr_id", krId)
    .order("uploaded_at", { ascending: false });
  if (error) { console.error("[db] fetchKrDocuments", error); return []; }
  return (data ?? []).map((r) => ({
    id:         r.id          as string,
    krId:       r.kr_id       as string,
    fileName:   r.file_name   as string,
    filePath:   r.file_path   as string,
    fileSize:   r.file_size   as number,
    uploadedAt: r.uploaded_at as string,
  }));
}

export async function dbUploadKrDocument(
  krId: string,
  file: File
): Promise<KrDocument | null> {
  const id = `krdoc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // Sanitize filename: replace spaces and special chars to avoid Supabase "Invalid key" error
  const safeName = file.name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // strip diacritics
    .replace(/[^a-zA-Z0-9._-]/g, "_")                    // keep only safe chars
    .replace(/_+/g, "_");                                 // collapse multiple underscores
  const ext = safeName.split(".").pop() ?? "bin";
  const filePath = `${krId}/${id}.${ext}`;

  // 1. Upload to storage
  const { error: uploadErr } = await supabase.storage
    .from("kr-documents")
    .upload(filePath, file, { contentType: file.type, upsert: false });
  if (uploadErr) { console.error("[db] uploadKrDocument storage", uploadErr); return null; }

  // 2. Insert metadata row
  const doc: KrDocument = {
    id,
    krId,
    fileName: file.name,
    filePath,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };
  const { error: metaErr } = await supabase.from("kr_documents").insert({
    id:          doc.id,
    kr_id:       doc.krId,
    file_name:   doc.fileName,
    file_path:   doc.filePath,
    file_size:   doc.fileSize,
    uploaded_at: doc.uploadedAt,
  });
  if (metaErr) { console.error("[db] uploadKrDocument meta", metaErr); return null; }
  return doc;
}

export async function dbDeleteKrDocument(doc: KrDocument): Promise<void> {
  // 1. Delete from storage
  const { error: storageErr } = await supabase.storage
    .from("kr-documents")
    .remove([doc.filePath]);
  if (storageErr) console.error("[db] deleteKrDocument storage", storageErr);

  // 2. Delete metadata row
  const { error: metaErr } = await supabase
    .from("kr_documents")
    .delete()
    .eq("id", doc.id);
  if (metaErr) console.error("[db] deleteKrDocument meta", metaErr);
}

export function getKrDocumentUrl(filePath: string): string {
  const { data } = supabase.storage
    .from("kr-documents")
    .getPublicUrl(filePath);
  return data.publicUrl;
}

// ══════════════════════════════════════════════════════════════
//  Projects (Technology / Trunk)
// ══════════════════════════════════════════════════════════════

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from("projects").select("*").order("id");
  if (error) { console.error("[db] fetchProjects", error); return []; }
  return (data ?? []).map((r) => ({
    id:           r.id           as string,
    name:         r.name         as string,
    status:       r.status       as Project["status"],
    owner:        r.owner        as string,
    lastUpdateAt: r.last_update_at as string,
  }));
}

export async function dbUpdateProject(id: string, updates: Partial<Omit<Project, "id">>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.name          !== undefined) row.name           = updates.name;
  if (updates.status        !== undefined) row.status         = updates.status;
  if (updates.owner         !== undefined) row.owner          = updates.owner;
  if (updates.lastUpdateAt  !== undefined) row.last_update_at = updates.lastUpdateAt;
  const { error } = await supabase.from("projects").update(row).eq("id", id);
  if (error) console.error("[db] dbUpdateProject", error);
}

// ══════════════════════════════════════════════════════════════
//  Partners (Grass / Partnerships)
// ══════════════════════════════════════════════════════════════

export async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase.from("partners").select("*").order("category");
  if (error) { console.error("[db] fetchPartners", error); return []; }
  return (data ?? []).map((r) => ({
    id:        r.id        as string,
    category:  r.category  as Partner["category"],
    name:      r.name      as string,
    status:    r.status    as Partner["status"],
    createdAt: r.created_at as string,
  }));
}

export async function dbAddPartner(p: Partner): Promise<void> {
  const { error } = await supabase.from("partners").insert({
    id: p.id, category: p.category, name: p.name,
    status: p.status, created_at: p.createdAt,
  });
  if (error) console.error("[db] dbAddPartner", error);
}

export async function dbUpdatePartner(id: string, updates: Partial<Omit<Partner,"id">>): Promise<void> {
  const { error } = await supabase.from("partners").update(updates).eq("id", id);
  if (error) console.error("[db] dbUpdatePartner", error);
}

// ══════════════════════════════════════════════════════════════
//  Market (Soil singleton)
// ══════════════════════════════════════════════════════════════

export async function fetchMarket(): Promise<Market | null> {
  const { data, error } = await supabase.from("market").select("*").eq("id","singleton").single();
  if (error) { console.error("[db] fetchMarket", error); return null; }
  return {
    marketIndex: data.market_index as number,
    notes:       data.notes as string,
    updatedAt:   data.updated_at as string,
  };
}

export async function dbUpdateMarket(updates: Partial<Market>): Promise<void> {
  const row: Record<string, unknown> = { id: "singleton", updated_at: new Date().toISOString() };
  if (updates.marketIndex !== undefined) row.market_index = updates.marketIndex;
  if (updates.notes       !== undefined) row.notes        = updates.notes;
  const { error } = await supabase.from("market").upsert(row);
  if (error) console.error("[db] dbUpdateMarket", error);
}

// ══════════════════════════════════════════════════════════════
//  Heaven Timing (Rain singleton)
// ══════════════════════════════════════════════════════════════

export async function fetchHeavenTiming(): Promise<HeavenTiming | null> {
  const { data, error } = await supabase.from("heaven_timing").select("*").eq("id","singleton").single();
  if (error) { console.error("[db] fetchHeavenTiming", error); return null; }
  return {
    heavenTimingIndex: data.heaven_timing_index as number,
    rainEnabled:       data.rain_enabled        as boolean,
    updatedAt:         data.updated_at          as string,
  };
}

export async function dbUpdateHeavenTiming(updates: Partial<HeavenTiming>): Promise<void> {
  const row: Record<string, unknown> = { id: "singleton", updated_at: new Date().toISOString() };
  if (updates.heavenTimingIndex !== undefined) row.heaven_timing_index = updates.heavenTimingIndex;
  if (updates.rainEnabled       !== undefined) row.rain_enabled        = updates.rainEnabled;
  const { error } = await supabase.from("heaven_timing").upsert(row);
  if (error) console.error("[db] dbUpdateHeavenTiming", error);
}

// ══════════════════════════════════════════════════════════════
//  AI Analysis Cache (singleton row, key = 'main')
// ══════════════════════════════════════════════════════════════

export async function fetchAiCache(): Promise<{ bullets: string[]; updatedAt: string } | null> {
  const { data, error } = await supabase
    .from("ai_cache")
    .select("bullets, updated_at")
    .eq("key", "main")
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    bullets:   row.bullets   as string[],
    updatedAt: row.updated_at as string,
  };
}

export async function saveAiCache(bullets: string[]): Promise<void> {
  const { error } = await supabase.from("ai_cache").upsert({
    key:        "main",
    bullets,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[db] saveAiCache", error);
}
