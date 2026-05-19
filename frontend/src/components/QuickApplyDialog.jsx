import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, X, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

const INIT = {
  name: "",
  email: "",
  phone: "",
  current_role: "",
  experience_years: "",
  preferred_title: "",
  preferred_location: "",
  cover_note: "",
};

export default function QuickApplyDialog({ open, onOpenChange, jobId, jobTitle }) {
  const [form, setForm] = useState(INIT);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) {
      // reset shortly after close so the user sees confirmation first
      const t = setTimeout(() => {
        setSuccess(false);
        setForm(INIT);
        setFile(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const onFile = (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Resume must be 10MB or smaller");
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    onFile(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "" && v != null) fd.append(k, v);
    });
    if (jobId) fd.append("job_id", jobId);
    if (file) fd.append("resume", file);
    try {
      await api.post("/quick-apply", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      toast.success("Application submitted — we'll be in touch.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="quick-apply-dialog">
        {success ? (
          <SuccessState onClose={() => onOpenChange(false)} jobTitle={jobTitle} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-extrabold tracking-tight text-[#0B1528]">
                {jobTitle ? `Apply: ${jobTitle}` : "Apply to Jobsboats"}
              </DialogTitle>
              <DialogDescription>
                Fill in your details and upload a resume. We'll route your profile to matching openings.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full name *" id="qa-name">
                <Input
                  id="qa-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  data-testid="qa-name-input"
                />
              </Field>
              <Field label="Email *" id="qa-email">
                <Input
                  id="qa-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  data-testid="qa-email-input"
                />
              </Field>
              <Field label="Phone" id="qa-phone">
                <Input
                  id="qa-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  data-testid="qa-phone-input"
                />
              </Field>
              <Field label="Years of experience" id="qa-exp">
                <Select
                  value={form.experience_years}
                  onValueChange={(v) => setForm((f) => ({ ...f, experience_years: v }))}
                >
                  <SelectTrigger id="qa-exp" data-testid="qa-experience-trigger">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 — Fresher</SelectItem>
                    <SelectItem value="1">1 — 2 yrs</SelectItem>
                    <SelectItem value="3">3 — 5 yrs</SelectItem>
                    <SelectItem value="6">6 — 9 yrs</SelectItem>
                    <SelectItem value="10">10+ yrs</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Current role" id="qa-role">
                <Input
                  id="qa-role"
                  placeholder="e.g. Senior Backend Engineer"
                  value={form.current_role}
                  onChange={(e) => setForm((f) => ({ ...f, current_role: e.target.value }))}
                  data-testid="qa-current-role-input"
                />
              </Field>
              <Field label="Preferred title" id="qa-pref-title">
                <Input
                  id="qa-pref-title"
                  placeholder="e.g. Product Designer"
                  value={form.preferred_title}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_title: e.target.value }))}
                  data-testid="qa-preferred-title-input"
                />
              </Field>
              <Field label="Preferred location" id="qa-pref-loc" className="md:col-span-2">
                <Input
                  id="qa-pref-loc"
                  placeholder="Bengaluru / Remote / EU"
                  value={form.preferred_location}
                  onChange={(e) => setForm((f) => ({ ...f, preferred_location: e.target.value }))}
                  data-testid="qa-preferred-location-input"
                />
              </Field>

              <Field label="Cover note" id="qa-note" className="md:col-span-2">
                <Textarea
                  id="qa-note"
                  rows={3}
                  placeholder="A short pitch (optional)"
                  value={form.cover_note}
                  onChange={(e) => setForm((f) => ({ ...f, cover_note: e.target.value }))}
                  data-testid="qa-cover-note-input"
                />
              </Field>

              <div className="md:col-span-2">
                <Label className="text-sm font-bold text-[#0B1528]">Resume</Label>
                <label
                  htmlFor="qa-resume"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("border-[#00B4D8]");
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("border-[#00B4D8]")}
                  onDrop={onDrop}
                  className="mt-1.5 flex cursor-pointer items-center justify-between rounded-md border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-[#00B4D8]"
                  data-testid="qa-resume-dropzone"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-[#0B1528] text-white">
                      {file ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[#0B1528]">
                        {file ? file.name : "Drop your resume or click to browse"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {file
                          ? `${(file.size / 1024).toFixed(0)} KB · ${file.type || "file"}`
                          : "PDF, DOC, DOCX or TXT · max 10MB"}
                      </div>
                    </div>
                  </div>
                  {file ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-[#FF5959]"
                      data-testid="qa-remove-resume"
                      aria-label="Remove resume"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="rounded-md bg-[#00B4D8] px-3 py-1.5 text-xs font-bold text-white">
                      Choose file
                    </span>
                  )}
                  <input
                    id="qa-resume"
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => onFile(e.target.files?.[0])}
                    className="hidden"
                    data-testid="qa-resume-input"
                  />
                </label>
              </div>

              <DialogFooter className="md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#FF5959] text-white hover:bg-[#ff4040]"
                  data-testid="qa-submit-button"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit application
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, children, className }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm font-semibold text-[#0B1528]">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SuccessState({ onClose, jobTitle }) {
  return (
    <div className="flex flex-col items-center py-6 text-center" data-testid="qa-success">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h3 className="font-display mt-5 text-2xl font-extrabold text-[#0B1528]">You're in.</h3>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        We've received your application{jobTitle ? ` for ${jobTitle}` : ""}. Look out for a confirmation
        email — we'll surface matching openings to your inbox within 24 hours.
      </p>
      <Button onClick={onClose} className="mt-6 bg-[#0B1528] text-white">
        Done
      </Button>
    </div>
  );
}
