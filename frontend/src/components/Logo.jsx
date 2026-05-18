import { Link } from "react-router-dom";

export default function Logo({ light = false }) {
  return (
    <Link
      to="/"
      data-testid="brand-logo"
      className="flex items-center gap-2 font-display font-black text-lg tracking-tight"
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
          light ? "bg-white text-[#0B1528]" : "bg-[#0B1528] text-white"
        }`}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 18c2 1 4 1 6 0s4-1 6 0 4 1 6 0" strokeLinecap="round" />
          <path d="M5 14h14l-2 4H7l-2-4Z" strokeLinejoin="round" />
          <path d="M12 4v10" strokeLinecap="round" />
          <path d="M12 6l4 2H8l4-2Z" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={light ? "text-white" : "text-[#0B1528]"}>Jobsboats</span>
    </Link>
  );
}
