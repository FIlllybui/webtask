"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { SidebarNav } from "@/components/app/sidebar-nav";
import { ProjectsNav } from "@/components/app/projects-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-r border-white/15">
        <SheetHeader className="px-4 py-3">
          <SheetTitle className="text-sidebar-foreground">WebTask</SheetTitle>
        </SheetHeader>
        <div className="px-3 pb-4">
          <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
          <div className="mt-5">
            <ProjectsNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

