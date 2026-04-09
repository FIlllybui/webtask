import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/task-types";

const labels: Record<TaskPriority, string> = {
  LOW: "Low",
  MID: "Mid",
  HIGH: "High",
  URGENT: "Urgent",
};

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border border-transparent",
        priority === "URGENT" && "bg-destructive/20 text-destructive border-destructive/30",
        priority === "HIGH" && "bg-orange-500/15 text-orange-300 border-orange-500/25",
      )}
    >
      {labels[priority]}
    </Badge>
  );
}

