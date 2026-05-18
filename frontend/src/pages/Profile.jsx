import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import PageShell from "@/components/PageShell";
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
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Profile() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    headline: "",
    location: "",
    skills: "",
    profile_visibility: "public",
    resume_filename: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user === false) navigate("/login", { state: { from: "/profile" } });
  }, [user, navigate]);

  useEffect(() => {
    if (user && user !== false) {
      setForm({
        name: user.name || "",
        headline: user.headline || "",
        location: user.location || "",
        skills: (user.skills || []).join(", "),
        profile_visibility: user.profile_visibility || "public",
        resume_filename: user.resume_filename || "",
      });
    }
  }, [user]);

  if (!user || user === false) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/auth/profile", {
        name: form.name,
        headline: form.headline,
        location: form.location,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        profile_visibility: form.profile_visibility,
        resume_filename: form.resume_filename || null,
      });
      await refresh();
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    // We don't have a real upload bucket; just track filename for UX
    setForm((s) => ({ ...s, resume_filename: f.name }));
    toast.success(`Selected: ${f.name}`);
  };

  // completion
  const fields = ["name", "headline", "location", "skills", "resume_filename"];
  const done = fields.filter((k) => {
    const v = form[k];
    return Array.isArray(v) ? v.length > 0 : !!String(v || "").trim();
  }).length;
  const pct = Math.round((done / fields.length) * 100);

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-[#0B1528]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-display mt-4 text-4xl font-extrabold tracking-tight text-[#0B1528]">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Keep your profile fresh — recruiters notice.</p>

        <div className="mt-6 rounded-md border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profile completion</div>
              <div className="font-display mt-1 text-2xl font-extrabold text-[#0B1528]">{pct}%</div>
            </div>
            <Progress value={pct} className="h-2 w-1/2" />
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2" data-testid="profile-form">
          <div className="md:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5" data-testid="profile-name-input" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="e.g. Senior Product Designer · SaaS"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className="mt-1.5"
              data-testid="profile-headline-input"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="mt-1.5" data-testid="profile-location-input" />
          </div>
          <div>
            <Label htmlFor="visibility">Profile visibility</Label>
            <Select
              value={form.profile_visibility}
              onValueChange={(v) => setForm((f) => ({ ...f, profile_visibility: v }))}
            >
              <SelectTrigger className="mt-1.5" data-testid="profile-visibility-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public — visible to recruiters</SelectItem>
                <SelectItem value="private">Private — only when I apply</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="skills">Skills</Label>
            <Textarea
              id="skills"
              rows={3}
              placeholder="Figma, Design Systems, Prototyping"
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              className="mt-1.5"
              data-testid="profile-skills-input"
            />
            <p className="mt-1 text-xs text-slate-500">Comma separated.</p>
          </div>
          <div className="md:col-span-2">
            <Label>Resume</Label>
            <label
              htmlFor="resume"
              className="mt-1.5 flex cursor-pointer items-center justify-between rounded-md border-2 border-dashed border-slate-300 bg-slate-50 p-5 hover:border-[#00B4D8]"
              data-testid="resume-dropzone"
            >
              <div>
                <div className="text-sm font-semibold text-[#0B1528]">
                  {form.resume_filename || "Drop or click to upload (PDF, DOCX, max 5MB)"}
                </div>
                <div className="text-xs text-slate-500">We store only the filename in demo mode.</div>
              </div>
              <span className="rounded-md bg-[#0B1528] px-3 py-1.5 text-xs font-bold text-white">Choose file</span>
              <input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={onFile} className="hidden" />
            </label>
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-[#FF5959] hover:bg-[#ff4040] text-white" data-testid="profile-save-button">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save changes
            </Button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}
