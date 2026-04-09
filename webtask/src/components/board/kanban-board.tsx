"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";

import { TaskCard } from "@/components/board/task-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiTag, ApiTask, ApiUser } from "@/lib/api-types";
import { TaskStatusValues, type TaskStatus } from "@/lib/task-types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const columns: { status: TaskStatus; title: string }[] = [
  { status: "BACKLOG", title: "Backlog" },
  { status: "TODO", title: "To-Do" },
  { status: "IN_PROGRESS", title: "In Progress" },
  { status: "REVIEW", title: "Review" },
  { status: "DONE", title: "Done" },
];

function statusFromContainerId(containerId: string): TaskStatus | null {
  const match = TaskStatusValues.find((s) => `col:${s}` === containerId);
  return match ?? null;
}

function KanbanColumn({
  status,
  title,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus;
  title: string;
  tasks: ApiTask[];
  onTaskClick: (task: ApiTask) => void;
}) {
  return (
    <Card className="flex h-[calc(100dvh-8.5rem)] flex-col bg-card/60">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold">
          {title} <span className="text-muted-foreground">({tasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableTask key={t.id} task={t} onClick={() => onTaskClick(t)} />
          ))}
        </SortableContext>
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
            Drop a task here
          </div>
        ) : null}
      </CardContent>
      <div className="border-t p-2">
        <div className="text-xs text-muted-foreground">Status: {status}</div>
      </div>
    </Card>
  );
}

function SortableTask({ task, onClick }: { task: ApiTask; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task" as const },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} dragging={isDragging} onClick={onClick} />
    </div>
  );
}

export function KanbanBoard({
  initialTasks,
  users,
  tags,
  onCreate,
  onEdit,
}: {
  initialTasks: ApiTask[];
  users: ApiUser[];
  tags: ApiTag[];
  onCreate: () => void;
  onEdit: (task: ApiTask) => void;
}) {
  const [tasks, setTasks] = useState<ApiTask[]>(initialTasks);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, ApiTask[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  async function patchTask(id: string, patch: Partial<ApiTask>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update task");
    const json = (await res.json()) as { task: ApiTask };
    setTasks((prev) => prev.map((t) => (t.id === id ? json.task : t)));
  }

  async function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    // Determine destination status:
    // - if dropped on a column container: col:STATUS
    // - if dropped on another task: use that task's status
    const destinationStatus =
      statusFromContainerId(overId) ??
      tasks.find((t) => t.id === overId)?.status ??
      null;
    if (!destinationStatus) return;

    const current = tasks.find((t) => t.id === activeId);
    if (!current) return;
    if (current.status === destinationStatus) return;

    // optimistic update
    setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: destinationStatus } : t)));

    try {
      await patchTask(activeId, { status: destinationStatus });
    } catch {
      // revert on failure
      setTasks((prev) => prev.map((t) => (t.id === activeId ? current : t)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Board</h1>
          <p className="text-sm text-muted-foreground">
            Drag tasks across columns to change status.
          </p>
        </div>
        <Button className="gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((c) => (
            <DroppableColumn
              key={c.status}
              id={`col:${c.status}`}
              className="min-w-0"
            >
              <KanbanColumn
                status={c.status}
                title={c.title}
                tasks={byStatus[c.status]}
                onTaskClick={onEdit}
              />
            </DroppableColumn>
          ))}
        </div>
      </DndContext>

      <div className="text-xs text-muted-foreground">
        Users: {users.map((u) => u.handle).join(", ")} · Tags: {tags.map((t) => t.name).join(", ")}
      </div>
    </div>
  );
}

function DroppableColumn({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn("rounded-xl transition-colors", isOver && "ring-2 ring-ring/30", className)}
    >
      {children}
    </div>
  );
}

