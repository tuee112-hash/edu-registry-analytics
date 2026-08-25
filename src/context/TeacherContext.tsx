import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { toast } from "sonner";
import type {
  AuditLogEntry, BoardLevel, PolicyMetric, SimScenario, Teacher, VerificationStatus,
} from "../types";
import { DISTRICTS, SEED_TEACHERS } from "../constants";

const TEACHERS_KEY = "edureg_teachers_v1";
const LOGS_KEY = "edureg_logs_v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface TeacherContextValue {
  teachers: Teacher[];
  logs: AuditLogEntry[];
  board: BoardLevel;
  activeDistrict: string;
  setBoard: (b: BoardLevel) => void;
  setActiveDistrict: (d: string) => void;
  addTeacher: (t: Omit<Teacher, "id">) => void;
  updateTeacher: (id: string, patch: Partial<Teacher>) => void;
  setStatus: (id: string, status: VerificationStatus, actor: string, note?: string) => void;
  deleteTeacher: (id: string) => void;
  exportJson: () => void;
  exportCsv: () => void;
  importJson: (file: File) => void;
  resetData: () => void;
  metrics: PolicyMetric[];
  simRun: (s: SimScenario) => PolicyMetric[];
}

const TeacherContext = createContext<TeacherContextValue | null>(null);

export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>(() =>
    load<Teacher[]>(TEACHERS_KEY, SEED_TEACHERS),
  );
  const [logs, setLogs] = useState<AuditLogEntry[]>(() =>
    load<AuditLogEntry[]>(LOGS_KEY, []),
  );
  const [board, setBoard] = useState<BoardLevel>("state");
  const [activeDistrict, setActiveDistrict] = useState<string>("all");

  useEffect(() => { localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem(LOGS_KEY, JSON.stringify(logs)); }, [logs]);

  const pushLog = useCallback((
    teacherId: string, teacherName: string, action: AuditLogEntry["action"], actor: string, note = "",
  ) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), teacherId, teacherName, action, actor, timestamp: new Date().toISOString(), note },
      ...prev,
    ].slice(0, 200));
  }, []);

  const addTeacher = useCallback((t: Omit<Teacher, "id">) => {
    const full = { ...t, id: crypto.randomUUID() };
    setTeachers((prev) => [full, ...prev]);
    pushLog(full.id, full.name, "created", "Registry Officer");
    toast.success("Teacher registered", { description: t.name });
  }, [pushLog]);

  const updateTeacher = useCallback((id: string, patch: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const name = teachers.find((t) => t.id === id)?.name ?? "Teacher";
    pushLog(id, name, "updated", "Registry Officer");
  }, [teachers, pushLog]);

  const setStatus = useCallback((
    id: string, status: VerificationStatus, actor: string, note = "",
  ) => {
    setTeachers((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const now = new Date().toISOString();
      return {
        ...t, status, lastReview: now,
        verifiedDate: status === "verified" ? now : t.verifiedDate,
        notes: note ? `${t.notes} ${note}`.trim() : t.notes,
      };
    }));
    const name = teachers.find((t) => t.id === id)?.name ?? "Teacher";
    pushLog(id, name, status, actor, note);
    toast.success(`Status updated to ${status.replace("_", " ")}`, { description: name });
  }, [teachers, pushLog]);

  const deleteTeacher = useCallback((id: string) => {
    const name = teachers.find((t) => t.id === id)?.name ?? "Teacher";
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    pushLog(id, name, "updated", "Registry Officer", "Record deleted");
    toast.success("Record removed", { description: name });
  }, [teachers, pushLog]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(teachers, null, 2)], { type: "application/json" });
    download(blob, "edureg-teachers.json");
    toast.success("JSON export downloaded");
  }, [teachers]);

  const exportCsv = useCallback(() => {
    const cols = ["name", "teacherId", "district", "school", "subjects", "status", "board", "yearsExperience", "cpdCredits", "licenseExpiry"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = teachers.map((t) => cols.map((c) => esc((t as unknown as Record<string, unknown>)[c])).join(","));
    const csv = [cols.join(","), ...rows].join(String.fromCharCode(10));
    download(new Blob([csv], { type: "text/csv" }), "edureg-teachers.csv");
    toast.success("CSV export downloaded");
  }, [teachers]);

  const importJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        const mapped = parsed.map((t) => ({ ...SEED_TEACHERS[0], ...t, id: crypto.randomUUID() }));
        setTeachers((prev) => [...mapped, ...prev]);
        toast.success(`Imported ${mapped.length} records`);
      } catch (e) {
        toast.error("Import failed", { description: e instanceof Error ? e.message : "Bad file" });
      }
    };
    reader.readAsText(file);
  }, []);

  const resetData = useCallback(() => {
    setTeachers(SEED_TEACHERS);
    setLogs([]);
    toast.success("Reset to baseline dataset");
  }, []);

  const scopeTeachers = useMemo(() => {
    if (board === "local" && activeDistrict !== "all") {
      return teachers.filter((t) => t.district === activeDistrict);
    }
    return teachers;
  }, [teachers, board, activeDistrict]);

  const metrics = useMemo<PolicyMetric[]>(() => {
    return computeMetrics(scopeTeachers);
  }, [scopeTeachers]);

  const simRun = useCallback((s: SimScenario): PolicyMetric[] => {
    const t = scopeTeachers;
    const districts = board === "local" && activeDistrict !== "all"
      ? DISTRICTS.filter((d) => d.name === activeDistrict)
      : DISTRICTS;
    const teachersCount = t.length || Math.round(districts.reduce((a, d) => a + d.teacherTarget, 0) * 0.86);
    const pupils = districts.reduce((a, d) => a + d.enrollmentPupils, 0);
    const ptr = pupils / Math.max(teachersCount, 1);
    const gold = s.hardshipAllowance > 10 ? 9 : 66 + (s.ruralIncentive / 1500) * 34;
    const retention = Math.max(48, 82 - s.earlyRetire * 1.5 + s.hardshipAllowance * 0.35);
    const stemRate = 22 + (s.stemQuota - 18) * 0.9;
    const budget = Math.round((s.ruralIncentive * 0.4 * teachersCount + s.stemQuota * 14000 + s.cpdHours * 5200) / 1000);
    return [
      { id: "ptr", label: "Projected PTR", value: +ptr.toFixed(1), unit: ":1 (target 35)", target: 35, trend: +(35 - ptr).toFixed(1) },
      { id: "retention", label: "Projected Retention", value: +retention.toFixed(1), unit: "%", target: 85, trend: +(retention - 82).toFixed(1) },
      { id: "stem", label: "STEM Fast-track Hires", value: +stemRate.toFixed(1), unit: "%", target: 30, trend: +(stemRate - 22).toFixed(1) },
      { id: "equity", label: "Equity Gap Index", value: +gold.toFixed(1), unit: "% closed", target: 100, trend: +(gold - 66).toFixed(1) },
      { id: "budget", label: "Estimated Budget", value: budget, unit: "K USD", target: budget, trend: 0 },
    ];
  }, [scopeTeachers, board, activeDistrict]);

  const value: TeacherContextValue = {
    teachers, logs, board, activeDistrict, setBoard, setActiveDistrict,
    addTeacher, updateTeacher, setStatus, deleteTeacher,
    exportJson, exportCsv, importJson, resetData, metrics, simRun,
  };

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>;
}

export function useTeachers() {
  const ctx = useContext(TeacherContext);
  if (!ctx) throw new Error("useTeachers must be used within TeacherProvider");
  return ctx;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function computeMetrics(teachers: Teacher[]): PolicyMetric[] {
  const t = teachers;
  const years = t.reduce((a, x) => a + x.yearsExperience, 0);
  const avgExp = t.length ? years / t.length : 0;
  const expiring = t.filter((x) => x.status === "expiring" || daysUntil(x.licenseExpiry) < 90).length;
  const verified = t.filter((x) => x.status === "verified").length;
  const incExp = t.filter((x) => x.age >= 45).length;
  return [
    { id: "total", label: "Registered Teachers", value: t.length, unit: "records", target: 100, trend: 6 },
    { id: "verified", label: "Credential Verified", value: t.length ? Math.round((verified / t.length) * 1000) / 10 : 0, unit: "%", target: 90, trend: 4 },
    { id: "expiring", label: "Licenses < 90 days", value: expiring, unit: "alerts", target: 0, trend: -12 },
    { id: "exp", label: "Avg Experience", value: +avgExp.toFixed(1), unit: "yrs", target: 10, trend: 2 },
    { id: "retire", label: "Retirement Cliff (3-5y)", value: incExp, unit: "teachers", target: 0, trend: 18 },
  ];
}

export function daysUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}