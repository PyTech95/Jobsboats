import { Link } from "react-router-dom";
import { Bell, Bookmark, FileText, Shield, Compass, Star, Briefcase, Check } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const IMG = "https://images.pexels.com/photos/3760613/pexels-photo-3760613.jpeg?auto=compress&cs=tinysrgb&w=1200&q=80";

const FEATURES = [
  {
    icon: Briefcase,
    t: "Aggregated job search",
    d: "Tens of thousands of roles, scraped from boards and company sites, in one elegant feed.",
  },
  {
    icon: Bell,
    t: "Smart alerts",
    d: "Daily or weekly digests for the keywords, salary bands and locations that fit your goals.",
  },
  {
    icon: Bookmark,
    t: "Save & track",
    d: "Bookmark roles, track every application, and never lose context across tabs.",
  },
  {
    icon: FileText,
    t: "Resume tools",
    d: "Upload, refresh, and tailor your resume — keep it sharp without spreadsheet chaos.",
  },
  {
    icon: Shield,
    t: "Privacy first",
    d: "Decide who sees you. Public for recruiters, private until you apply — your call.",
  },
  {
    icon: Compass,
    t: "International support",
    d: "Visa-friendly filters, relocation perks at a glance, and optional advisory services.",
  },
];

export default function ForJobSeekers() {
  return (
    <PageShell>
      <section className="relative isolate overflow-hidden bg-[#0B1528] text-white">
        <div className="absolute inset-0 cyan-flare" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-20 lg:grid-cols-12 lg:px-8 lg:py-28">
          <div className="lg:col-span-7">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">For Job Seekers</div>
            <h1 className="font-display mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Hunt less. <span className="text-gradient-ocean">Land more.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              Every relevant role, surfaced in one place. Save, apply, and track from a clean dashboard built for
              focus — and unlock premium services when you’re ready to accelerate.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button className="bg-[#FF5959] hover:bg-[#ff4040] text-white px-6 py-6 text-base font-bold">Create my profile</Button></Link>
              <Link to="/jobs"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#0B1528] px-6 py-6 text-base font-bold">Browse jobs</Button></Link>
            </div>
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="overflow-hidden rounded-md border border-white/10">
              <img src={IMG} alt="" className="h-[420px] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="lift rounded-md border border-slate-200 bg-white p-7">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-[#00B4D8]/10 text-[#0077B6]">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display mt-5 text-xl font-bold text-[#0B1528]">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Premium Services</div>
              <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#0B1528] lg:text-5xl">
                Boosters for serious searchers.
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {[
                  "Profile Highlight — top-of-list for recruiters",
                  "Verified badge — 3x more inbound messages",
                  "Digital profile microsite — share with one URL",
                  "Immigration advisory — visa-stage support",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 text-[#00B4D8]" /> {x}
                  </li>
                ))}
              </ul>
              <Link to="/services" className="mt-6 inline-block">
                <Button className="bg-[#0B1528] text-white">Explore services →</Button>
              </Link>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-md border border-slate-200 bg-[#F8FAFC] p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { i: Star, t: "Highlight" },
                    { i: Shield, t: "Verify" },
                    { i: Compass, t: "Relocate" },
                    { i: FileText, t: "Resume Pro" },
                  ].map(({ i: Icon, t }) => (
                    <div key={t} className="rounded-md border border-slate-200 bg-white p-5">
                      <Icon className="h-6 w-6 text-[#00B4D8]" />
                      <div className="font-display mt-2 text-base font-bold text-[#0B1528]">{t}</div>
                      <div className="mt-1 text-xs text-slate-500">From $19</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
