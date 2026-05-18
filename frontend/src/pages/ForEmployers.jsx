import { Link } from "react-router-dom";
import { BadgeCheck, Search, Users, Layers, Building, BarChart3 } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const IMG = "https://images.unsplash.com/photo-1509295433237-4b4851f2ab67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHNhaWxpbmclMjB5YWNodCUyMGFlcmlhbHxlbnwwfHx8fDE3NzkxMTQxOTR8MA&ixlib=rb-4.1.0&q=85";

const FEATURES = [
  { icon: Search, t: "AI-assisted candidate search", d: "Score every candidate against your role using skills, seniority and intent signals." },
  { icon: BadgeCheck, t: "Verified candidates", d: "Hire with confidence — verified profiles cut your screening time by 40%." },
  { icon: Layers, t: "Pipeline Kanban", d: "New → Shortlisted → Interview → Offered → Hired. Drag, move, hire. No spreadsheets." },
  { icon: Building, t: "Employer branding", d: "A dedicated, beautiful brand page that turns candidates into ambassadors." },
  { icon: Users, t: "Team collaboration", d: "Inline notes, mentions, and approvals — keep the entire hiring panel aligned." },
  { icon: BarChart3, t: "Hiring analytics", d: "Funnel insights, source quality, time-to-hire — wisdom you can act on." },
];

export default function ForEmployers() {
  return (
    <PageShell>
      <section className="relative isolate overflow-hidden bg-[#0B1528] text-white">
        <img src={IMG} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528] via-[#0B1528]/85 to-[#0B1528]/40" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">For Employers</div>
          <h1 className="font-display mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl">
            Dock the <span className="text-gradient-ocean">right talent</span>, faster.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Post jobs in minutes, source from a verified pool, and move every applicant through a calm, modern pipeline.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register?role=employer"><Button className="bg-[#FF5959] hover:bg-[#ff4040] text-white px-6 py-6 text-base font-bold">Start hiring</Button></Link>
            <Link to="/services"><Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-[#0B1528] px-6 py-6 text-base font-bold">Verification services</Button></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="lift rounded-md border border-slate-200 bg-white p-7">
              <div className="grid h-12 w-12 place-items-center rounded-md bg-[#0B1528] text-white">
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
          <div className="rounded-md border border-slate-200 bg-gradient-to-br from-[#0B1528] to-[#0077B6] p-10 text-white lg:p-16">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <h2 className="font-display text-4xl font-extrabold tracking-tight lg:text-5xl">
                  Post your first job free.
                </h2>
                <p className="mt-3 max-w-xl text-base text-slate-200">
                  Get listed in front of thousands of candidates and try the pipeline tools on us.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Link to="/register"><Button className="bg-[#FF5959] hover:bg-[#ff4040] text-white px-6 py-6 text-base font-bold">Create employer account</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
