import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const [role, setRole] = useState("seeker");
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register({
      ...form,
      role,
      company: role === "employer" ? form.company : undefined,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Could not create account");
      return;
    }
    navigate(role === "employer" ? "/employer" : "/dashboard");
  };

  return (
    <PageShell hideFooter>
      <section className="grid min-h-[85vh] grid-cols-1 lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-[#0B1528] to-[#0077B6] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
          <Link to="/" className="font-display text-xl font-black">Jobsboats</Link>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Join Jobsboats</div>
            <h1 className="font-display mt-3 text-5xl font-extrabold leading-none tracking-tight">
              One account.<br />Every opportunity.
            </h1>
            <p className="mt-5 max-w-md text-base text-slate-300">
              Get smart alerts, apply with one click, and track every step in a single workspace.
            </p>
          </div>
          <div className="text-xs text-slate-300">No credit card needed. Cancel anytime.</div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <h2 className="font-display text-3xl font-extrabold text-[#0B1528]">Create your account</h2>
            <p className="mt-2 text-sm text-slate-500">It takes less than 60 seconds.</p>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-1" data-testid="role-toggle">
              {["seeker", "employer"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  data-testid={`role-${r}`}
                  className={`rounded-md py-2 text-sm font-semibold transition ${
                    role === r ? "bg-white text-[#0B1528] shadow-sm" : "text-slate-500 hover:text-[#0B1528]"
                  }`}
                >
                  {r === "seeker" ? "I'm a Job Seeker" : "I'm hiring"}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="name">{role === "employer" ? "Your name" : "Full name"}</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  data-testid="register-name-input"
                  className="mt-1.5"
                />
              </div>
              {role === "employer" && (
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    required
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    data-testid="register-company-input"
                    className="mt-1.5"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  data-testid="register-email-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  data-testid="register-password-input"
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-slate-500">At least 6 characters.</p>
              </div>
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="register-error">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF5959] text-white hover:bg-[#ff4040]"
                data-testid="register-submit-button"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create account
              </Button>
            </form>
            <div className="mt-6 text-sm text-slate-600">
              Already have one?{" "}
              <Link to="/login" className="font-semibold text-[#00B4D8] hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
