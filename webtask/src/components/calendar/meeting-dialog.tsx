"use client";

import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiMeeting, ApiUser } from "@/lib/api-types";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { AlertTriangle, ExternalLink, Trash2 } from "lucide-react";

type Conflict = { id: string; title: string; startTime: string; endTime: string; attendees: { id: string; handle: string }[] };

type Draft = {
  title: string;
  description: string;
  meetingLink: string;
  startLocal: string;
  endLocal: string;
  attendeeIds: string[];
};

function meetingToDraft(m: ApiMeeting): Draft {
  return {
    title: m.title,
    description: m.description ?? "",
    meetingLink: m.meetingLink ?? "",
    startLocal: toDateTimeLocalValue(m.startTime),
    endLocal: toDateTimeLocalValue(m.endTime),
    attendeeIds: m.attendees.map((a) => a.id),
  };
}

export function MeetingDialog({
  open,
  onOpenChange,
  users,
  meeting,
  initialStartIso,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: ApiUser[];
  meeting: ApiMeeting | null;
  initialStartIso?: string; // for new meeting from date click
  onCreated: (m: ApiMeeting) => void;
  onUpdated: (m: ApiMeeting) => void;
  onDeleted: (id: string) => void;
}) {
  const isEdit = !!meeting;
  const defaultAttendees = useMemo(() => users.map((u) => u.id), [users]);

  const [draft, setDraft] = useState<Draft>(() => {
    const start = initialStartIso ?? new Date().toISOString();
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
    return {
      title: "",
      description: "",
      meetingLink: "",
      startLocal: toDateTimeLocalValue(start),
      endLocal: toDateTimeLocalValue(end),
      attendeeIds: defaultAttendees,
    };
  });

  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset when opening / switching meeting
  useEffect(() => {
    if (!open) return;
    if (meeting) {
      setDraft(meetingToDraft(meeting));
      setConflicts([]);
      return;
    }
    const start = initialStartIso ?? new Date().toISOString();
    const end = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
    setDraft({
      title: "",
      description: "",
      meetingLink: "",
      startLocal: toDateTimeLocalValue(start),
      endLocal: toDateTimeLocalValue(end),
      attendeeIds: defaultAttendees,
    });
    setConflicts([]);
  }, [open, meeting?.id, initialStartIso, defaultAttendees, meeting]);

  async function checkAvailability() {
    setChecking(true);
    try {
      const startTime = fromDateTimeLocalValue(draft.startLocal);
      const endTime = fromDateTimeLocalValue(draft.endLocal);
      const qs = new URLSearchParams({
        startTime,
        endTime,
        ...(meeting?.id ? { excludeId: meeting.id } : {}),
        attendeeIds: draft.attendeeIds.join(","),
      });
      const res = await fetch(`/api/meetings/availability?${qs.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as { conflicts: Conflict[]; hasConflicts: boolean };
      setConflicts(json.conflicts ?? []);
    } finally {
      setChecking(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title: draft.title,
        description: draft.description,
        meetingLink: draft.meetingLink,
        startTime: fromDateTimeLocalValue(draft.startLocal),
        endTime: fromDateTimeLocalValue(draft.endLocal),
        attendeeIds: draft.attendeeIds,
      };

      const res = await fetch(meeting ? `/api/meetings/${meeting.id}` : "/api/meetings", {
        method: meeting ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { meeting: ApiMeeting };
      meeting ? onUpdated(json.meeting) : onCreated(json.meeting);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function cancelMeeting() {
    if (!meeting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, { method: "DELETE" });
      if (!res.ok) return;
      onDeleted(meeting.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  function toggleAttendee(id: string) {
    setDraft((prev) => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(id)
        ? prev.attendeeIds.filter((x) => x !== id)
        : [...prev.attendeeIds, id],
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Meeting details" : "Schedule meeting"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={draft.title} onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              placeholder="Agenda, notes…"
            />
          </div>

          <div className="grid gap-2">
            <Label>Meeting link</Label>
            <Input
              value={draft.meetingLink}
              onChange={(e) => setDraft((p) => ({ ...p, meetingLink: e.target.value }))}
              placeholder="https://meet.google.com/…"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={draft.startLocal}
                onChange={(e) => setDraft((p) => ({ ...p, startLocal: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>End</Label>
              <Input
                type="datetime-local"
                value={draft.endLocal}
                onChange={(e) => setDraft((p) => ({ ...p, endLocal: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Attendees</Label>
              <Button variant="outline" size="sm" onClick={checkAvailability} disabled={checking}>
                {checking ? "Checking…" : "Check availability"}
              </Button>
            </div>
            <div className="grid gap-2 rounded-lg border p-3">
              {users.map((u) => {
                const checked = draft.attendeeIds.includes(u.id);
                return (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={checked} onCheckedChange={() => toggleAttendee(u.id)} />
                    <span className="flex-1">{u.name}</span>
                    <Badge variant="outline" className={cn("text-xs", checked ? "" : "opacity-60")}>
                      @{u.handle}
                    </Badge>
                  </label>
                );
              })}
              {draft.attendeeIds.length === 0 ? (
                <div className="text-xs text-muted-foreground">เลือกอย่างน้อย 1 คน</div>
              ) : null}
            </div>
          </div>

          {conflicts.length ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>พบเวลาชนกัน</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-xs">
                  {conflicts.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{c.title}</span>
                      <span className="text-muted-foreground">
                        {new Date(c.startTime).toLocaleString()} – {new Date(c.endTime).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        ({c.attendees.map((a) => `@${a.handle}`).join(", ")})
                      </span>
                    </div>
                  ))}
                  {conflicts.length > 4 ? (
                    <div className="text-muted-foreground">+{conflicts.length - 4} more…</div>
                  ) : null}
                </div>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEdit ? (
            <Button
              variant="destructive"
              className="mr-auto gap-2"
              onClick={cancelMeeting}
              disabled={deleting || saving}
            >
              <Trash2 className="h-4 w-4" />
              Cancel meeting
            </Button>
          ) : null}
          {meeting?.meetingLink ? (
            <Button asChild variant="secondary" className="gap-2">
              <a href={meeting.meetingLink} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Join
              </a>
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
            Close
          </Button>
          <Button
            onClick={save}
            disabled={saving || deleting || draft.title.trim().length === 0 || draft.attendeeIds.length === 0}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

