import { Link } from "react-router-dom";
import { BadgeCheck, Star, ShieldCheck, Compass, ChevronRight } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";

const SERVICES = [
  {
    icon: BadgeCheck,
    name: "Profile Verification",
    price: "$29",
    bullets: [
      "Identity, education and experience verified",
      "Trusted by recruiters — get prioritized in search",
      "Lifetime badge on your Jobsboats profile",
    ],
  },
  {
    icon: Star,
    name: "Profile Highlight",
    price: "$19/mo",
    bullets: [
      "Top-of-list visibility for recruiters in your space",
      "3x average inbound message increase",
      "Cancel anytime, no questions asked",
    ],
  },
  {
    icon: ShieldCheck,
    name: "Immigration Advisory",
    price: "$99",
    bullets: [
      "Visa-stage support from licensed advisors",
      "Country-specific relocation guidance",
      "Document review and timelines",
    ],
  },
  {
    icon: Compass,
    name: "Combo Packs",
    price: "From $149",
    bullets: [
      "Highlight + Verify + Resume Pro bundles",
      "Save 30%+ vs individual services",
      "Tailored to entry, mid and senior careers",
    ],
  },
];

export default function Services() {
  return (
    <PageShell>
      <section className="bg-[#0B1528] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Premium services</div>
          <h1 className="font-display mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Career growth, fully <span className="text-gradient-ocean">supported.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Premium services to verify, highlight and accelerate your career — and white-glove immigration help when
            opportunity calls from another shore.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.name} className="lift flex flex-col rounded-md border border-slate-200 bg-white p-8">
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-[#00B4D8]/10 text-[#0077B6]">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="font-mono text-base font-bold text-[#0B1528]">{s.price}</div>
              </div>
              <h3 className="font-display mt-5 text-2xl font-extrabold tracking-tight text-[#0B1528]">{s.name}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <ChevronRight className="mt-1 h-4 w-4 flex-none text-[#00B4D8]" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-2">
                <Button className="bg-[#0B1528] text-white" data-testid={`service-${s.name.replace(/\s+/g, "-").toLowerCase()}`}>
                  Know more
                </Button>
                <Link to="/register"><Button variant="outline">Get started</Button></Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#0B1528] lg:text-4xl">
            Frequently asked
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              { q: "Are services refundable?", a: "Yes — 14-day money back on all monthly services. One-time services are refundable if not yet started." },
              { q: "Does verification access my documents?", a: "Securely yes. We use encrypted storage and delete the originals after verification." },
              { q: "Can companies buy combo packs?", a: "Employer combo packs are available — talk to us for team pricing." },
              { q: "Where do advisors operate?", a: "We currently support visa pathways in EU, UK, USA, Canada, UAE and Australia." },
            ].map((f) => (
              <div key={f.q} className="rounded-md border border-slate-200 bg-[#F8FAFC] p-6">
                <div className="font-display text-base font-bold text-[#0B1528]">{f.q}</div>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
