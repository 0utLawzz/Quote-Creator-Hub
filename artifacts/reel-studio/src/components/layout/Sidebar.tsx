import * as React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, PenTool, Library, CalendarDays, Upload, Clapperboard, Wifi, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard",    href: "/",       icon: LayoutDashboard },
  { name: "Create Reel",  href: "/create", icon: PenTool },
  { name: "Library",      href: "/library",icon: Library },
  { name: "Schedule",     href: "/schedule",icon: CalendarDays },
  { name: "Bulk Import",  href: "/import", icon: Upload },
];

const bottomNavigation = [
  { name: "Growth Guide",    href: "/strategy", icon: TrendingUp },
  { name: "Social Connect",  href: "/connect",  icon: Wifi },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Clapperboard size={20} strokeWidth={2.5} />
          </div>
          <span className="font-sans font-bold text-lg tracking-wide text-foreground">
            REEL<span className="text-primary">STUDIO</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                size={18}
                className={cn("transition-colors", isActive ? "text-primary" : "text-sidebar-foreground/60")}
              />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-sidebar-border/30 space-y-1.5">
          {bottomNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  size={18}
                  className={cn("transition-colors", isActive ? "text-primary" : "text-sidebar-foreground/60")}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-6 border-t border-sidebar-border/50">
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">PRO PLAN</p>
          <p className="text-sm font-semibold mb-3">Unlimited Renders</p>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
