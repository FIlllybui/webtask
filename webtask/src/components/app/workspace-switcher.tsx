"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus } from "lucide-react";

export function WorkspaceSwitcher() {
  // single-workspace for now (self-hosted); structured like Slack for future expansion
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left",
          "text-sidebar-foreground hover:bg-white/10 hover:text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        )}
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-5">WebTask</div>
          <div className="truncate text-xs text-white/70">Dev workspace</div>
        </div>
        <ChevronDown className="h-4 w-4 opacity-80" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>WebTask (current)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" disabled>
          <Plus className="h-4 w-4" />
          Add workspace (soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

