import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitCompare, LayoutDashboard, Scale, UserRound } from "lucide-react";
import { Toaster } from "sonner";
import { APP_NAME, DISTRICTS } from "./constants";
import { useTeachers, TeacherProvider } from "./context/TeacherContext";
import Header from "./components/Header";
import TeacherRegistry from "./components/TeacherRegistry";
import PolicyAnalytics, { type Metric, type PtrRow } from "./components/PolicyAnalytics";
import PolicySimulator from "./components/PolicySimulator";

type Tab = "registry" | "analytics" | "simulator";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "registry", label: "Teacher Registry", icon: UserRound },
  { id: "analytics", label: "Policy Analytics", icon: LayoutDashboard },
  { id: "simulator", label: "Decision Simulator", icon: Scale },
];

function Shell() {
  const { teachers, board, activeDistrict, metrics } = useTeachers();
  const [tab, setTab] = useState<Tab>("registry");

  const scope = useMemo(() => teachers
    .filter((t) => (board === "local" && activeDistrict !== "all" ? t.district === activeDistrict : true)),
  [teachers, board, activeDistrict]);

  const ptrData: PtrRow[] = useMemo(() => {
    const ds = board === "local" && activeDistrict !== "all" ? DISTRICTS.filter((d) => d.name === activeDistrict) : DISTRICTS;
    return ds.map((d) => {
      const count = teachers.filter((t) => t.district === d.name).length;
      const ptr = count ? Math.round((d.enrollmentPupils / count) * 10) / 10 : Math.round((d.enrollmentPupils / d.teacherTarget) * 10) / 10;
      return { name: d.name.split(" ")[0], ptr, benchmark: 35, full: d.enrollmentPupils };
    });
  }, [teachers, board, activeDistrict]);

  const qualData = useMemo(() => {
    const c: Record<string, number> = {};
    scope.forEach((t) => { c[t.board] = (c[t.board] ?? 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [scope]);

  const shortageData = useMemo(() => {
    const counts: Record<string, number> = {};
    scope.forEach((t) => t.subjects.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; }));
    const ABSOLUTE = {
      "Special Education": 3, "Technical & Vocational": 3.5, "Early Childhood": 4, "Computer/ICT": 4,
      "Physics": 4.5, "Mathematics": 4.5, "Chemistry": 5, "Biology": 5.5,
      "English Language": 6, "Literature": 6.5, "Civic & Social": 7, "Agricultural Science": 7.5,
    };
    return Object.entries(ABSOLUTE).map(([subject, weight]) => {
      const staff = counts[subject] ?? 0;
      const target = scope.length * 0.12;
      const deficit = Math.max(0, Math.round(((target - staff) / target) * 100) + Math.round((5 - weight) * 6));
      return { subject, deficit: Math.min(90, deficit) };
    }).sort((a, b) => b.deficit - a.deficit);
  }, [scope]);

  const equityData = useMemo(() => {
    const ds = board === "local" && activeDistrict !== "all" ? DISTRICTS.filter((d) => d.name === activeDistrict) : DISTRICTS;
    const ruralWeight = { urban: 0.1, "semi-urban": 0.2, rural: 0.3 } as const;
    return ds.map((d) => {
      const t = teachers.filter((x) => x.district === d.name);
      const actual = t.length;
      const target = d.teacherTarget;
      const staffing = actual / Math.max(target, 1);
      const zoneGap = Math.round((1 - staffing) * 70 + ruralWeight[d.locality] * 100);
      return { zone: d.name, gap: Math.max(2, Math.min(40, zoneGap)) };
    });
  }, [teachers, board, activeDistrict]);

  const retirementData = useMemo(() => {
    const bucket = (min: number, max: number) => scope.filter((t) => t.age >= min && t.age < max).length;
    return [
      { year: "Current", teachers: Math.round(bucket(45, 50) * 0.35) },
      { year: "+1 yr", teachers: Math.round(bucket(46, 51) * 0.5) },
      { year: "+2 yr", teachers: Math.round(bucket(47, 52) * 0.65) },
      { year: "+3 yr", teachers: Math.round(bucket(48, 53) * 0.8) },
      { year: "+5 yr", teachers: Math.round(bucket(45, 54) * 0.9) },
    ];
  }, [scope]);

  const metricList: Metric[] = metrics;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />

      <nav className="sticky top-16 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}>
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {t.label}
                {active && <motion.span layoutId="tab-underline" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald-600" />}
              </button>
            );
          })}
          <div className="ml-auto hidden items-center pr-2 text-xs font-semibold text-slate-400 lg:flex">
            <GitCompare className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
            {board === "local" ? `LGEA · ${activeDistrict === "all" ? "All Districts" : activeDistrict}` : "State Educational Board"}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            {tab === "registry" && <TeacherRegistry />}
            {tab === "analytics" && <PolicyAnalytics metrics={metricList} ptrData={ptrData} qualData={qualData} shortageData={shortageData} equityData={equityData} retirementData={retirementData} />}
            {tab === "simulator" && <PolicySimulator />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mx-auto max-w-[1400px] px-4 pb-8 text-xs text-slate-400 sm:px-6">
        {APP_NAME} ensures policy decisions are anchored in live registry data. Supabase not connected: data persists locally in this browser.
      </footer>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <TeacherProvider>
      <Shell />
    </TeacherProvider>
  );
}