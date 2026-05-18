import PageShell from "@/components/PageShell";
import { Anchor, Compass, Heart, Globe2 } from "lucide-react";

const IMG = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b3JraW5nJTIwbGFwdG9wfGVufDB8fHx8MTc3OTExNDE5NXww&ixlib=rb-4.1.0&q=85";

export default function About() {
  return (
    <PageShell>
      <section className="bg-[#0B1528] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">About Jobsboats</div>
          <h1 className="font-display mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            We help people navigate the hardest part of work — finding it.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Jobsboats started in 2021 as a side project to bring sanity to job hunting. Today, we power tens of
            thousands of searches every week and quietly help small teams hire some of the best people on the planet.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-[#0B1528] lg:text-5xl">
              Our mission
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600">
              Most job boards optimize for noise. We optimize for outcomes. We obsess over surfacing the right roles
              for the right people — and giving employers calm, modern tools to hire well.
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              We believe great careers are <em>navigated</em>, not gambled. Jobsboats is the chart, the compass, and a
              small crew of people quietly cheering for you.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-md border border-slate-200">
              <img src={IMG} alt="" className="h-[420px] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0B1528] lg:text-4xl">
            What makes us different
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { i: Anchor, t: "Quiet, calm UI", d: "No flashing banners. Just the work." },
              { i: Compass, t: "Aggregated reach", d: "We crawl, dedupe, and surface roles from everywhere." },
              { i: Heart, t: "Human-first support", d: "Real humans helping real careers — including immigration." },
              { i: Globe2, t: "Global by default", d: "From Bangalore to Berlin to Buenos Aires." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="rounded-md border border-slate-200 bg-white p-6">
                <Icon className="h-6 w-6 text-[#00B4D8]" />
                <div className="font-display mt-3 text-lg font-bold text-[#0B1528]">{t}</div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
