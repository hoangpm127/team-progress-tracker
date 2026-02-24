"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Team, Task, ActivityEntry, TaskStatus, Objective, KeyResult } from "./types";
import { TEAMS, SEED_TASKS, SEED_OBJECTIVES } from "./seedData";

interface AppState {
  teams: Team[];
  tasks: Task[];
  objectives: Objective[];
  activity: ActivityEntry[];
  lastUpdated: string | null;
}

interface AppContextValue extends AppState {
  toggleTask: (taskId: string, owner: string) => void;
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
  getTeamTasks: (teamId: string) => Task[];
  getTeamProgress: (teamId: string) => number;
  getTeamStats: (teamId: string) => { done: number; total: number; overdue: number };
  getTeamActivity: (teamId: string) => ActivityEntry[];
  getTeamObjectives: (teamId: string) => Objective[];
  getCompanyObjectives: () => Objective[];
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "team-progress-tracker-v1";

const INITIAL_STATE: AppState = {
  teams: TEAMS,
  tasks: SEED_TASKS,
  objectives: SEED_OBJECTIVES,
  activity: [],
  lastUpdated: null,
};

function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (!parsed.objectives || parsed.objectives.length === 0) {
        parsed.objectives = SEED_OBJECTIVES;
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_STATE;
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Always start with seed data so server & client initial render match (no hydration mismatch)
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  // After mount: load from localStorage, then run auto-transitions
  useEffect(() => {
    setState(loadFromStorage());
    setHydrated(true);
  }, []);

  // Persist on every change (only after hydration to avoid overwriting with seed data)
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // Auto-transition: Todo → Doing when startDate has passed (runs after localStorage is loaded)
  useEffect(() => {
    if (!hydrated) return;
    const today = new Date().toISOString().split("T")[0];
    setState((prev) => {
      const toTransition = prev.tasks.filter(
        (t) => t.status === "Todo" && t.startDate && t.startDate <= today
      );
      if (toTransition.length === 0) return prev;

      const now = new Date().toISOString();
      const updatedTasks = prev.tasks.map((t) =>
        toTransition.find((x) => x.id === t.id)
          ? { ...t, status: "Doing" as TaskStatus }
          : t
      );
      const newEntries: ActivityEntry[] = toTransition.map((t, i) => ({
        id: `act-auto-${Date.now()}-${i}`,
        teamId: t.teamId,
        message: `🤖 Tự động chuyển "${t.title}" sang Đang làm (đã đến ngày bắt đầu)`,
        timestamp: now,
      }));
      return {
        ...prev,
        tasks: updatedTasks,
        activity: [...newEntries, ...prev.activity].slice(0, 200),
        lastUpdated: now,
      };
    });
  }, [hydrated]);

  const toggleTask = useCallback((taskId: string, owner: string) => {
    setState((prev) => {
      const tasks = prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newDone = !t.done;
        const newStatus: TaskStatus = newDone ? "Done" : t.status === "Done" ? "Doing" : t.status;
        return { ...t, done: newDone, status: newStatus };
      });

      const task = tasks.find((t) => t.id === taskId)!;
      const now = new Date().toISOString();
      const entry: ActivityEntry = {
        id: `act-${Date.now()}`,
        teamId: task.teamId,
        message: `${owner} đã đánh dấu "${task.title}" là ${task.done ? "Hoàn thành" : "Đang làm"}`,
        timestamp: now,
      };

      return {
        ...prev,
        tasks,
        activity: [entry, ...prev.activity].slice(0, 200),
        lastUpdated: now,
      };
    });
  }, []);

  const addTask = useCallback((taskData: Omit<Task, "id">) => {
    setState((prev) => {
      const id = `custom-${Date.now()}`;
      const now = new Date().toISOString();
      const entry: ActivityEntry = {
        id: `act-${Date.now()}`,
        teamId: taskData.teamId,
        message: `${taskData.owner} đã thêm công việc "${taskData.title}"`,
        timestamp: now,
      };
      return {
        ...prev,
        tasks: [...prev.tasks, { ...taskData, id }],
        activity: [entry, ...prev.activity].slice(0, 200),
        lastUpdated: now,
      };
    });
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
    setState((prev) => {
      const tasks = prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const done = status === "Done";
        return { ...t, status, done };
      });
      const task = tasks.find((t) => t.id === taskId)!;
      const now = new Date().toISOString();
      const statusLabel: Record<TaskStatus, string> = { Todo: "Chờ làm", Doing: "Đang làm", Done: "Hoàn thành" };
      const entry: ActivityEntry = {
        id: `act-${Date.now()}`,
        teamId: task.teamId,
        message: `${owner} chuyển "${task.title}" sang ${statusLabel[status]}`,
        timestamp: now,
      };
      return { ...prev, tasks, activity: [entry, ...prev.activity].slice(0, 200), lastUpdated: now };
    });
  }, []);

  const editTask = useCallback((taskId: string, updates: Partial<Omit<Task, "id" | "teamId">>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id !== taskId ? t : { ...t, ...updates, done: (updates.status ?? t.status) === "Done" }
      ),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const addObjective = useCallback((obj: Omit<Objective, "id">) => {
    setState((prev) => ({
      ...prev,
      objectives: [...prev.objectives, { ...obj, id: `obj-custom-${Date.now()}` }],
    }));
  }, []);

  const updateObjective = useCallback((objId: string, updates: Partial<Omit<Objective, "id">>) => {
    setState((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) => (o.id !== objId ? o : { ...o, ...updates })),
    }));
  }, []);

  const deleteObjective = useCallback((objId: string) => {
    setState((prev) => ({
      ...prev,
      objectives: prev.objectives.filter((o) => o.id !== objId),
    }));
  }, []);

  const addKeyResult = useCallback((objId: string, kr: Omit<KeyResult, "id">) => {
    setState((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) =>
        o.id !== objId
          ? o
          : { ...o, keyResults: [...o.keyResults, { ...kr, id: `kr-custom-${Date.now()}` }] }
      ),
    }));
  }, []);

  const deleteKeyResult = useCallback((objId: string, krId: string) => {
    setState((prev) => ({
      ...prev,
      objectives: prev.objectives.map((o) =>
        o.id !== objId ? o : { ...o, keyResults: o.keyResults.filter((kr) => kr.id !== krId) }
      ),
    }));
  }, []);

  const updateKeyResult = useCallback((objId: string, krId: string, current: number) => {
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

  return (
    <AppContext.Provider
      value={{
        ...state,
        toggleTask,
        addTask,
        editTask,
        deleteTask,
        updateTaskStatus,
        updateKeyResult,
        addObjective,
        updateObjective,
        deleteObjective,
        addKeyResult,
        deleteKeyResult,
        getTeamTasks,
        getTeamProgress,
        getTeamStats,
        getTeamActivity,
        getTeamObjectives,
        getCompanyObjectives,
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
