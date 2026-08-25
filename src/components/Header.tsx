import { useRef, useState } from "react";
import {
  Building2, ChevronDown, Download, Landmark, Moon, RotateCcw, Search, Sun, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { APP_NAME, APP_TAG, DISTRICTS } from "../constants";
import { useTeachers } from "../context/TeacherContext";

export default function Header() {
  const {
    board, setBoard, activeDistrict, setActiveDistrict,
    exportJson, exportCsv, importJson, resetData, metrics,
  } = useTeachers();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const fileRef = useRef<HTMLInputElement>(null);
  const total = metrics.find((m) => m.id === "total")?.value ?? 0;

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{APP_NAME}</p>
            <p className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:block">
              {APP_TAG}
            </p>
          </div>
        </div>

        <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setBoard("state")}
            className={`flex h-full items-center gap-1.5 px-3 text-xs font-semibold transition-colors ${
              board === "state"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Landmark className="h-3.5 w-3.5" strokeWidth={1.5} /> State Board
          </button>
          <button
            onClick={() => setBoard("local")}
            className={`flex h-full items-center gap-1.5 px-3 text-xs font-semibold transition-colors ${
              board === "local"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Local LGEA
          </button>
        </div>

        {board === "local" && (
          <div className="relative hidden md:block">
            <select
              value={activeDistrict}
              onChange={(e) => setActiveDistrict(e.target.value)}
              className="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All Local Districts</option>
              {DISTRICTS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === "light" ? <Moon className="h-4 w-4" strokeWidth={1.5} /> : <Sun className="h-4 w-4" strokeWidth={1.5} />}
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.5} /> Import
            </button>
            <button
              onClick={exportJson}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> JSON
            </button>
            <button
              onClick={exportCsv}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> CSV
            </button>
            <button
              onClick={resetData}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> Reset
            </button>
          </div>

          <div className="hidden h-9 items-center rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 lg:flex">
            {total} Teachers
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { importJson(f); e.target.value = ""; } else { toast.error("No file selected"); }
        }}
      />
    </header>
  );
}