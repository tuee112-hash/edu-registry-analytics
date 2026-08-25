import { useMemo, useState } from "react";
import { Download, Lightbulb, Printer, Scale, Target } from "lucide-react";
import { toast } from "sonner";
import { SCENARIO_PRESETS } from "../constants";
import { useTeachers } from "../context/TeacherContext";
import type { SimScenario } from "../types";
import type { Metric } from "./PolicyAnalytics";

const SLIDERS: { key: keyof SimScenario; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: "hardshipAllowance", label: "Rural Hardship Allowance", min: 0, max: 25, step: 1, unit: "%" },
  { key: "stemQuota", label: "STEM Fast-track Licensure", min: 5, max: 50, step: 1, unit: "% quota" },
  { key: "cpdHours", label: "Mandatory CPD Hours", min: 10, max: 50, step: 1, unit: "hrs" },
  { key: "earlyRetire", label: "Early Retirement Factor", min: 0, max: 20, step: 1, unit: "%" },
  { key: "ruralIncentive", label: "Rural Posting Incentive", min: 0, max: 5000, step: 100, unit: "USD" },
];

export default function PolicySimulator() {
  const { simRun } = useTeachers();
  const [scenario, setScenario] = useState<SimScenario>({
    id: "baseline", name: "Baseline", hardshipAllowance: 5, stemQuota: 18, cpdHours: 20, earlyRetire: 8, ruralIncentive: 1200, budget: 0,
  });

  const results = useMemo(() => simRun(scenario), [simRun, scenario]);

  const set = (key: keyof SimScenario, v: number) => setScenario((p) => ({ ...p, [key]: v }));

  const applyPreset = (id: string) => {
    const p = SCENARIO_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setScenario({ ...p, id: p.id, name: p.name, budget: 0 });
    toast.success(`Applied scenario: ${p.name}`);
  };

  const downloadBrief = () => {
    const lines = [
      `EDUREG ANALYTICS - POLICY BRIEFING DOCUMENT`,
      `Scenario: ${scenario.name}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      ...SLIDERS.map((s) => `${s.label}: ${scenario[s.key]}${s.unit}`),
      ``,
      ...results.map((r) => `${r.label}: ${r.value} ${r.unit}`),
      ``,
      `Recommendation: Adjust parameters iteratively and review retention & equity impacts quarterly.`,
    ];
    const blob = new Blob([lines.join(String.fromCharCode(10))], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy-brief-${scenario.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Policy briefing downloaded");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Policy Decision Simulator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">What-if sandbox for ministers, education planners and board members.</p>
        </div>
        <button onClick={downloadBrief}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
          <Download className="h-4 w-4" strokeWidth={1.5} /> Download Policy Brief
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCENARIO_PRESETS.map((p) => (
          <button key={p.id} onClick={() => applyPreset(p.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${scenario.id === p.id ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"}`}>
            <Lightbulb className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.5} />{p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scenario Controls</h3>
          </div>
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.label}</label>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">
                  {scenario[s.key]}{s.unit}
                </span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={scenario[s.key]}
                onChange={(e) => set(s.key, +e.target.value)}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600 dark:bg-slate-700" />
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Move sliders to recalculate projected workforce outcomes in real time.</p>
        </div>

        <div className="space-y-3 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {results.map((m: Metric) => (
              <div key={m.id} className={`rounded-xl p-3 ring-1 ${m.id === "budget" ? "bg-slate-900 text-white ring-slate-900 dark:bg-slate-800 dark:ring-slate-700" : "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"}`}>
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-70"><Target className="h-3 w-3" strokeWidth={1.5} />{m.label}</p>
                <p className={`mt-1 text-2xl font-bold ${m.id === "budget" ? "text-white" : "text-slate-900 dark:text-white"}`}>{m.value}<span className="ml-1 text-xs font-medium opacity-60">{m.unit}</span></p>
                {m.id !== "budget" && (
                  <p className={`mt-1 text-[11px] font-semibold ${m.trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {m.trend >= 0 ? "▲" : "▼"} {Math.abs(m.trend)} vs baseline
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><Printer className="h-4 w-4" strokeWidth={1.5} /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Policy Memo Preview</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Under the <span className="font-semibold text-emerald-700 dark:text-emerald-400">{scenario.name}</span> scenario, projected
                  pupil-teacher ratio settles at <span className="font-semibold">{(results.find((r) => r.id === "ptr") as Metric)?.value}:1</span> (target 35:1),
                  with estimated retention of <span className="font-semibold">{(results.find((r) => r.id === "retention") as Metric)?.value}%</span>.
                  The STEM fast-track quota reaches <span className="font-semibold">{(results.find((r) => r.id === "stem") as Metric)?.value}%</span> of new hires,
                  closing the equity gap by <span className="font-semibold">{(results.find((r) => r.id === "equity") as Metric)?.value}%</span>.
                  Estimated annual budget requirement is <span className="font-semibold">${(results.find((r) => r.id === "budget") as Metric)?.value}K</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <strong>Policy insight:</strong> Hardship allowance above 15% and STEM quota near 35% together project the strongest retention-equity trade-off. Pair mandatory CPD with rural incentives to avoid overloading already-short rural postings.
          </div>
        </div>
      </div>
    </div>
  );
}