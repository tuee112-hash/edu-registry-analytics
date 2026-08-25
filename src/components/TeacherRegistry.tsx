import { useMemo, useState } from "react";
import { Filter, Pencil, Plus, Search, UserRound, X } from "lucide-react";
import { QUALIFICATIONS } from "../constants";
import { daysUntil, useTeachers } from "../context/TeacherContext";
import type { Teacher, VerificationStatus } from "../types";
import { DetailDrawer, STATUS_META, TeacherForm } from "./TeacherForm";

const STATUS_KEYS: VerificationStatus[] = ["verified", "under_review", "provisional", "expiring", "transferred"];

export default function TeacherRegistry() {
  const { teachers, board, activeDistrict, addTeacher, updateTeacher, deleteTeacher } = useTeachers();
  const [query, setQuery] = useState("");
  const [dist, setDist] = useState("all");
  const [subj, setSubj] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [qual, setQual] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [detail, setDetail] = useState<Teacher | null>(null);

  const districts = useMemo(() => Array.from(new Set(teachers.map((t) => t.district))), [teachers]);
  const subjects = useMemo(() => Array.from(new Set(teachers.flatMap((t) => t.subjects))), [teachers]);

  const filtered = useMemo(() => teachers
    .filter((t) => (board === "local" && activeDistrict !== "all" ? t.district === activeDistrict : true))
    .filter((t) => (dist === "all" ? true : t.district === dist))
    .filter((t) => (subj === "all" ? true : t.subjects.includes(subj)))
    .filter((t) => (statusF === "all" ? true : t.status === statusF))
    .filter((t) => (qual === "all" ? true : t.board === qual))
    .filter((t) => (query ? `${t.name} ${t.teacherId}`.toLowerCase().includes(query.toLowerCase()) : true)),
  [teachers, board, activeDistrict, dist, subj, statusF, qual, query]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach((t) => { c[t.status] = (c[t.status] ?? 0) + 1; });
    return c;
  }, [filtered]);

  const hasFilters = query || dist !== "all" || subj !== "all" || statusF !== "all" || qual !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Teacher Registry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Credential lifecycle, verification workflow and posting management.</p>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]">
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Register Teacher
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {STATUS_KEYS.map((s) => {
          const m = STATUS_META[s];
          return (
            <div key={s} className={`rounded-xl px-3 py-2.5 ring-1 ${m.cls}`}>
              <p className="text-xl font-bold leading-none">{statusCounts[s] ?? 0}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wide opacity-80">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-3 h-4 w-4 text-slate-400" strokeWidth={1.5} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or Teacher ID..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-transparent pl-9 pr-8 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:text-slate-100" />
          {query && <X className="absolute right-2.5 top-3 h-4 w-4 cursor-pointer text-slate-400" strokeWidth={1.5} />}
        </div>
        <Select value={dist} onChange={setDist} options={districts} label="District" />
        <Select value={subj} onChange={setSubj} options={subjects} label="Subject" />
        <Select value={statusF} onChange={setStatusF} options={Object.keys(STATUS_META)} label="Status" />
        <Select value={qual} onChange={setQual} options={Array.from(QUALIFICATIONS)} label="Qualification" />
        {hasFilters && (
          <button onClick={() => { setQuery(""); setDist("all"); setSubj("all"); setStatusF("all"); setQual("all"); }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
            <Filter className="h-3.5 w-3.5" strokeWidth={1.5} /> Clear
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">District / School</th>
                <th className="px-4 py-3">Subjects</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t) => {
                const dl = daysUntil(t.licenseExpiry);
                return (
                  <tr key={t.id} onClick={() => setDetail(t)}
                    className="cursor-pointer text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800"><UserRound className="h-4 w-4" strokeWidth={1.5} /></div>
                        <div><p className="font-semibold text-slate-900 dark:text-white">{t.name}</p><p className="text-xs text-slate-400">{t.teacherId} · {t.board}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><p className="font-medium">{t.district}</p><p className="text-xs text-slate-400">{t.school}</p></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.subjects.slice(0, 2).map((s) => (
                          <span key={s + t.id} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}</span>
                        ))}
                        {t.subjects.length > 2 && <span className="text-[10px] text-slate-400">+{t.subjects.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${dl < 0 ? "text-rose-600" : dl < 90 ? "text-amber-600" : "text-slate-500"}`}>{dl < 0 ? "Expired" : `${dl}d`}</p>
                      <p className="text-xs text-slate-400">{new Date(t.licenseExpiry).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Edit" onClick={(e) => { e.stopPropagation(); setEditing(t); setFormOpen(true); }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><Pencil className="h-4 w-4" strokeWidth={1.5} /></button>
                        <button title="Delete" onClick={(e) => { e.stopPropagation(); deleteTeacher(t.id); }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"><X className="h-4 w-4" strokeWidth={1.5} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Search className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            <p className="font-semibold text-slate-700 dark:text-slate-200">No teachers match your filters</p>
            <p className="text-sm text-slate-400">Adjust or clear the filters to see results.</p>
          </div>
        )}
      </div>

      {detail && <DetailDrawer teacher={detail} onClose={() => setDetail(null)} />}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button onClick={() => setFormOpen(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" strokeWidth={1.5} /></button>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{editing ? "Edit Teacher" : "Register New Teacher"}</h2>
            <div className="mt-4">
              <TeacherForm initial={editing} onClose={() => setFormOpen(false)} onSave={(data) => {
                if (editing) updateTeacher(editing.id, data); else addTeacher(data);
                setFormOpen(false);
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: VerificationStatus }) {
  const m = STATUS_META[status];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${m.cls}`}>{m.label}</span>;
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium capitalize text-slate-700 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <option value="all">All {label}s</option>
      {options.map((o) => <option key={`${label}-${o}`} value={o}>{o}</option>)}
    </select>
  );
}