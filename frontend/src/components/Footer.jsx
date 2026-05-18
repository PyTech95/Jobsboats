import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-[#0B1528] text-slate-300" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-14 md:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo light />
          <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Aggregated jobs, premium career services, and tools that help you dock the right opportunity.
          </p>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Product</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/jobs" className="hover:text-white">Find Jobs</Link></li>
            <li><Link to="/for-job-seekers" className="hover:text-white">For Job Seekers</Link></li>
            <li><Link to="/for-employers" className="hover:text-white">For Employers</Link></li>
            <li><Link to="/services" className="hover:text-white">Services</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Company</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
            <li><a href="#" className="hover:text-white">Press</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#00B4D8]">Stay on course</div>
          <p className="mt-4 text-sm text-slate-400">
            Weekly tips on careers, hiring, and the open seas of work.
          </p>
          <form
            className="mt-4 flex"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              type="email"
              required
              placeholder="you@email.com"
              data-testid="footer-newsletter-input"
              className="w-full rounded-l-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#00B4D8] focus:outline-none"
            />
            <button
              type="submit"
              data-testid="footer-newsletter-submit"
              className="rounded-r-md bg-[#00B4D8] px-4 text-sm font-bold text-white hover:bg-[#0096b8]"
            >
              Sign up
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-slate-500 md:flex-row lg:px-8">
          <div>© {new Date().getFullYear()} Jobsboats. Charting careers worldwide.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-200">Privacy</a>
            <a href="#" className="hover:text-slate-200">Terms</a>
            <a href="#" className="hover:text-slate-200">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
