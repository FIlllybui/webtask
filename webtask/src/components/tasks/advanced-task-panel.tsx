"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ApiTag, ApiTask, ApiUser } from "@/lib/api-types";
import { TaskPriorityValues, TaskStatusValues, type TaskPriority, type TaskStatus } from "@/lib/task-types";
import { cn } from "@/lib/utils";
import { Calendar, CheckSquare, FileText, History, MessageSquareText, Play, Plus, Trash2, X } from "lucide-react";

type Subtask = { id: string; title: string; checked: boolean; order: number };
type Comment = { id: string; body: string; createdAt: string; author: { id: string; handle: string; name?: string } };
type Attachment = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  mimeType?: string;
  sizeBytes?: number;
  isCover?: boolean;
};
type Activity = { id: string; type: string; message: string; createdAt: string };
type TaskList = { id: string; name: string };

const statusLabel: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To‑Do",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  DONE: "Done",
};

const statusTone: Record<TaskStatus, string> = {
  BACKLOG: "bg-muted text-foreground",
  TODO: "bg-sky-500/10 text-sky-700",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700",
  REVIEW: "bg-violet-500/10 text-violet-700",
  DONE: "bg-emerald-500/10 text-emerald-700",
};

export function AdvancedTaskPanel({
  open,
  onOpenChange,
  task,
  users,
  tags,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ApiTask | null;
  users: ApiUser[];
  tags: ApiTag[];
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("BACKLOG");
  const [priority, setPriority] = useState<TaskPriority>("MID");
  const [assigneeId, setAssigneeId] = useState<string | "none">("none");
  const [dueAtLocal, setDueAtLocal] = useState<string>("");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState<string | "none">("none");
  const [lists, setLists] = useState<TaskList[]>([]);
  const [newListName, setNewListName] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const assignee = useMemo(
    () => users.find((u) => u.id === (assigneeId === "none" ? "" : assigneeId)) ?? null,
    [users, assigneeId],
  );

  useEffect(() => {
    if (!open) return;
    if (!task) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as any;
        const t = json.task as any;
        if (cancelled) return;
        setTitle(t.title);
        setStatus(t.status);
        setPriority(t.priority);
        setAssigneeId(t.assignee?.id ?? "none");
        setDescription(t.description ?? "");
        setDueAtLocal(t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 16) : "");
        setListId(t.list?.id ?? "none");

        setSubtasks((t.subtasks ?? []) as Subtask[]);
        setComments((t.comments ?? []) as Comment[]);
        setAttachments((t.attachments ?? []) as Attachment[]);
        setActivities(
          (t.activities ?? []).map((a: any) => ({
            id: a.id,
            type: a.type,
            message: a.message,
            createdAt: a.createdAt,
          })),
        );

        // load lists for this task's project
        const projectId = t.project?.id as string | undefined;
        if (projectId) {
          const lr = await fetch(`/api/task-lists?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
          if (lr.ok) {
            const lj = (await lr.json()) as { lists: TaskList[] };
            setLists(lj.lists);
          }
        } else {
          setLists([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, task?.id]);

  async function saveProperties() {
    if (!task) return;
    setSaving(true);
    const payload = {
      title,
      status,
      priority,
      assigneeId: assigneeId === "none" ? null : assigneeId,
      dueAt: dueAtLocal ? new Date(dueAtLocal).toISOString() : null,
      listId: listId === "none" ? null : listId,
      description,
    };
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const refreshed = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
      if (refreshed.ok) {
        const json = (await refreshed.json()) as any;
        setActivities(
          (json.task.activities ?? []).map((a: any) => ({
            id: a.id,
            type: a.type,
            message: a.message,
            createdAt: a.createdAt,
          })),
        );
      }
    }
  }

  async function createList() {
    const name = newListName.trim();
    if (!name || !task) return;
    // need project id from task GET response; easiest is re-fetch once
    const res = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as any;
    const projectId = json.task.project?.id as string | undefined;
    if (!projectId) return;

    const cr = await fetch("/api/task-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name }),
    });
    if (!cr.ok) return;
    const cj = (await cr.json()) as { list: TaskList };
    setLists((prev) => [...prev, cj.list].sort((a, b) => a.name.localeCompare(b.name)));
    setListId(cj.list.id);
    setNewListName("");
  }

  async function addSubtask() {
    const t = newSubtask.trim();
    if (!t) return;
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t }),
    });
    if (res.ok) {
      const json = (await res.json()) as any;
      setSubtasks((prev) => [...prev, json.subtask].sort((a, b) => a.order - b.order));
      // refresh activity
      const refreshed = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
      if (refreshed.ok) {
        const tj = (await refreshed.json()) as any;
        setActivities(
          (tj.task.activities ?? []).map((a: any) => ({
            id: a.id,
            type: a.type,
            message: a.message,
            createdAt: a.createdAt,
          })),
        );
      }
    }
    setNewSubtask("");
  }

  async function toggleSubtask(s: Subtask) {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/subtasks/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !s.checked }),
    });
    if (res.ok) {
      const json = (await res.json()) as any;
      setSubtasks((prev) => prev.map((x) => (x.id === s.id ? json.subtask : x)));
      const refreshed = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
      if (refreshed.ok) {
        const tj = (await refreshed.json()) as any;
        setActivities(
          (tj.task.activities ?? []).map((a: any) => ({
            id: a.id,
            type: a.type,
            message: a.message,
            createdAt: a.createdAt,
          })),
        );
      }
    }
  }

  async function removeSubtask(s: Subtask) {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/subtasks/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      setSubtasks((prev) => prev.filter((x) => x.id !== s.id));
      const refreshed = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
      if (refreshed.ok) {
        const tj = (await refreshed.json()) as any;
        setActivities(
          (tj.task.activities ?? []).map((a: any) => ({
            id: a.id,
            type: a.type,
            message: a.message,
            createdAt: a.createdAt,
          })),
        );
      }
    }
  }

  async function addComment() {
    const t = commentBody.trim();
    if (!t) return;
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: t }),
    });
    if (res.ok) {
      const json = (await res.json()) as any;
      setComments((prev) => [json.comment, ...prev]);
      const refreshed = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
      if (refreshed.ok) {
        const tj = (await refreshed.json()) as any;
        setActivities(
          (tj.task.activities ?? []).map((a: any) => ({
            id: a.id,
            type: a.type,
            message: a.message,
            createdAt: a.createdAt,
          })),
        );
      }
    }
    setCommentBody("");
  }

  async function addMockAttachment(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    if (!task) return;
    // upload to local storage under /public/uploads
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(`/api/tasks/${task.id}/attachments/upload`, { method: "POST", body: fd });
    if (res.ok) {
      const json = (await res.json()) as any;
      setAttachments((prev) => [json.attachment, ...prev]);
      const refreshed = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
      if (refreshed.ok) {
        const tj = (await refreshed.json()) as any;
        setActivities(
          (tj.task.activities ?? []).map((a: any) => ({
            id: a.id,
            type: a.type,
            message: a.message,
            createdAt: a.createdAt,
          })),
        );
      }
    }
  }

  async function removeAttachment(a: Attachment) {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/attachments/${a.id}`, { method: "DELETE" });
    if (res.ok) {
      setAttachments((prev) => prev.filter((x) => x.id !== a.id));
      const refreshed = await fetch(`/api/tasks/${task.id}`, { cache: "no-store" });
      if (refreshed.ok) {
        const tj = (await refreshed.json()) as any;
        setActivities(
          (tj.task.activities ?? []).map((a2: any) => ({
            id: a2.id,
            type: a2.type,
            message: a2.message,
            createdAt: a2.createdAt,
          })),
        );
      }
    }
  }

  async function setCover(a: Attachment) {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}/attachments/${a.id}/cover`, { method: "POST" });
    if (res.ok) {
      setAttachments((prev) => prev.map((x) => ({ ...x, isCover: x.id === a.id })));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-6xl"
      >
        <DialogHeader className="border-b bg-background px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="truncate text-base font-semibold">
              {task ? task.title : "Task"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="grid max-h-[85vh] min-h-[70vh] grid-cols-1 md:grid-cols-[340px_1fr]">
          {/* Left pane: properties */}
          <div className="border-b p-5 md:border-b-0 md:border-r overflow-auto">
            <div className="space-y-5">
              <div className="grid gap-2">
                <Label>Group / List</Label>
                <Select value={listId} onValueChange={(v) => setListId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No list</SelectItem>
                    {lists.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Create new list…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createList();
                    }}
                  />
                  <Button variant="secondary" onClick={createList} disabled={!newListName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Task name</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label>Owner / Assignee</Label>
                <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        @{u.handle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignee ? (
                  <div className="text-xs text-muted-foreground">Assigned to {assignee.name}</div>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TaskStatusValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabel[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn("rounded-full px-2 py-1", statusTone[status])}>
                    {statusLabel[status]}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {TaskPriorityValues.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due date
                </Label>
                <Input type="datetime-local" value={dueAtLocal} onChange={(e) => setDueAtLocal(e.target.value)} />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Subtasks / Checklist
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add a subtask…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addSubtask();
                    }}
                  />
                  <Button variant="secondary" onClick={addSubtask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {subtasks.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={s.checked} onChange={() => toggleSubtask(s)} />
                      <span className={cn("min-w-0 flex-1 truncate text-sm", s.checked && "line-through text-muted-foreground")}>
                        {s.title}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => removeSubtask(s)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove subtask</span>
                      </Button>
                    </div>
                  ))}
                  {subtasks.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No subtasks yet.</div>
                  ) : null}
                </div>
              </div>

              <Button onClick={saveProperties} disabled={!task || saving} className="w-full">
                {saving ? "Saving…" : "Save"}
              </Button>

              {tags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {task?.tags?.slice(0, 6).map((t) => (
                    <Badge key={t.id} variant="outline">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right pane: tabs */}
          <div className="min-w-0 p-5 overflow-auto">
            <Tabs defaultValue="notes" className="h-full min-w-0">
              <TabsList
                variant="line"
                className="w-full justify-start gap-1 bg-transparent p-0 overflow-x-auto"
              >
                <TabsTrigger value="notes" className="gap-2 px-3">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Notes</span>
                </TabsTrigger>
                <TabsTrigger value="updates" className="gap-2 px-3">
                  <MessageSquareText className="h-4 w-4" />
                  <span className="hidden sm:inline">Updates</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2 px-3">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Files</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2 px-3">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Activity</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="mt-4 space-y-3">
                <div className="text-sm font-medium">Description / Notes (Markdown)</div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[360px] resize-y"
                  placeholder="Write notes in Markdown…"
                />
                <div className="text-xs text-muted-foreground">
                  (ถัดไปเราจะเพิ่ม preview / rich editor และ activity tracking อัตโนมัติ)
                </div>
              </TabsContent>

              <TabsContent value="updates" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Updates</div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Post an update…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addComment();
                    }}
                  />
                  <Button variant="secondary" onClick={addComment}>
                    Post
                  </Button>
                </div>
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-xl border bg-card p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-xs font-semibold text-foreground">@{c.author.handle}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-2 text-sm">{c.body}</div>
                    </div>
                  ))}
                  {comments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No updates yet.</div>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="files" className="mt-4 space-y-3">
                <div className="text-sm font-medium">Files</div>
                <div className="rounded-xl border border-dashed p-5">
                  <div className="text-sm text-muted-foreground">
                    Drop files here (simulated storage for now) or choose a file.
                  </div>
                  <div className="mt-3">
                    <Input type="file" accept="image/*,video/*" onChange={(e) => addMockAttachment(e.target.files)} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {attachments.map((a) => (
                    <div key={a.id} className="rounded-xl border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-medium">{a.name}</div>
                            {a.isCover ? (
                              <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                                Cover
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">{a.url}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeAttachment(a)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove attachment</span>
                        </Button>
                      </div>

                      {(a.mimeType?.startsWith("image/") || a.mimeType?.startsWith("video/")) && a.url.startsWith("/") ? (
                        <div className="mt-3 overflow-hidden rounded-lg border bg-muted">
                          {a.mimeType?.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.url} alt="" className="aspect-[16/9] w-full object-cover" />
                          ) : (
                            <div className="relative aspect-[16/9] w-full bg-black/10">
                              <div className="absolute inset-0 grid place-items-center">
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white">
                                  <Play className="h-5 w-5" />
                                </div>
                              </div>
                              <video src={a.url} className="h-full w-full object-cover" controls preload="metadata" />
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="mt-3 flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCover(a)} disabled={!!a.isCover}>
                          Set as cover
                        </Button>
                      </div>
                    </div>
                  ))}
                  {attachments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No files attached yet.</div>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4 space-y-3">
                <div className="text-sm font-medium">Activity log</div>
                <div className="space-y-2">
                  {activities.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border bg-card p-3">
                      <div className="text-sm">
                        <span className="font-medium">{a.type}</span>{" "}
                        <span className="text-muted-foreground">{a.message}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

