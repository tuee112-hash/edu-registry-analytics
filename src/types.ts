export type BoardLevel = "state" | "local";

export type VerificationStatus =
  | "verified"
  | "under_review"
  | "provisional"
  | "expiring"
  | "transferred";

export type TeacherQualification = "B.Ed" | "PGDE" | "M.Ed" | "NCE" | "PhD";

export interface Teacher {
  id: string;
  name: string;
  gender: "F" | "M";
  age: number;
  yearsExperience: number;
  board: TeacherQualification;
  teacherId: string; // TRCN / State Teacher ID
  district: string;
  school: string;
  locality: "urban" | "rural" | "semi-urban";
  subjects: string[];
  status: VerificationStatus;
  licenseExpiry: string; // ISO date
  cpdCredits: number;
  verifiedDate: string | null;
  lastReview: string | null;
  notes: string;
}

export interface District {
  id: string;
  name: string;
  zone: string;
  locality: "urban" | "rural" | "semi-urban";
  schools: number;
  enrollmentPupils: number;
  teacherTarget: number;
}

export interface PolicyMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  trend: number; // % change
}

export interface ScenarioPreset {
  id: string;
  name: string;
  desc: string;
  hardshipAllowance: number;
  stemQuota: number;
  cpdHours: number;
  earlyRetire: number;
  ruralIncentive: number;
}

export type AuditAction =
  | "verified"
  | "under_review"
  | "provisional"
  | "expiring"
  | "transferred"
  | "created"
  | "updated";

export interface AuditLogEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  action: AuditAction;
  actor: string;
  timestamp: string;
  note: string;
}

export interface SimScenario {
  id: string;
  name: string;
  hardshipAllowance: number; // %
  stemQuota: number; // % of new hires
  cpdHours: number;
  earlyRetire: number; // % retention hit from early retirement
  ruralIncentive: number; // USD
  budget: number; // estimated USD
}