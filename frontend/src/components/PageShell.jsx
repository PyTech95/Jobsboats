import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PageShell({ children, hideFooter, hideNav }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {!hideNav && <Navbar />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
