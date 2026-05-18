import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const next = loc.state?.from || null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Login failed");
      return;
    }
    const dash = res.user.role === "employer" ? "/employer" : "/dashboard";
    navigate(next || dash);
  };

  return (
    <PageShell hideFooter>
      <section className="grid min-h-[80vh] grid-cols-1 lg:grid-cols-2">
        <div className="hidden bg-[#0B1528] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
          <Link to="/" className="font-display text-xl font-black">Jobsboats</Link>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Welcome back</div>
            <h1 className="font-display mt-3 text-5xl font-extrabold leading-none tracking-tight">
              Pick up<br />where you left off.
            </h1>
            <p className="mt-5 max-w-md text-base text-slate-300">
              Your saved jobs, alerts, and applications are waiting in your dashboard.
            </p>
          </div>
          <div className="text-xs text-slate-500">© Jobsboats. Charting careers worldwide.</div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <h2 className="font-display text-3xl font-extrabold text-[#0B1528]">Log in</h2>
            <p className="mt-2 text-sm text-slate-500">Use your email and password.</p>
            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="login-password-input"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute inset-y-0 right-2 grid place-items-center text-slate-400 hover:text-[#0B1528]"
                    data-testid="toggle-password-visibility"
                    aria-label="Toggle password"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="login-error">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B1528] text-white hover:bg-black"
                data-testid="login-submit-button"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Log in
              </Button>
            </form>
            <div className="mt-6 text-sm text-slate-600">
              No account?{" "}
              <Link to="/register" className="font-semibold text-[#00B4D8] hover:underline">
                Create one
              </Link>
            </div>
            <div className="mt-8 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600" data-testid="demo-credentials">
              <div className="font-semibold text-[#0B1528]">Try the demo</div>
              <div className="mt-1">Seeker: <span className="font-mono">seeker@jobsboats.com / seeker123</span></div>
              <div>Employer: <span className="font-mono">employer@jobsboats.com / employer123</span></div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
