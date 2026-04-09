import type { ApiTask } from "@/lib/api-types";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  extendedProps?: Record<string, unknown>;
};

export function taskToEvent(task: ApiTask & { dueAt?: string | null }) {
  if (!task.dueAt) return null;
  return {
    id: `task:${task.id}`,
    title: task.title,
    start: task.dueAt,
    allDay: true,
    extendedProps: { kind: "task", taskId: task.id },
  } satisfies CalendarEvent;
}

