import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, MapPin, X, SlidersHorizontal, Loader2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import JobCard from "@/components/JobCard";
import JobDetailSheet from "@/components/JobDetailSheet";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const WORKPLACES = ["Remote", "Hybrid", "On-site"];
const EXP = ["Entry", "Mid", "Senior", "Lead"];

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const { user } = useAuth();

  const q = params.get("q") || "";
  const location = params.get("location") || "";
  const type = params.get("type") || "";
  const workplace = params.get("workplace") || "";
  const experience = params.get("experience") || "";

  const filters = useMemo(
    () => ({ q, location, type, workplace, experience }),
    [q, location, type, workplace, experience]
  );

  useEffect(() => {
    let alive = true;
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/jobs", { params: filters });
        if (alive) setJobs(data);
      } catch (e) {
        if (alive) setJobs([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchJobs();
    return () => {
      alive = false;
    };
  }, [filters]);

  useEffect(() => {
    if (user && user !== false && user.role === "seeker") {
      Promise.all([
        api.get("/saved-jobs").then((r) => r.data).catch(() => []),
        api.get("/applications/me").then((r) => r.data).catch(() => []),
      ]).then(([s, a]) => {
        setSavedIds(new Set(s.map((x) => x.job_id)));
        setAppliedIds(new Set(a.map((x) => x.job_id)));
      });
    }
  }, [user]);

  const updateParam = (k, v) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const onSelect = (job) => {
    setSelected(job);
    setSheetOpen(true);
  };

  const onSave = async (job) => {
    if (!user || user === false) {
      toast.error("Sign in to save jobs");
      return;
    }
    if (user.role !== "seeker") {
      toast.error("Only job seekers can save jobs");
      return;
    }
    try {
      if (savedIds.has(job.id)) {
        await api.delete(`/saved-jobs/${job.id}`);
        setSavedIds((s) => {
          const n = new Set(s);
          n.delete(job.id);
          return n;
        });
        toast.success("Removed from saved");
      } else {
        await api.post(`/saved-jobs/${job.id}`);
        setSavedIds((s) => new Set(s).add(job.id));
        toast.success("Job saved");
      }
    } catch (e) {
      toast.error("Could not update saved jobs");
    }
  };

  const onApply = async (job) => {
    if (!user || user === false) {
      toast.error("Sign in to apply");
      return;
    }
    if (user.role !== "seeker") {
      toast.error("Only job seekers can apply");
      return;
    }
    try {
      await api.post("/applications", { job_id: job.id });
      setAppliedIds((s) => new Set(s).add(job.id));
      toast.success("Application submitted!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not apply");
    }
  };

  const activeChips = Object.entries(filters).filter(([, v]) => v);

  return (
    <PageShell>
      <section className="bg-[#0B1528] text-white">
        <div className="mx-auto max-w-7xl px-5 pt-12 pb-8 lg:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Find Jobs</div>
          <h1 className="font-display mt-2 text-4xl font-extrabold tracking-tight lg:text-5xl">
            {q ? `Results for “${q}”` : "Open roles across the fleet"}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            {jobs.length} role{jobs.length === 1 ? "" : "s"} matched. Refine using the filters on the left.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Filters */}
          <aside className="lg:col-span-3" data-testid="job-filters">
            <div className="sticky top-24 rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0B1528]">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </div>
                {activeChips.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold text-[#FF5959] hover:underline"
                    data-testid="clear-filters"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <Label>Keyword</Label>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#00B4D8]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => updateParam("q", e.target.value)}
                    placeholder="e.g. Designer"
                    data-testid="filter-keyword-input"
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Location</Label>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#00B4D8]">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <input
                    value={location}
                    onChange={(e) => updateParam("location", e.target.value)}
                    placeholder="City or Remote"
                    data-testid="filter-location-input"
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              <ChipGroup label="Type" value={type} options={TYPES} onChange={(v) => updateParam("type", v)} testid="filter-type" />
              <ChipGroup label="Workplace" value={workplace} options={WORKPLACES} onChange={(v) => updateParam("workplace", v)} testid="filter-workplace" />
              <ChipGroup label="Experience" value={experience} options={EXP} onChange={(v) => updateParam("experience", v)} testid="filter-experience" />
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-9">
            {activeChips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected:</span>
                {activeChips.map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => updateParam(k, "")}
                    data-testid={`chip-${k}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[#00B4D8]/40 bg-[#00B4D8]/10 px-2.5 py-1 text-xs font-semibold text-[#0077B6]"
                  >
                    {v}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex h-72 items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading jobs…
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState onReset={clearAll} />
            ) : (
              <div className="grid grid-cols-1 gap-4" data-testid="job-results">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    active={selected?.id === job.id && sheetOpen}
                    onClick={() => onSelect(job)}
                    onSave={onSave}
                    saved={savedIds.has(job.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <JobDetailSheet
        job={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onApply={onApply}
        applied={selected && appliedIds.has(selected.id)}
        onSave={onSave}
        saved={selected && savedIds.has(selected.id)}
        canApply={user && user !== false && user.role === "seeker"}
      />
    </PageShell>
  );
}

function Label({ children }) {
  return <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{children}</div>;
}

function ChipGroup({ label, value, options, onChange, testid }) {
  return (
    <div className="mt-4">
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              data-testid={`${testid}-${o.toLowerCase()}`}
              onClick={() => onChange(active ? "" : o)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                active
                  ? "border-[#0B1528] bg-[#0B1528] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#00B4D8]"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-12 text-center" data-testid="jobs-empty-state">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <h3 className="font-display mt-4 text-xl font-bold text-[#0B1528]">No jobs match your filters</h3>
      <p className="mt-2 text-sm text-slate-600">Try widening your filters or searching with different keywords.</p>
      <Button onClick={onReset} className="mt-5 bg-[#0B1528] text-white">
        Reset filters
      </Button>
      <div className="mt-3 text-xs text-slate-500">
        Or <Link to="/" className="font-semibold text-[#00B4D8] hover:underline">go back home</Link>
      </div>
    </div>
  );
}
