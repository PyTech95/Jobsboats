import { Search, MapPin, Filter, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const WORKPLACES = ["Remote", "Hybrid", "On-site"];
const EXP = ["Entry", "Mid", "Senior", "Lead"];

export default function HeroSearch({ embedded = false }) {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [filters, setFilters] = useState({ type: "", workplace: "", experience: "" });
  const navigate = useNavigate();

  const updateFilter = (k, v) => setFilters((f) => ({ ...f, [k]: f[k] === v ? "" : v }));
  const activeChips = Object.entries(filters).filter(([, v]) => v);

  const onSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (loc) params.set("location", loc);
    if (filters.type) params.set("type", filters.type);
    if (filters.workplace) params.set("workplace", filters.workplace);
    if (filters.experience) params.set("experience", filters.experience);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      data-testid="hero-search-form"
      className={`relative w-full rounded-lg border border-slate-200 bg-white shadow-[0_20px_60px_rgba(11,21,40,0.18)] ${
        embedded ? "p-3" : "p-3 sm:p-4"
      }`}
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="md:col-span-5 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#00B4D8]">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Job title, skill or company"
            data-testid="hero-search-keyword"
            className="w-full bg-transparent text-base text-[#0B1528] placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <div className="md:col-span-4 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#00B4D8]">
          <MapPin className="h-5 w-5 text-slate-400" />
          <input
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            placeholder="City, country or 'Remote'"
            data-testid="hero-search-location"
            className="w-full bg-transparent text-base text-[#0B1528] placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          data-testid="hero-search-submit"
          className="md:col-span-3 inline-flex items-center justify-center gap-2 rounded-md bg-[#FF5959] px-5 py-3 text-base font-bold text-white transition hover:bg-[#ff4040]"
        >
          <Search className="h-4 w-4" /> Start Job Search
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Filter className="h-3.5 w-3.5" /> Smart filters
        </div>
        <FilterGroup label="Type" options={TYPES} value={filters.type} onChange={(v) => updateFilter("type", v)} testid="filter-type" />
        <FilterGroup label="Workplace" options={WORKPLACES} value={filters.workplace} onChange={(v) => updateFilter("workplace", v)} testid="filter-workplace" />
        <FilterGroup label="Experience" options={EXP} value={filters.experience} onChange={(v) => updateFilter("experience", v)} testid="filter-experience" />
      </div>

      {activeChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Selected:</span>
          {activeChips.map(([k, v]) => (
            <button
              type="button"
              key={k}
              onClick={() => updateFilter(k, v)}
              data-testid={`chip-${k}`}
              className="inline-flex items-center gap-1 rounded-full border border-[#00B4D8]/40 bg-[#00B4D8]/10 px-2.5 py-1 text-xs font-semibold text-[#0077B6]"
            >
              {v}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

function FilterGroup({ label, options, value, onChange, testid }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-slate-500">{label}:</span>
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            data-testid={`${testid}-${o.toLowerCase()}`}
            onClick={() => onChange(o)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
              active
                ? "border-[#0B1528] bg-[#0B1528] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#00B4D8] hover:text-[#0B1528]"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
