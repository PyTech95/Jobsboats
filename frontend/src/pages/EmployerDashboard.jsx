import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const STAGES = [
  { key: "new", label: "New", color: "bg-slate-100" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-[#00B4D8]/10" },
  { key: "interview", label: "Interview", color: "bg-amber-50" },
  { key: "offered", label: "Offered", color: "bg-emerald-50" },
  { key: "hired", label: "Hired", color: "bg-[#0B1528] text-white" },
];

const STAGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offered", label: "Offered" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Closed" },
];

export default function EmployerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPost, setOpenPost] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: user?.company || "",
    location: "",
    type: "Full-time",
    workplace: "Remote",
    experience: "Mid",
    salary_min: "",
    salary_max: "",
    description: "",
    tags: "",
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (user === false) navigate("/login", { state: { from: "/employer" } });
    if (user && user !== false && user.role !== "employer") navigate("/dashboard");
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [j, a] = await Promise.all([
        api.get("/employer/jobs"),
        api.get("/employer/applications"),
      ]);
      setJobs(j.data);
      setApps(a.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user !== false && user.role === "employer") {
      load();
      setForm((f) => ({ ...f, company: user.company || "" }));
    }
    // eslint-disable-next-line
  }, [user]);

  if (!user || user === false || user.role !== "employer") return null;

  const postJob = async (e) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.description) {
      toast.error("Please fill required fields");
      return;
    }
    setPosting(true);
    try {
      await api.post("/jobs", {
        title: form.title,
        company: form.company || user.company || "Your Company",
        location: form.location,
        type: form.type,
        workplace: form.workplace,
        experience: form.experience,
        salary_min: parseInt(form.salary_min || "0", 10) || 0,
        salary_max: parseInt(form.salary_max || "0", 10) || 0,
        description: form.description,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Job posted");
      setOpenPost(false);
      setForm({
        title: "",
        company: user.company || "",
        location: "",
        type: "Full-time",
        workplace: "Remote",
        experience: "Mid",
        salary_min: "",
        salary_max: "",
        description: "",
        tags: "",
      });
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not post");
    } finally {
      setPosting(false);
    }
  };

  const updateStage = async (id, stage) => {
    try {
      await api.patch(`/employer/applications/${id}`, { stage });
      toast.success("Updated");
      load();
    } catch {
      toast.error("Could not update");
    }
  };

  const byStage = (key) => apps.filter((a) => a.stage === key);

  return (
    <PageShell>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 pt-10 pb-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Employer</div>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#0B1528] lg:text-4xl">
                Hi {user.name?.split(" ")[0]}, your hiring deck.
              </h1>
              <p className="mt-2 text-sm text-slate-600">Manage roles, candidates and pipelines from one place.</p>
            </div>
            <Button
              className="bg-[#FF5959] hover:bg-[#ff4040] text-white"
              onClick={() => setOpenPost(true)}
              data-testid="open-post-job"
            >
              <Plus className="mr-2 h-4 w-4" /> Post a Job
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="employer-stats">
            <Stat label="Active jobs" value={jobs.length} />
            <Stat label="Applicants" value={apps.length} />
            <Stat label="Interviews" value={byStage("interview").length} />
            <Stat label="Hired" value={byStage("hired").length} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <Tabs defaultValue="pipeline" data-testid="employer-tabs">
          <TabsList className="border border-slate-200 bg-white">
            <TabsTrigger value="pipeline" data-testid="tab-pipeline">Candidate pipeline</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">My jobs ({jobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4">
            {loading ? (
              <Loading />
            ) : apps.length === 0 ? (
              <Empty title="No applications yet" body="Post your first job to start receiving candidates." />
            ) : (
              <div className="-mx-5 overflow-x-auto px-5">
                <div className="flex min-w-max gap-4" data-testid="kanban">
                  {STAGES.map((s) => {
                    const list = byStage(s.key);
                    return (
                      <div
                        key={s.key}
                        className={`w-72 flex-none rounded-md border border-slate-200 ${s.color}`}
                        data-testid={`kanban-col-${s.key}`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
                          <div className="font-display text-sm font-bold text-[#0B1528]">{s.label}</div>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-mono font-bold text-[#0B1528]">
                            {list.length}
                          </span>
                        </div>
                        <div className="space-y-3 p-3">
                          {list.length === 0 ? (
                            <div className="rounded-md border border-dashed border-slate-300 bg-white/50 p-6 text-center text-xs text-slate-500">
                              No candidates
                            </div>
                          ) : (
                            list.map((a) => (
                              <div
                                key={a.id}
                                className="rounded-md border border-slate-200 bg-white p-3"
                                data-testid={`candidate-card-${a.id}`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#0B1528] font-display text-xs font-black text-white">
                                    {a.seeker_name?.[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-bold text-[#0B1528]">{a.seeker_name}</div>
                                    <div className="truncate text-[11px] text-slate-500">
                                      {a.seeker_headline || a.job_title}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-500">
                                  Applied to <span className="font-semibold text-[#0B1528]">{a.job_title}</span>
                                </div>
                                {a.seeker_skills?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {a.seeker_skills.slice(0, 3).map((s) => (
                                      <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <Select
                                  value={a.stage}
                                  onValueChange={(v) => updateStage(a.id, v)}
                                >
                                  <SelectTrigger className="mt-3 h-8 text-xs" data-testid={`stage-select-${a.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STAGE_OPTIONS.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            {jobs.length === 0 ? (
              <Empty
                title="No jobs posted yet"
                body="Post your first role — it takes under 3 minutes."
                cta={
                  <Button className="bg-[#0B1528] text-white" onClick={() => setOpenPost(true)}>
                    Post your first job
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {jobs.map((j) => (
                  <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-5">
                    <div>
                      <div className="font-display text-lg font-bold text-[#0B1528]">{j.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {j.location} · {j.workplace} · {j.type} · posted {new Date(j.posted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {apps.filter((a) => a.job_id === j.id).length} applicants
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={openPost} onOpenChange={setOpenPost}>
        <DialogContent className="max-w-2xl" data-testid="post-job-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Post a Job</DialogTitle>
            <DialogDescription>Reach pre-qualified candidates in minutes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={postJob} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Job title*</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                data-testid="post-title-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Location*</Label>
              <Input
                required
                placeholder="e.g. Berlin or Remote"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                data-testid="post-location-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Full-time", "Part-time", "Contract", "Internship"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Workplace</Label>
              <Select value={form.workplace} onValueChange={(v) => setForm((f) => ({ ...f, workplace: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Remote", "Hybrid", "On-site"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Experience</Label>
              <Select value={form.experience} onValueChange={(v) => setForm((f) => ({ ...f, experience: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Entry", "Mid", "Senior", "Lead"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Salary min ($)</Label>
              <Input
                type="number"
                value={form.salary_min}
                onChange={(e) => setForm((f) => ({ ...f, salary_min: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Salary max ($)</Label>
              <Input
                type="number"
                value={form.salary_max}
                onChange={(e) => setForm((f) => ({ ...f, salary_max: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description*</Label>
              <Textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                data-testid="post-description-input"
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Tags / Skills (comma-separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="React, TypeScript, GraphQL"
                className="mt-1.5"
              />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpenPost(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={posting} className="bg-[#FF5959] text-white hover:bg-[#ff4040]" data-testid="post-job-submit">
                {posting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Publish job
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="font-display mt-2 text-3xl font-extrabold text-[#0B1528]">{value}</div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center text-slate-400">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
    </div>
  );
}

function Empty({ title, body, cta }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-12 text-center">
      <h3 className="font-display text-lg font-bold text-[#0B1528]">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
