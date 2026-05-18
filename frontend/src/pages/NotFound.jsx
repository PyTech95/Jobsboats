import { Link } from "react-router-dom";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center px-5 py-24 text-center lg:py-32">
        <div className="grid h-16 w-16 place-items-center rounded-md bg-[#0B1528] text-white">
          <Compass className="h-7 w-7" />
        </div>
        <div className="font-mono mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Error 404</div>
        <h1 className="font-display mt-3 text-5xl font-black tracking-tight text-[#0B1528] sm:text-6xl">
          You sailed off the chart.
        </h1>
        <p className="mt-4 max-w-lg text-base text-slate-600">
          We couldn't find that page. The harbor's right here — let's get you back on course.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/"><Button className="bg-[#0B1528] text-white">Back to home</Button></Link>
          <Link to="/jobs"><Button variant="outline">Search jobs</Button></Link>
        </div>
      </section>
    </PageShell>
  );
}
