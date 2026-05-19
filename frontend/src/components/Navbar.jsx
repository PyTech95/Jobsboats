import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, User, Zap } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useQuickApply } from "@/context/QuickApplyContext";

const NAV = [
  { to: "/jobs", label: "Find Jobs" },
  { to: "/for-job-seekers", label: "For Job Seekers" },
  { to: "/for-employers", label: "For Employers" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openApply } = useQuickApply() || {};
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashHref = user && user.role === "employer" ? "/employer" : "/dashboard";

  return (
    <header
      data-testid="site-navbar"
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200"
          : "bg-white/60 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.to.replace("/", "")}`}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "text-[#0B1528] bg-slate-100"
                    : "text-slate-600 hover:text-[#0B1528] hover:bg-slate-50"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={() => openApply?.()}
            data-testid="navbar-apply-button"
            className="group relative inline-flex items-center gap-2 rounded-md bg-[#FF5959] px-4 py-2 text-sm font-bold text-white shadow-[0_8px_24px_rgba(255,89,89,0.35)] transition hover:bg-[#ff4040]"
          >
            <span className="absolute inset-0 -z-10 rounded-md bg-[#FF5959] opacity-60 blur-md transition group-hover:opacity-80" />
            <Zap className="h-4 w-4" />
            Quick Apply
          </button>
          {user && user !== false ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="navbar-user-menu"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0B1528] hover:border-[#00B4D8]"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0B1528] text-white text-xs">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  {user.name?.split(" ")[0] || "Account"}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-display">
                  {user.name}
                  <div className="text-xs font-normal text-slate-500">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashHref)} data-testid="menu-dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                {user.role === "seeker" && (
                  <DropdownMenuItem onClick={() => navigate("/profile")} data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" /> My Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login">
                <Button variant="ghost" className="text-[#0B1528]">
                  Log in
                </Button>
              </Link>
              <Link to="/register" data-testid="nav-register">
                <Button className="bg-[#FF5959] hover:bg-[#ff4040] text-white rounded-md">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => openApply?.()}
            data-testid="mobile-apply-button"
            className="inline-flex items-center gap-1 rounded-md bg-[#FF5959] px-3 py-1.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(255,89,89,0.35)]"
          >
            <Zap className="h-3.5 w-3.5" /> Apply
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-[#0B1528]"
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden" data-testid="mobile-menu">
          <div className="space-y-1 px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 pt-2 border-t border-slate-100">
              {user && user !== false ? (
                <>
                  <Link to={dashHref} className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-[#0B1528] text-white">Dashboard</Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await logout();
                      setOpen(false);
                      navigate("/");
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-[#FF5959] text-white hover:bg-[#ff4040]">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
