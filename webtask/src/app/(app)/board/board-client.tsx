"use client";

import { useMemo, useState } from "react";

import { KanbanBoard } from "@/components/board/kanban-board";
import { TaskDialog } from "@/components/board/task-dialog";
import type { ApiTag, ApiTask, ApiUser } from "@/lib/api-types";

export function BoardClient({
  initialTasks,
  users,
  tags,
}: {
  initialTasks: ApiTask[];
  users: ApiUser[];
  tags: ApiTag[];
}) {
  const [tasks, setTasks] = useState<ApiTask[]>(initialTasks);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => tasks.find((t) => t.id === selectedId) ?? null, [tasks, selectedId]);

  return (
    <>
      <KanbanBoard
        initialTasks={tasks}
        users={users}
        tags={tags}
        onCreate={() => {
          setSelectedId(null);
          setOpen(true);
        }}
        onEdit={(t) => {
          setSelectedId(t.id);
          setOpen(true);
        }}
      />

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        task={selected}
        users={users}
        tags={tags}
        onSaved={(task) => {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === task.id);
            return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
          });
        }}
        onDeleted={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
      />
    </>
  );
}

