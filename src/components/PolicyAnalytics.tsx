import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export type Metric = { id: string; label: string; value: number; unit: string; target: number; trend: number };
export interface PtrRow { name: string; ptr: number; benchmark: number; full: number }

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function PolicyAnalytics({ metrics, ptrData, qualData, shortageData, equityData, retirementData }:
  { metrics: Metric[]; ptrData: PtrRow[]; qualData: { name: string; value: number }[];
    shortageData: { subject: string; deficit: number }[]; equityData: { zone: string; gap: number }[];
    retirementData: { year: string; teachers: number }[] }) {
  const qualColors = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];
  const shortageScores = useMemo(() => shortageData.map((s) => ({ subject: s.subject, value: Math.max(10, 100 - s.deficit) })), [shortageData]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Policy Analytics Hub</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Evidence base for teacher workforce planning across state and local boards.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{m.value}<span className="ml-1 text-xs font-medium text-slate-400">{m.unit}</span></p>
            <p className={`mt-1 text-[11px] font-semibold ${m.trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{m.trend >= 0 ? "▲" : "▼"} {Math.abs(m.trend)} vs benchmark</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pupil-Teacher Ratio by District" subtitle="vs UNESCO target 35:1">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ptrData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ptr" name="Actual PTR" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="benchmark" name="Target 35:1" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Qualification Distribution" subtitle="Credential tiers in active workforce">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={qualData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {qualData.map((_, i) => <Cell key={i} fill={qualColors[i % qualColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Critical Subject Shortage Index" subtitle="Higher = more acute deficit">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={shortageScores} outerRadius="75%">
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <Radar name="Capacity Index" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Equity Gap by Zone" subtitle="Teacher shortfall vs demand (%)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equityData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="zone" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="gap" name="Shortfall %" radius={[0, 4, 4, 0]}>
                  {equityData.map((d, i) => <Cell key={i} fill={d.gap > 15 ? "#e11d48" : d.gap > 8 ? "#f59e0b" : "#059669"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Projected Workforce Pipeline (Retirement Cliff)" subtitle="Teachers aged 45+ exiting system over next cycles">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={retirementData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="teachers" name="Exiting teachers" stroke="#f59e0b" fill="url(#gold)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}