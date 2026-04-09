"use client";

import { usePathname } from "next/navigation";

import { SidebarNav } from "@/components/app/sidebar-nav";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:bg-sidebar md:text-sidebar-foreground">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 text-sm font-semibold">
            WT
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">WebTask</div>
            <div className="text-xs text-white/70">2-person team</div>
          </div>
        </div>
      </div>

      <div className="px-3">
        <Separator className="bg-white/15" />
      </div>

      <div className="flex-1 overflow-auto p-3">
        <SidebarNav pathname={pathname} />
      </div>

      <div className="px-3">
        <Separator className="bg-white/15" />
      </div>

      <div className="flex items-center gap-3 p-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xs font-semibold">
          DT
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">Dev team</div>
          <div className="truncate text-xs text-white/70">Online</div>
        </div>
      </div>
    </aside>
  );
}

