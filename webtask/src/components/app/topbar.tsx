"use client";

import { MobileNav } from "@/components/app/mobile-nav";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border/70 bg-background px-4">
      <MobileNav />
      <div className="flex flex-1 items-center">
        <div className="text-sm font-semibold text-foreground">Task Manager</div>
      </div>
      <Button size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        New task
      </Button>
    </header>
  );
}

