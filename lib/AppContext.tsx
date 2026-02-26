"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Team, Task, ActivityEntry, TaskStatus, Objective, KeyResult,
         Project, Partner, Market, HeavenTiming } from "./types";
import { TEAMS, SEED_TASKS, SEED_OBJECTIVES } from "./seedData";
import { Role } from "./authConfig";
import {
  fetchTeams, fetchTasks, fetchObjectives, fetchActivity,
  dbAddTask, dbUpdateTask, dbDeleteTask, dbAddActivity,
  dbAddObjective, dbUpdateObjective, dbDeleteObjective,
  dbAddKeyResult, dbUpdateKeyResult, dbDeleteKeyResult,
  fetchProjects, dbUpdateProject,
  fetchPartners, dbAddPartner, dbUpdatePartner,
  fetchMarket, dbUpdateMarket,
  fetchHeavenTiming, dbUpdateHeavenTiming,
} from "./db";

interface AppState {
  teams: Team[];
  tasks: Task[];
  objectives: Objective[];
  activity: ActivityEntry[];
  projects: Project[];
  partners: Partner[];
  market: Market;
  heavenTiming: HeavenTiming;
  lastUpdated: string | null;
}

interface AppContextValue extends AppState {
  loading:           boolean;
  toggleTask:        (taskId: string, owner: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  editTask: (taskId: string, updates: Partial<Omit<Task, "id" | "teamId">>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, owner: string) => void;
  updateKeyResult: (objId: string, krId: string, current: number) => void;
  addObjective: (obj: Omit<Objective, "id">) => void;
  updateObjective: (objId: string, updates: Partial<Omit<Objective, "id">>) => void;
  deleteObjective: (objId: string) => void;
  addKeyResult: (objId: string, kr: Omit<KeyResult, "id">) => void;
  deleteKeyResult: (objId: string, krId: string) => void;
  updateProject: (id: string, updates: Partial<Omit<Project,"id">>) => void;
  addPartner: (p: Omit<Partner,"id">) => void;
  updatePartner: (id: string, updates: Partial<Omit<Partner,"id">>) => void;
  setMarket: (updates: Partial<Market>) => void;
  setHeavenTiming: (updates: Partial<HeavenTiming>) => void;
  getTeamTasks: (teamId: string) => Task[];
  getTeamProgress: (teamId: string) => number;
  getTeamStats: (teamId: string) => { done: number; total: number; overdue: number };
  getTeamActivity: (teamId: string) => ActivityEntry[];
  getTeamObjectives: (teamId: string) => Objective[];
  getCompanyObjectives: () => Objective[];
  // ── Auth ──────────────────────────────────────────────────
  role:          Role;
  roleName:      string;
  leaderTeamId:  string;   // team.id mà leader được quyền sửa; "" nếu không phải leader
  setAuth:       (role: Role, name: string, teamId: string) => void;
  logoutAuth:    () => void;
  canEdit:       (teamId: string) => boolean; // admin=true; leader=teamId match; guest=false
}

const DEFAULT_MARKET: Market = { marketIndex: 55, notes: "", updatedAt: "" };
const DEFAULT_HEAVEN: HeavenTiming = { heavenTimingIndex: 60, rainEnabled: true, updatedAt: "" };

const AppContext = createContext<AppContextValue | null>(null);

const INITIAL_STATE: AppState = {
  teams:        TEAMS,
  tasks:        SEED_TASKS,
  objectives:   SEED_OBJECTIVES,
  activity:     [],
  projects:     [],
  partners:     [],
  market:       DEFAULT_MARKET,
  heavenTiming: DEFAULT_HEAVEN,
  lastUpdated:  null,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state,   setState]   = useState<AppState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  // ── Auth state ──────────────────────────────────────────────
  const [role,         setRole]         = useState<Role>("guest");
  const [roleName,     setRoleName]     = useState("");
  const [leaderTeamId, setLeaderTeamId] = useState("");

  const setAuth = useCallback((r: Role, name: string, teamId: string) => {
    setRole(r); setRoleName(name); setLeaderTeamId(teamId);
  }, []);

  const logoutAuth = useCallback(() => {
    setRole("guest"); setRoleName(""); setLeaderTeamId("");
  }, []);

  const canEdit = useCallback((teamId: string): boolean => {
    if (role === "admin") return true;
    if (role === "leader") return leaderTeamId === teamId;
    return false;
  }, [role, leaderTeamId]);
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [teams, tasks, objectives, activity, projects, partners, market, heaven] = await Promise.all([
          fetchTeams(),
          fetchTasks(),
          fetchObjectives(),
          fetchActivity(),
          fetchProjects(),
          fetchPartners(),
          fetchMarket(),
          fetchHeavenTiming(),
        ]);
        if (cancelled) return;
        setState({
          teams:        teams.length      ? teams      : TEAMS,
          tasks:        tasks.length      ? tasks      : SEED_TASKS,
          objectives:   objectives.length ? objectives : SEED_OBJECTIVES,
          activity,
          projects:     projects,
          partners:     partners,
          market:       market      ?? DEFAULT_MARKET,
          heavenTiming: heaven      ?? DEFAULT_HEAVEN,
          lastUpdated:  new Date().toISOString(),
        });
      } catch (err) {
        console.error("[AppContext] Supabase fetch failed, using seed data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Auto-transition: Todo → Doing when startDate passed ───
  useEffect(() => {
    if (loading) return;
    const today = new Date().toISOString().split("T")[0];
    setState((prev) => {
      const toTransition = prev.tasks.filter(
        (t) => t.status === "Todo" && t.startDate && t.startDate <= today
      );
      if (toTransition.length === 0) return prev;
      const now = new Date().toISOString();
      const updatedTasks = prev.tasks.map((t) =>
        toTransition.find((x) => x.id === t.id) ? { ...t, status: "Doing" as TaskStatus } : t
      );
      const newEntries: ActivityEntry[] = toTransition.map((t, i) => ({
        id: `act-auto-${Date.now()}-${i}`,
        teamId: t.teamId,
        message: `🤖 Tự động chuyển "${t.title}" sang Đang làm (đã đến ngày bắt đầu)`,
        timestamp: now,
      }));
      toTransition.forEach((t) => dbUpdateTask(t.id, { status: "Doing" }));
      newEntries.forEach((e) => dbAddActivity(e));
      return {
        ...prev,
        tasks: updatedTasks,
        activity: [...newEntries, ...prev.activity].slice(0, 200),
        lastUpdated: now,
      };
    });
  }, [loading]);

  const toggleTask = useCallback((taskId: string, owner: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const newDone   = !task.done;
      const newStatus: TaskStatus = newDone ? "Done" : task.status === "Done" ? "Doing" : task.status;
      const now  = new Date().toISOString();
      const entry: ActivityEntry = {
        id:        `act-${Date.now()}`,
        teamId:    task.teamId,
        message:   `${owner} đã đánh dấu "${task.title}" là ${newDone ? "Hoàn thành" : "Đang làm"}`,
        timestamp: now,
      };

      // DB calls are idempotent updates, safe even if updater runs twice
      dbUpdateTask(taskId, { done: newDone, status: newStatus });
      // Activity insert is NOT idempotent, but we accept possible duplicates for toggles
      dbAddActivity(entry);

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id !== taskId ? t : { ...t, done: newDone, status: newStatus }
        ),
        activity: [entry, ...prev.activity].slice(0, 200),
        lastUpdated: now,
      };
    });
  }, []);

  const addTask = useCallback((taskData: Omit<Task, "id">) => {
    const id      = `custom-${Date.now()}`;
    const now     = new Date().toISOString();
    const newTask: Task = { ...taskData, id };
    const entry: ActivityEntry = {
      id:        `act-${Date.now()}`,
      teamId:    taskData.teamId,
      message:   `${taskData.owner} đã thêm công việc "${taskData.title}"`,
      timestamp: now,
    };
    dbAddTask(newTask);
    dbAddActivity(entry);
    setState((prev) => ({
      ...prev,
      tasks:    [...prev.tasks, newTask],
      activity: [entry, ...prev.activity].slice(0, 200),
      lastUpdated: now,
    }));
  }, []);

  const getTeamTasks = useCallback(
    (teamId: string) => state.tasks.filter((t) => t.teamId === teamId),
    [state.tasks]
  );

  const getTeamProgress = useCallback(
    (teamId: string) => {
      const tasks = state.tasks.filter((t) => t.teamId === teamId);
      const total = tasks.reduce((s, t) => s + t.weight, 0);
      if (total === 0) return 0;
      const done = tasks.filter((t) => t.done).reduce((s, t) => s + t.weight, 0);
      return Math.round((done / total) * 100);
    },
    [state.tasks]
  );

  const getTeamStats = useCallback(
    (teamId: string) => {
      const tasks = state.tasks.filter((t) => t.teamId === teamId);
      const today = new Date().toISOString().split("T")[0];
      return {
        done: tasks.filter((t) => t.done).length,
        total: tasks.length,
        overdue: tasks.filter((t) => !t.done && t.deadline < today).length,
      };
    },
    [state.tasks]
  );

  const getTeamActivity = useCallback(
    (teamId: string) => state.activity.filter((a) => a.teamId === teamId),
    [state.activity]
  );

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus, owner: string) => {
    const now = new Date().toISOString();
    const entryId = `act-${Date.now()}`;
    const labels: Record<TaskStatus, string> = { Todo:"Chờ làm", Doing:"Đang làm", Done:"Hoàn thành" };
    dbUpdateTask(taskId, { status, done: status === "Done" });
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;
      const tasks = prev.tasks.map((t) =>
        t.id !== taskId ? t : { ...t, status, done: status === "Done" }
      );
      const entry: ActivityEntry = {
        id:        entryId,
        teamId:    task.teamId,
        message:   `${owner} chuyển "${task.title}" sang ${labels[status]}`,
        timestamp: now,
      };
      // entryId is stable — idempotent insert (PK conflict on retry is safe)
      dbAddActivity(entry);
      return { ...prev, tasks, activity: [entry, ...prev.activity].slice(0, 200), lastUpdated: now };
    });
  }, []);

  const editTask = useCallback((taskId: string, updates: Partial<Omit<Task, "id" | "teamId">>) => {
    dbUpdateTask(taskId, updates);
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id !== taskId ? t : { ...t, ...updates, done: (updates.status ?? t.status) === "Done" }
      ),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    dbDeleteTask(taskId);
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const addObjective = useCallback((obj: Omit<Objective, "id">) => {
    const newObj: Objective = { ...obj, id: `obj-custom-${Date.now()}` };
    dbAddObjective(newObj);
    setState((prev) => ({ ...prev, objectives: [...prev.objectives, newObj] }));
  }, []);

  const updateObjective = useCallback((objId: string, updates: Partial<Omit<Objective, "id">>) => {
    dbUpdateObjective(objId, updates);
    setState((prev) => ({ ...prev, objectives: prev.objectives.map((o) => (o.id !== objId ? o : { ...o, ...updates })) }));
  }, []);

  const deleteObjective = useCallback((objId: string) => {
    dbDeleteObjective(objId);
    setState((prev) => ({ ...prev, objectives: prev.objectives.filter((o) => o.id !== objId) }));
  }, []);

  const addKeyResult = useCallback((objId: string, krData: Omit<KeyResult, "id">) => {
    const kr: KeyResult = { ...krData, id: `kr-custom-${Date.now()}` };
    dbAddKeyResult(objId, kr);
    setState((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) =>
        o.id !== objId ? o : { ...o, keyResults: [...o.keyResults, kr] }
      ),
    }));
  }, []);

  const deleteKeyResult = useCallback((objId: string, krId: string) => {
    dbDeleteKeyResult(krId);
    setState((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) =>
        o.id !== objId ? o : { ...o, keyResults: o.keyResults.filter((kr) => kr.id !== krId) }
      ),
    }));
  }, []);

  const updateKeyResult = useCallback((objId: string, krId: string, current: number) => {
    dbUpdateKeyResult(krId, current);
    setState((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) =>
        o.id !== objId
          ? o
          : { ...o, keyResults: o.keyResults.map((kr) => (kr.id !== krId ? kr : { ...kr, current })) }
      ),
    }));
  }, []);

  const getTeamObjectives = useCallback(
    (teamId: string) => state.objectives.filter((o) => o.teamId === teamId),
    [state.objectives]
  );

  const getCompanyObjectives = useCallback(
    () => state.objectives.filter((o) => o.teamId === "company"),
    [state.objectives]
  );

  // ── Projects ────────────────────────────────────────────────
  const updateProject = useCallback((id: string, updates: Partial<Omit<Project,"id">>) => {
    dbUpdateProject(id, { ...updates, lastUpdateAt: new Date().toISOString() });
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => p.id !== id ? p : { ...p, ...updates }),
    }));
  }, []);

  // ── Partners ────────────────────────────────────────────────
  const addPartner = useCallback((data: Omit<Partner,"id">) => {
    const p: Partner = { ...data, id: `pr-${Date.now()}`, createdAt: new Date().toISOString() };
    dbAddPartner(p);
    setState((prev) => ({ ...prev, partners: [...prev.partners, p] }));
  }, []);

  const updatePartner = useCallback((id: string, updates: Partial<Omit<Partner,"id">>) => {
    dbUpdatePartner(id, updates);
    setState((prev) => ({
      ...prev,
      partners: prev.partners.map((p) => p.id !== id ? p : { ...p, ...updates }),
    }));
  }, []);

  // ── Market & Heaven ─────────────────────────────────────────
  const setMarket = useCallback((updates: Partial<Market>) => {
    dbUpdateMarket(updates);
    setState((prev) => ({ ...prev, market: { ...prev.market, ...updates } }));
  }, []);

  const setHeavenTiming = useCallback((updates: Partial<HeavenTiming>) => {
    dbUpdateHeavenTiming(updates);
    setState((prev) => ({ ...prev, heavenTiming: { ...prev.heavenTiming, ...updates } }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        loading,
        toggleTask, addTask, editTask, deleteTask, updateTaskStatus,
        updateKeyResult, addObjective, updateObjective, deleteObjective,
        addKeyResult, deleteKeyResult,
        updateProject, addPartner, updatePartner, setMarket, setHeavenTiming,
        getTeamTasks, getTeamProgress, getTeamStats,
        getTeamActivity, getTeamObjectives, getCompanyObjectives,
        // auth
        role, roleName, leaderTeamId, setAuth, logoutAuth, canEdit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
