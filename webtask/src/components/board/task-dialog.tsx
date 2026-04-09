"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiTag, ApiTask, ApiUser } from "@/lib/api-types";
import { TaskPriorityValues, TaskStatusValues } from "@/lib/task-types";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type FormState = {
  title: string;
  description: string;
  status: ApiTask["status"];
  priority: ApiTask["priority"];
  assigneeId: string | "none";
  tagIds: string[];
};

function toForm(task: ApiTask | null): FormState {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "BACKLOG",
    priority: task?.priority ?? "MID",
    assigneeId: task?.assignee?.id ?? "none",
    tagIds: task?.tags?.map((t) => t.id) ?? [],
  };
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  users,
  tags,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ApiTask | null;
  users: ApiUser[];
  tags: ApiTag[];
  onSaved: (task: ApiTask) => void;
  onDeleted: (id: string) => void;
}) {
  const isEdit = !!task;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<FormState>(() => toForm(task));

  // reset form when switching tasks/opening
  useMemo(() => {
    setForm(toForm(task));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, open]);

  function toggleTag(id: string) {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id) ? prev.tagIds.filter((x) => x !== id) : [...prev.tagIds, id],
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        assigneeId: form.assigneeId === "none" ? null : form.assigneeId,
        tagIds: form.tagIds,
      };

      const res = await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = (await res.json()) as { task: ApiTask };
      onSaved(json.task);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!task) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted(task.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Short, specific title…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Markdown)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Write details in markdown…"
              className="min-h-32"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {TaskStatusValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((p) => ({ ...p, priority: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {TaskPriorityValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select
                value={form.assigneeId}
                onValueChange={(v) => setForm((p) => ({ ...p, assigneeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.handle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const active = form.tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={cn(
                      "rounded-full",
                      active ? "ring-2 ring-ring/40" : "opacity-90 hover:opacity-100",
                    )}
                  >
                    <Badge variant={active ? "secondary" : "outline"}>{t.name}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEdit ? (
            <Button
              variant="destructive"
              className="mr-auto gap-2"
              onClick={del}
              disabled={deleting || saving}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || deleting || form.title.trim().length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

