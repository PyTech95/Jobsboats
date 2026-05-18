import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  Briefcase,
  Search,
  Plus,
  User,
  Trash2,
  Loader2,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import JobCard from "@/components/JobCard";
import JobDetailSheet from "@/components/JobDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const STAGE_LABEL = {
  new: "Submitted",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Closed",
};

export default function SeekerDashboard() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [recommended, setRecommended] = useState([]);
  const [saved, setSaved] = useState([]);
  const [applications, setApplications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetJob, setSheetJob] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ keyword: "", location: "", frequency: "weekly" });

  useEffect(() => {
    if (user === false) navigate("/login", { state: { from: "/dashboard" } });
    if (user && user !== false && user.role !== "seeker") navigate("/employer");
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [recRes, savedRes, appsRes, alertsRes] = await Promise.all([
        api.get("/jobs", { params: { limit: 6 } }),
        api.get("/saved-jobs"),
        api.get("/applications/me"),
        api.get("/alerts"),
      ]);
      setRecommended(recRes.data);
      setSaved(savedRes.data);
      setApplications(appsRes.data);
      setAlerts(alertsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user !== false && user.role === "seeker") load();
    // eslint-disable-next-line
  }, [user]);

  if (!user || user === false || user.role !== "seeker") return null;

  const savedIds = new Set(saved.map((s) => s.job_id));
  const appliedIds = new Set(applications.map((a) => a.job_id));

  const onSelect = (job) => {
    setSheetJob(job);
    setSheetOpen(true);
  };

  const onSave = async (job) => {
    try {
      if (savedIds.has(job.id)) {
        await api.delete(`/saved-jobs/${job.id}`);
        toast.success("Removed from saved");
      } else {
        await api.post(`/saved-jobs/${job.id}`);
        toast.success("Job saved");
      }
      load();
    } catch {
      toast.error("Could not update saved");
    }
  };

  const onApply = async (job) => {
    try {
      await api.post("/applications", { job_id: job.id });
      toast.success("Application submitted");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not apply");
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    if (!alertForm.keyword.trim()) return;
    try {
      await api.post("/alerts", alertForm);
      setAlertForm({ keyword: "", location: "", frequency: "weekly" });
      toast.success("Alert created");
      load();
    } catch {
      toast.error("Could not create alert");
    }
  };

  const deleteAlert = async (id) => {
    try {
      await api.delete(`/alerts/${id}`);
      toast.success("Alert removed");
      load();
    } catch {
      toast.error("Could not remove");
    }
  };

  // profile completion
  const profileFields = ["name", "headline", "location", "skills", "resume_filename"];
  const completed = profileFields.filter((f) => {
    const v = user[f];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;
  const completion = Math.round((completed / profileFields.length) * 100);

  return (
    <PageShell>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 pt-10 pb-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Your Dashboard</div>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#0B1528] lg:text-4xl">
                Welcome back, {user.name?.split(" ")[0]}.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Here’s what’s happening with your search today.
              </p>
            </div>
            <Link to="/jobs">
              <Button className="bg-[#FF5959] hover:bg-[#ff4040] text-white">
                <Search className="mr-2 h-4 w-4" /> Find more jobs
              </Button>
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="seeker-stats">
            <Stat label="Recommended" value={recommended.length} icon={Briefcase} />
            <Stat label="Saved" value={saved.length} icon={Bookmark} />
            <Stat label="Applied" value={applications.length} icon={Briefcase} />
            <Stat label="Alerts" value={alerts.length} icon={Bell} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Tabs defaultValue="recommended" data-testid="seeker-tabs">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="recommended" data-testid="tab-recommended">Recommended</TabsTrigger>
                <TabsTrigger value="saved" data-testid="tab-saved">Saved ({saved.length})</TabsTrigger>
                <TabsTrigger value="applied" data-testid="tab-applied">Applied ({applications.length})</TabsTrigger>
                <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="mt-4">
                {loading ? (
                  <Loading />
                ) : recommended.length === 0 ? (
                  <Empty title="Nothing yet" body="Once you set your skills, we'll line up roles." />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {recommended.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        saved={savedIds.has(job.id)}
                        onSave={onSave}
                        onClick={() => onSelect(job)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                {saved.length === 0 ? (
                  <Empty
                    title="You haven't saved any jobs yet"
                    body="Start exploring roles that match your skills."
                    cta={<Link to="/jobs"><Button className="bg-[#0B1528] text-white">Browse jobs</Button></Link>}
                  />
                ) : (
                  <div className="space-y-3">
                    {saved.map((s) => (
                      <div key={s.job_id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4">
                        <div>
                          <div className="font-display text-base font-bold text-[#0B1528]">{s.job_title}</div>
                          <div className="text-xs text-slate-500">{s.company} · {s.location}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await api.delete(`/saved-jobs/${s.job_id}`);
                            load();
                          }}
                          data-testid={`unsave-${s.job_id}`}
                        >
                          <Trash2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="applied" className="mt-4">
                {applications.length === 0 ? (
                  <Empty
                    title="No applications yet"
                    body="Apply to your first role from the recommended list."
                  />
                ) : (
                  <div className="space-y-3">
                    {applications.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4">
                        <div>
                          <div className="font-display text-base font-bold text-[#0B1528]">{a.job_title}</div>
                          <div className="text-xs text-slate-500">{a.company} · applied {new Date(a.applied_at).toLocaleDateString()}</div>
                        </div>
                        <span className="rounded-full bg-[#00B4D8]/10 px-3 py-1 text-xs font-semibold text-[#0077B6]">
                          {STAGE_LABEL[a.stage] || a.stage}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="alerts" className="mt-4">
                <form onSubmit={createAlert} className="rounded-md border border-slate-200 bg-white p-5" data-testid="alert-form">
                  <h3 className="font-display text-base font-bold text-[#0B1528]">Create a job alert</h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Input
                      placeholder="Keyword e.g. Designer"
                      value={alertForm.keyword}
                      onChange={(e) => setAlertForm((f) => ({ ...f, keyword: e.target.value }))}
                      data-testid="alert-keyword-input"
                    />
                    <Input
                      placeholder="Location (optional)"
                      value={alertForm.location}
                      onChange={(e) => setAlertForm((f) => ({ ...f, location: e.target.value }))}
                      data-testid="alert-location-input"
                    />
                    <Select
                      value={alertForm.frequency}
                      onValueChange={(v) => setAlertForm((f) => ({ ...f, frequency: v }))}
                    >
                      <SelectTrigger data-testid="alert-frequency-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="mt-4 bg-[#0B1528] text-white" data-testid="alert-submit-button">
                    <Plus className="mr-2 h-4 w-4" /> Create alert
                  </Button>
                </form>
                <div className="mt-5 space-y-2">
                  {alerts.length === 0 ? (
                    <Empty title="No alerts yet" body="Set a few keywords — we’ll do the watching." />
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4">
                        <div>
                          <div className="font-display text-base font-bold text-[#0B1528]">{a.keyword}</div>
                          <div className="text-xs text-slate-500">
                            {a.location || "Anywhere"} · {a.frequency}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(a.id)}
                          data-testid={`delete-alert-${a.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-md border border-slate-200 bg-white p-6" data-testid="profile-card">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#0B1528] font-display text-lg font-black text-white">
                  {user.name?.[0]}
                </div>
                <div>
                  <div className="font-display text-base font-bold text-[#0B1528]">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.headline || "Add a headline"}</div>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Profile completion</span>
                  <span className="font-mono font-bold text-[#0B1528]">{completion}%</span>
                </div>
                <Progress value={completion} className="mt-2 h-2" />
              </div>
              <Link to="/profile">
                <Button variant="outline" className="mt-5 w-full" data-testid="open-profile">
                  <User className="mr-2 h-4 w-4" /> Edit profile
                </Button>
              </Link>
            </div>

            <div className="mt-4 rounded-md border border-slate-200 bg-gradient-to-br from-[#0B1528] to-[#0077B6] p-6 text-white">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#90E0EF]">Premium</div>
              <div className="font-display mt-2 text-xl font-extrabold">Highlight your profile</div>
              <p className="mt-2 text-sm text-slate-200">Land 3x more recruiter views — verified badges + top-of-list visibility.</p>
              <Link to="/services">
                <Button className="mt-4 w-full bg-[#FF5959] hover:bg-[#ff4040] text-white">See services</Button>
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <JobDetailSheet
        job={sheetJob}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onApply={onApply}
        applied={sheetJob && appliedIds.has(sheetJob.id)}
        onSave={onSave}
        saved={sheetJob && savedIds.has(sheetJob.id)}
        canApply
      />
    </PageShell>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
        <Icon className="h-4 w-4 text-[#00B4D8]" />
      </div>
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
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center" data-testid="empty-state">
      <h3 className="font-display text-lg font-bold text-[#0B1528]">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
