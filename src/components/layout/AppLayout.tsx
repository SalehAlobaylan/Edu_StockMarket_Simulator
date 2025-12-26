import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { FloatingDock } from "./FloatingDock";
import { AmbientBackground } from "./AmbientBackground";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <AmbientBackground />
      
      {/* Top navigation bar */}
      <TopBar />
      
      {/* Main content */}
      <main className="relative z-10 pt-24 md:pt-28 pb-28 px-4 md:px-6 lg:px-8">
        {children}
      </main>
      
      {/* Floating dock navigation */}
      <FloatingDock />
    </div>
  );
}
