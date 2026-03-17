import { ReactNode } from "react";
import { BottomNav, DesktopSidebar } from "./Navigation";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 md:hidden">
        <h1 className="text-xl font-display font-bold">
          <span className="text-gradient">Momentify</span>
        </h1>
      </header>

      {/* Main content */}
      <main className="md:ml-64 pb-20 md:pb-8">
        <div className="mx-auto max-w-2xl px-4 py-6">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
