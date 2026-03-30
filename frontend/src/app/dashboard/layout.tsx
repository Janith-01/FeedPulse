import { AuthProvider } from "@/context/AuthContext";
import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - FeedPulse",
  description: "Manage product feedback effortlessly.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans">
        {children}
      </div>
    </AuthProvider>
  );
}
