/**
 * lib/db.ts  — Supabase data-access layer
 *
 * All raw Supabase queries live here so AppContext stays clean.
 * Tables: teams · tasks · objectives · key_results · activity
 */
import { supabase } from "./supabase";
import { Team, Task, TaskStatus, ActivityEntry, Objective, KeyResult, KrDocument } from "./types";

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
