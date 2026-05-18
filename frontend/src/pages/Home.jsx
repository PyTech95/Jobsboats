import { Link } from "react-router-dom";
import { ArrowRight, Compass, Sparkles, Rocket, Check, Star, Quote, BadgeCheck, Anchor, ShieldCheck } from "lucide-react";
import PageShell from "@/components/PageShell";
import HeroSearch from "@/components/HeroSearch";
import { Button } from "@/components/ui/button";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/747c2510-38b2-444a-8916-6fc89b153445/images/2832d4a52e73501819e6429aebba6a5912efaffe65c607a20a9b15e204756525.png";

const STEPS = [
  {
    icon: Compass,
    title: "Discover",
    body: "Search aggregated openings from top boards and company sites. Filter by what matters: remote, salary, level.",
  },
  {
    icon: Sparkles,
    title: "Prepare",
    body: "Build a recruiter-ready profile, upload your resume, and unlock premium services like verification.",
  },
  {
    icon: Rocket,
    title: "Launch",
    body: "Apply, track every step from one dashboard, and get alerts for new roles that match your goals.",
  },
];

const SEEKER_BENEFITS = [
  "One profile — apply to roles across hundreds of company sites",
  "Smart job alerts tuned to your skills, location, and salary band",
  "Save jobs and track every application from a single dashboard",
  "Privacy controls — choose who sees your resume and contact details",
];

const EMPLOYER_BENEFITS = [
  "Post a job in under 3 minutes with guided steps",
  "Verified candidates and an AI-assisted talent search",
  "Kanban-style pipeline: New → Shortlisted → Interview → Offered → Hired",
  "Employer branding pages and dedicated success support",
];

const TESTIMONIALS = [
  {
    name: "Anna Williams",
    role: "Product Designer",
    company: "hired at Lighthouse Studio",
    quote: "Jobsboats was the only place that surfaced senior design roles outside the usual bubbles. I docked the perfect job in 11 days.",
  },
  {
    name: "Daniel Okafor",
    role: "Head of Talent",
    company: "Harbor Labs",
    quote: "We replaced three sourcing tools with Jobsboats. The candidate pipeline view alone saves us 4 hours every week.",
  },
  {
    name: "Priya Menon",
    role: "Backend Engineer",
    company: "hired at Anchor Systems",
    quote: "The alerts are genuinely smart. I got a perfect-fit Berlin role in week two — visa support included.",
  },
];

export default function Home() {
  return (
    <PageShell>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#0B1528] text-white">
        <img
          src={HERO_BG}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1528] via-[#0B1528]/85 to-[#0077B6]/60" />
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="absolute inset-0 cyan-flare" />

        <div className="relative mx-auto max-w-7xl px-5 pb-28 pt-24 sm:pt-28 lg:px-8 lg:pb-36 lg:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#90E0EF] backdrop-blur rise">
            <Anchor className="h-3.5 w-3.5" /> The career navigation platform
          </div>
          <h1
            data-testid="hero-headline"
            className="font-display mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl rise rise-delay-1"
          >
            Navigate Your <span className="text-gradient-ocean">Next Opportunity</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl rise rise-delay-2">
            Jobsboats aggregates roles from boards and company sites, plus premium services — verification, profile
            highlight, and international career support — so you land the right opportunity, faster.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 rise rise-delay-3">
            <Link to="/jobs" data-testid="hero-primary-cta">
              <Button size="lg" className="bg-[#FF5959] px-6 py-6 text-base font-bold text-white hover:bg-[#ff4040]">
                Start Job Search <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/for-employers" data-testid="hero-secondary-cta">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 px-6 py-6 text-base font-bold text-white backdrop-blur hover:bg-white hover:text-[#0B1528]"
              >
                For Employers — Post a Job
              </Button>
            </Link>
          </div>

          {/* Search overlap */}
          <div className="relative mt-12 lg:mt-16">
            <HeroSearch />
          </div>
        </div>

        {/* Stat strip */}
        <div className="relative border-t border-white/10 bg-[#0B1528]/80 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-6 text-center sm:grid-cols-4 lg:px-8">
            <Stat n="450K+" l="Active job listings" />
            <Stat n="120K+" l="Job seekers on board" />
            <Stat n="2,800+" l="Hiring companies" />
            <Stat n="38" l="Countries served" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white" data-testid="how-it-works">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">How Jobsboats Works</div>
              <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#0B1528] lg:text-5xl">
                Three steps. From idle to hired.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                We replace 5 tabs and 3 spreadsheets with one calm, focused workspace — built for the people doing the
                searching and the people doing the hiring.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:col-span-8 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="lift rounded-md border border-slate-200 bg-white p-7">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-[#0B1528] text-white">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-5 font-mono text-xs text-slate-400">0{i + 1}</div>
                  <h3 className="font-display mt-1 text-xl font-bold text-[#0B1528]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEEKER + EMPLOYER BENEFITS */}
      <section className="bg-[#F8FAFC]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <BenefitCard
            tone="dark"
            kicker="For Job Seekers"
            title="Land roles you actually want."
            items={SEEKER_BENEFITS}
            cta={{ to: "/for-job-seekers", label: "Explore for seekers" }}
            testid="seeker-benefits"
          />
          <BenefitCard
            tone="light"
            kicker="For Employers"
            title="Hire faster, with less noise."
            items={EMPLOYER_BENEFITS}
            cta={{ to: "/for-employers", label: "Explore for employers" }}
            testid="employer-benefits"
          />
        </div>
      </section>

      {/* SERVICES STRIP */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Premium Services</div>
              <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#0B1528] lg:text-5xl">
                Career services that move the needle.
              </h2>
            </div>
            <Link to="/services">
              <Button variant="outline" className="rounded-md">See all services →</Button>
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, t: "Profile Verification", d: "Stand out with a verified, recruiter-trusted badge.", price: "From $29" },
              { icon: Star, t: "Profile Highlight", d: "Top-of-list visibility for recruiters in your space.", price: "From $19/mo" },
              { icon: ShieldCheck, t: "Immigration Advisory", d: "Expert visa, relocation and offer-stage support.", price: "From $99" },
              { icon: Compass, t: "Combo Packs", d: "Bundle services to save 30%+ on premium career growth.", price: "From $149" },
            ].map((s) => (
              <div key={s.t} className="lift rounded-md border border-slate-200 bg-white p-6">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-[#00B4D8]/10 text-[#0077B6]">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-4 text-lg font-bold text-[#0B1528]">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-mono font-semibold text-[#0B1528]">{s.price}</span>
                  <Link to="/services" className="font-semibold text-[#00B4D8] hover:underline">
                    Know more
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#0B1528] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Loved by people doing the work</div>
          <h2 className="font-display mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
            Stories from people who docked the right boat.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="relative rounded-md border border-white/10 bg-white/5 p-7 backdrop-blur">
                <Quote className="absolute right-5 top-5 h-6 w-6 text-[#00B4D8]/60" />
                <blockquote className="font-display text-lg font-medium leading-snug text-white">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#00B4D8] font-display text-sm font-black text-[#0B1528]">
                    {t.name[0]}
                  </span>
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-xs text-slate-400">
                      {t.role} · {t.company}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* INDIA SPOTLIGHT */}
      <section className="bg-white" data-testid="india-spotlight">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5959]">Now Hiring · India</div>
              <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight text-[#0B1528] lg:text-5xl">
                Built for India's<br />tech and talent ocean.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                From Bengaluru's startup belt to Mumbai's financial harbours, Jobsboats surfaces roles from 800+
                Indian employers — Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai and more.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Remote · India"].map((c) => (
                  <Link
                    key={c}
                    to={`/jobs?location=${encodeURIComponent(c)}`}
                    data-testid={`india-city-${c.toLowerCase().replace(/\s+/g, "-").replace("·", "")}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1528] hover:border-[#00B4D8] hover:text-[#0077B6]"
                  >
                    {c}
                  </Link>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <MiniStat n="₹18L" l="Avg. senior CTC" />
                <MiniStat n="42%" l="Remote-friendly" />
                <MiniStat n="800+" l="Indian employers" />
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-md border border-slate-200">
                <img
                  src="https://images.pexels.com/photos/3760613/pexels-photo-3760613.jpeg?auto=compress&cs=tinysrgb&w=1400&q=80"
                  alt="Indian professional working"
                  className="h-[440px] w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 rounded-md border border-white/20 bg-[#0B1528]/85 p-4 backdrop-blur">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Spotlight</div>
                  <div className="font-display mt-1 text-lg font-extrabold text-white">
                    "I docked a remote senior role at a Berlin company — from Pune."
                  </div>
                  <div className="mt-1 text-xs text-slate-300">Aarav Sharma · Engineering Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-gradient-to-br from-[#0B1528] to-[#0077B6] p-10 text-white lg:p-16">
            <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <h2 className="font-display text-4xl font-extrabold tracking-tight lg:text-5xl">
                  Ready to set sail?
                </h2>
                <p className="mt-4 max-w-xl text-base text-slate-200">
                  Create a free profile, set your job alerts, and let Jobsboats bring opportunities to your desk.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <Link to="/register" data-testid="footer-cta-signup">
                  <Button className="bg-[#FF5959] hover:bg-[#ff4040] text-white px-6 py-6 text-base font-bold">
                    Create free account
                  </Button>
                </Link>
                <Link to="/jobs">
                  <Button
                    variant="outline"
                    className="border-white/30 bg-white/10 px-6 py-6 text-base font-bold text-white hover:bg-white hover:text-[#0B1528]"
                  >
                    Browse jobs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div className="font-display text-2xl font-black text-white sm:text-3xl">{n}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-slate-400">{l}</div>
    </div>
  );
}

function MiniStat({ n, l }) {
  return (
    <div className="rounded-md border border-slate-200 bg-[#F8FAFC] p-4">
      <div className="font-display text-xl font-extrabold text-[#0B1528]">{n}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">{l}</div>
    </div>
  );
}

function BenefitCard({ tone, kicker, title, items, cta, testid }) {
  const dark = tone === "dark";
  return (
    <div
      data-testid={testid}
      className={`rounded-md border p-8 lg:p-10 ${
        dark ? "border-[#0B1528] bg-[#0B1528] text-white" : "border-slate-200 bg-white text-[#0B1528]"
      }`}
    >
      <div className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-[#00B4D8]" : "text-[#FF5959]"}`}>
        {kicker}
      </div>
      <h3 className="font-display mt-3 text-3xl font-extrabold tracking-tight lg:text-4xl">{title}</h3>
      <ul className="mt-6 space-y-3">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-3 text-sm">
            <Check
              className={`mt-0.5 h-5 w-5 flex-none ${dark ? "text-[#00B4D8]" : "text-[#0B1528]"}`}
            />
            <span className={dark ? "text-slate-200" : "text-slate-700"}>{it}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link to={cta.to}>
          <Button
            className={
              dark
                ? "bg-[#00B4D8] hover:bg-[#0096b8] text-white rounded-md"
                : "bg-[#0B1528] hover:bg-black text-white rounded-md"
            }
          >
            {cta.label} →
          </Button>
        </Link>
      </div>
    </div>
  );
}
