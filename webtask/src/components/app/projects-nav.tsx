"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useProjectStore } from "@/lib/project-store";
import { cn } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

type Project = { id: string; name: string; slug: string; colorHex: string };

export function ProjectsNav({ onNavigate }: { onNavigate?: () => void }) {
  const search = useSearchParams();
  const selected = search.get("project") ?? "all";
  const setProjectId = useProjectStore((s) => s.setProjectId);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const json = (await res.json()) as { projects: Project[] };
      if (!cancelled) setProjects(json.projects);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => [{ id: "all", name: "All Projects", colorHex: "#999999" }, ...projects], [projects]);

  return (
    <div className="space-y-2">
      <div className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-white/60">
        PROJECTS
      </div>
      <div className="space-y-1">
        {items.map((p) => {
          const active = selected === p.id;
          const href = p.id === "all" ? "/board" : `/board?project=${encodeURIComponent(p.id)}`;
          return (
            <Link
              key={p.id}
              href={href}
              onClick={() => {
                setProjectId(p.id === "all" ? null : p.id);
                onNavigate?.();
              }}
              className={cn(
                "group relative inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                "text-white/85 hover:text-white hover:bg-white/10",
                active && "bg-white/14 text-white",
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: p.colorHex }}
                aria-hidden
              />
              <FolderKanban className="h-4 w-4 opacity-80" />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

