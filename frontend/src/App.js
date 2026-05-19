import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { QuickApplyProvider } from "@/context/QuickApplyContext";
import Home from "@/pages/Home";
import Jobs from "@/pages/Jobs";
import ForJobSeekers from "@/pages/ForJobSeekers";
import ForEmployers from "@/pages/ForEmployers";
import Services from "@/pages/Services";
import About from "@/pages/About";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SeekerDashboard from "@/pages/SeekerDashboard";
import EmployerDashboard from "@/pages/EmployerDashboard";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <QuickApplyProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/for-job-seekers" element={<ForJobSeekers />} />
            <Route path="/for-employers" element={<ForEmployers />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<SeekerDashboard />} />
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </QuickApplyProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
