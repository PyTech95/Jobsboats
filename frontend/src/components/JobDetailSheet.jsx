import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building2, Globe, DollarSign } from "lucide-react";

export default function JobDetailSheet({ job, open, onOpenChange, onApply, applied, onSave, saved, canApply }) {
  if (!job) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl" data-testid="job-detail-sheet">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl font-extrabold text-[#0B1528]" data-testid="job-detail-title">
            {job.title}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-5">
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-md bg-gradient-to-br from-[#0B1528] to-[#0077B6] font-display text-xl font-black text-white">
              {job.company?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#0B1528]">{job.company}</div>
              <div className="text-sm text-slate-500">{job.location}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
            <KV icon={<Briefcase className="h-4 w-4" />} label="Type" value={job.type} />
            <KV icon={<Globe className="h-4 w-4" />} label="Workplace" value={job.workplace} />
            <KV icon={<Building2 className="h-4 w-4" />} label="Experience" value={job.experience} />
            <KV
              icon={<DollarSign className="h-4 w-4" />}
              label="Salary"
              value={
                job.salary_min && job.salary_max
                  ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`
                  : "Competitive"
              }
            />
            <KV icon={<MapPin className="h-4 w-4" />} label="Location" value={job.location} />
          </div>

          <div>
            <h4 className="font-display text-base font-bold text-[#0B1528]">About this role</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{job.description}</p>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div>
              <h4 className="font-display text-base font-bold text-[#0B1528]">Skills</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#00B4D8]/10 px-2.5 py-1 text-xs font-semibold text-[#0077B6]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 -mx-6 flex gap-2 border-t border-slate-200 bg-white px-6 py-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onSave?.(job)}
              data-testid="detail-save-button"
            >
              {saved ? "Saved" : "Save"}
            </Button>
            <Button
              className="flex-1 bg-[#FF5959] hover:bg-[#ff4040] text-white"
              onClick={() => onApply?.(job)}
              disabled={applied || !canApply}
              data-testid="detail-apply-button"
            >
              {applied ? "Applied" : canApply ? "Apply Now" : "Sign in to apply"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function KV({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#00B4D8]">{icon}</div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-[#0B1528]">{value}</div>
      </div>
    </div>
  );
}
