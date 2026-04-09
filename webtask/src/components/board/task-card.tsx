import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ApiTask } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { Play, User } from "lucide-react";

import { PriorityPill } from "./priority-pill";

export function TaskCard({
  task,
  dragging,
  onClick,
}: {
  task: ApiTask;
  dragging?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className={cn(
        "cursor-pointer select-none overflow-hidden p-0 transition-colors hover:bg-muted/40",
        dragging && "opacity-70 ring-2 ring-ring/40",
      )}
    >
      {task.cover ? (
        <div className="relative aspect-[16/9] w-full bg-muted">
          {task.cover.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={task.cover.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 grid place-items-center bg-black/20">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white">
                  <Play className="h-5 w-5" />
                </div>
              </div>
              <div className="h-full w-full bg-gradient-to-br from-muted to-background" />
            </>
          )}
        </div>
      ) : null}

      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{task.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PriorityPill priority={task.priority} />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {task.assignee?.handle ?? "Unassigned"}
              </span>
            </div>
          </div>
        </div>

        {task.tags.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.tags.slice(0, 3).map((t) => (
              <Badge key={t.id} variant="outline" className="text-xs">
                {t.name}
              </Badge>
            ))}
            {task.tags.length > 3 ? (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{task.tags.length - 3}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

