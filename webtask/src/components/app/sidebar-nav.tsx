import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarDays, Columns3, LayoutDashboard, ListChecks } from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  group?: string;
};

const items: SidebarNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, group: "Views" },
  { href: "/board", label: "Board", icon: <Columns3 className="h-4 w-4" />, group: "Views" },
  { href: "/calendar", label: "Calendar", icon: <CalendarDays className="h-4 w-4" />, group: "Views" },
  { href: "/tasks", label: "Tasks", icon: <ListChecks className="h-4 w-4" />, group: "Views" },
];

export function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const groups = Array.from(new Set(items.map((i) => i.group ?? "Navigation")));
  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group} className="space-y-1">
          <div className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-white/60">
            {group.toUpperCase()}
          </div>
          {items
            .filter((i) => (i.group ?? "Navigation") === group)
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative inline-flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    "text-white/85 hover:text-white hover:bg-white/10",
                    active && "bg-white/14 text-white",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-1 top-1/2 h-4 -translate-y-1/2 rounded-full bg-white/80 transition-opacity",
                      active ? "w-1 opacity-100" : "w-1 opacity-0 group-hover:opacity-40",
                    )}
                  />
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? <Badge variant="secondary">{item.badge}</Badge> : null}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}

