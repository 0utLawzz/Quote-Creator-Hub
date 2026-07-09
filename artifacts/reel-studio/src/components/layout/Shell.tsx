import * as React from "react";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/hooks/use-theme";

export function Shell({ children }: { children: React.ReactNode }) {
  useTheme(); // Enforces dark mode

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative isolate pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        {/* Subtle cinematic glow effect in the background */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 opacity-50" />
        <div className="relative z-10 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
