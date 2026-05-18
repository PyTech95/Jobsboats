import { Briefcase, MapPin, Building2, Clock } from "lucide-react";

export default function JobCard({ job, onClick, active, onSave, saved, hideSave }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`job-card-${job.id}`}
      className={`group relative w-full rounded-md border bg-white p-5 text-left transition ${
        active
          ? "border-[#00B4D8] shadow-[0_8px_30px_rgba(0,180,216,0.15)]"
          : "border-slate-200 hover:border-[#00B4D8] hover:shadow-[0_6px_24px_rgba(11,21,40,0.06)]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 flex-none place-items-center rounded-md bg-gradient-to-br from-[#0B1528] to-[#0077B6] font-display text-base font-black text-white">
          {job.company?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg font-extrabold leading-tight text-[#0B1528]">
                {job.title}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.type}</span>
              </div>
            </div>
            {!hideSave && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.(job);
                }}
                data-testid={`save-job-${job.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onSave?.(job);
                  }
                }}
                className={`flex-none cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  saved
                    ? "border-[#00B4D8] bg-[#00B4D8]/10 text-[#0077B6]"
                    : "border-slate-200 text-slate-600 hover:border-[#00B4D8] hover:text-[#0077B6]"
                }`}
              >
                {saved ? "Saved" : "Save"}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{job.workplace}</Badge>
            <Badge>{job.experience}</Badge>
            {(job.salary_min || job.salary_max) && (
              <Badge>
                {job.salary_min && job.salary_max
                  ? `$${(job.salary_min / 1000).toFixed(0)}k–$${(job.salary_max / 1000).toFixed(0)}k`
                  : "Competitive"}
              </Badge>
            )}
            {(job.tags || []).slice(0, 3).map((t) => (
              <Badge key={t} tone="ghost">{t}</Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Posted {timeAgo(job.posted_at)}
        </span>
        <span className="font-semibold text-[#00B4D8] opacity-0 transition group-hover:opacity-100">
          View details →
        </span>
      </div>
    </button>
  );
}

function Badge({ children, tone = "solid" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        tone === "ghost"
          ? "border border-slate-200 text-slate-600"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </span>
  );
}

function timeAgo(iso) {
  if (!iso) return "recently";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
