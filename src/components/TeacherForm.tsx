import { useState } from "react";
import { ArrowRight, BadgeCheck, Clock, GraduationCap, MapPin, RefreshCcw, ShieldCheck, Ticket, TriangleAlert, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { DISTRICTS, QUALIFICATIONS, SUBJECTS } from "../constants";
import { daysUntil, useTeachers } from "../context/TeacherContext";
import type { Teacher, VerificationStatus } from "../types";

export const STATUS_META: Record<VerificationStatus, { label: string; cls: string; icon: "BadgeCheck" | "Clock" | "Ticket" | "TriangleAlert" | "RefreshCcw" }> = {
  verified: { label: "Verified & Active", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30", icon: "BadgeCheck" },
  under_review: { label: "Under Review", cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30", icon: "Clock" },
  provisional: { label: "Provisional License", cls: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30", icon: "Ticket" },
  expiring: { label: "Expiring Soon", cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30", icon: "TriangleAlert" },
  transferred: { label: "Transferred", cls: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30", icon: "RefreshCcw" },
};

export const inputCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const emptyForm = {
  name: "", gender: "F" as "F" | "M", age: 30, yearsExperience: 5, board: "B.Ed" as Teacher["board"],
  teacherId: "", district: DISTRICTS[0].name, school: "", locality: "urban" as "urban" | "rural" | "semi-urban",
  subjects: [] as string[], status: "provisional" as VerificationStatus,
  licenseExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  cpdCredits: 0, verifiedDate: null, lastReview: null, notes: "",
};

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return <div className={span ? "col-span-2" : ""}><label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>{children}</label></div>;
}

export function TeacherForm({ initial, onSave, onClose }: { initial: Teacher | null; onSave: (t: Omit<Teacher, "id">) => void; onClose: () => void }) {
  const [form, setForm] = useState(() => (initial ? { ...initial, licenseExpiry: initial.licenseExpiry.slice(0, 10) } : emptyForm));
  const set = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) => setForm((p) => ({ ...p, [k]: v }));
  const toggleSubject = (s: string) => setForm((p) => ({ ...p, subjects: p.subjects.includes(s) ? p.subjects.filter((x) => x !== s) : [...p.subjects, s] }));

  const save = () => {
    if (!form.name.trim() || !form.teacherId.trim() || !form.school.trim()) {
      toast.error("Please fill required fields: name, Teacher ID, school");
      return;
    }
    onSave({ ...form, licenseExpiry: new Date(form.licenseExpiry).toISOString() });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field span label="Full Name *"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Aisha Bello" /></Field>
        <Field label="Gender"><select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value as "F" | "M")}><option>F</option><option>M</option></select></Field>
        <Field label="Age"><input type="number" className={inputCls} value={form.age} onChange={(e) => set("age", +e.target.value)} /></Field>
        <Field label="Years Experience"><input type="number" className={inputCls} value={form.yearsExperience} onChange={(e) => set("yearsExperience", +e.target.value)} /></Field>
        <Field label="Qualification"><select className={inputCls} value={form.board} onChange={(e) => set("board", e.target.value as Teacher["board"])}>{QUALIFICATIONS.map((q) => <option key={q}>{q}</option>)}</select></Field>
        <Field span label="Teacher / TRCN ID *"><input className={inputCls} value={form.teacherId} onChange={(e) => set("teacherId", e.target.value)} placeholder="e.g. TRCN-2021-0014" /></Field>
        <Field label="District"><select className={inputCls} value={form.district} onChange={(e) => set("district", e.target.value)}>{DISTRICTS.map((d) => <option key={d.id}>{d.name}</option>)}</select></Field>
        <Field label="Locality"><select className={inputCls} value={form.locality} onChange={(e) => set("locality", e.target.value as Teacher["locality"])}><option>urban</option><option>semi-urban</option><option>rural</option></select></Field>
        <Field span label="School *"><input className={inputCls} value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="e.g. Central Model Primary" /></Field>
        <Field span label="License Expiry"><input type="date" className={inputCls} value={form.licenseExpiry} onChange={(e) => set("licenseExpiry", e.target.value)} /></Field>
      </div>
      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Subjects</span>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECTS.map((s) => (
            <button key={s} type="button" onClick={() => toggleSubject(s)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${form.subjects.includes(s) ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
        <button onClick={save} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]">
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} /> {initial ? "Save Changes" : "Register"}
        </button>
      </div>
    </div>
  );
}

const ICONS = { BadgeCheck, Clock, Ticket, TriangleAlert, RefreshCcw, ShieldCheck, GraduationCap, MapPin, UserRound } as const;

export function DetailDrawer({ teacher: t, onClose }: { teacher: Teacher; onClose: () => void }) {
  const { logs, setStatus } = useTeachers();
  const dl = daysUntil(t.licenseExpiry);
  const tLogs = logs.filter((l) => l.teacherId === t.id);
  const [note, setNote] = useState("");

  const setSt = (s: VerificationStatus) => {
    const n = note || (s === "under_review" ? "Flagged for document review" : "");
    setStatus(t.id, s, "Registry Officer", n);
    toast.success(`Updated to ${s.replace("_", " ")}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800"><UserRound className="h-6 w-6" strokeWidth={1.5} /></div>
              <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.name}</h3><p className="text-xs text-slate-400">{t.teacherId} · {t.board} · {t.gender}</p></div>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" strokeWidth={1.5} /></button>
          </div>
          <div className="mt-3"><SBgn status={t.status} /></div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <IconRow icon="MapPin" label="School" value={t.school} />
            <IconRow icon="ShieldCheck" label="District" value={t.district} />
            <IconRow icon="MapPin" label="Locality" value={t.locality} />
            <IconRow icon="GraduationCap" label="Experience" value={`${t.yearsExperience} yrs (age ${t.age})`} />
            <IconRow icon="GraduationCap" label="Qualification" value={t.board} />
            <IconRow icon="Ticket" label="License expiry" value={`${t.licenseExpiry.slice(0, 10)} (${dl}d)`} />
            <IconRow icon="BadgeCheck" label="CPD credits" value={`${t.cpdCredits} hrs`} />
            <IconRow icon="ShieldCheck" label="Verified" value={t.verifiedDate ? t.verifiedDate.slice(0, 10) : "Not yet"} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Teaching Subjects</p>
            <div className="flex flex-wrap gap-1.5">{t.subjects.map((s) => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}</span>)}</div>
          </div>
          {t.notes && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Note: {t.notes}</p>}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Workflow Action</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for this transition" className="h-16 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <ActionBtn onClick={() => setSt("verified")} cls="bg-emerald-600 hover:bg-emerald-700 text-white"><BadgeCheck className="h-4 w-4" strokeWidth={1.5} /> Approve & Verify</ActionBtn>
              <ActionBtn onClick={() => setSt("under_review")} cls="bg-amber-500 hover:bg-amber-600 text-white"><Clock className="h-4 w-4" strokeWidth={1.5} /> Flag Review</ActionBtn>
              <ActionBtn onClick={() => setSt("provisional")} cls="bg-sky-500 hover:bg-sky-600 text-white"><Ticket className="h-4 w-4" strokeWidth={1.5} /> Grant Provisional</ActionBtn>
              <ActionBtn onClick={() => setSt("expiring")} cls="bg-rose-500 hover:bg-rose-600 text-white"><TriangleAlert className="h-4 w-4" strokeWidth={1.5} /> Mark Expiring</ActionBtn>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Audit Trail</p>
            {tLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No recorded actions for this record.</p>
            ) : (
              <div className="space-y-2">
                {tLogs.slice(0, 6).map((l) => (
                  <div key={l.id} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                    <RefreshCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.5} />
                    <div className="text-xs">
                      <p className="font-semibold capitalize text-slate-700 dark:text-slate-200">{l.action.replace("_", " ")} <span className="font-normal text-slate-400">by {l.actor}</span></p>
                      <p className="text-[10px] text-slate-400">{new Date(l.timestamp).toLocaleString()} {l.note && `· ${l.note}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SBgn({ status }: { status: VerificationStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${m.cls}`}>{m.label}</span>;
}

function IconRow({ icon, label, value }: { icon: keyof typeof ICONS; label: string; value: string }) {
  const Icon = ICONS[icon];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-2 dark:border-slate-800">
      <Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{value}</p></div>
    </div>
  );
}

function ActionBtn({ children, onClick, cls }: { children: React.ReactNode; onClick: () => void; cls: string }) {
  return <button onClick={onClick} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition active:scale-[0.98] ${cls}`}>{children}</button>;
}

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return <SBgn status={status} />;
}