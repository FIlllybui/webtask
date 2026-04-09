"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg, type EventClickArg } from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { addHours } from "date-fns";
import { useMemo, useState } from "react";

import { MeetingDialog } from "@/components/calendar/meeting-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiMeeting, ApiTag, ApiTask, ApiUser } from "@/lib/api-types";
import { cn } from "@/lib/utils";

type DraftMeeting = {
  title: string;
  dueAt: string; // ISO
};

export function CalendarClient({
  initialTasks,
  initialMeetings,
  users,
}: {
  initialTasks: ApiTask[];
  initialMeetings: ApiMeeting[];
  users: ApiUser[];
  tags: ApiTag[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [meetings, setMeetings] = useState(initialMeetings);

  const [openTask, setOpenTask] = useState(false);
  const [openMeeting, setOpenMeeting] = useState(false);
  const [draftTask, setDraftTask] = useState<DraftMeeting | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [initialMeetingStartIso, setInitialMeetingStartIso] = useState<string | undefined>(undefined);

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m.id === selectedMeetingId) ?? null,
    [meetings, selectedMeetingId],
  );

  const events = useMemo(() => {
    const taskEvents = tasks
      .filter((t) => !!t.dueAt)
      .map((t) => ({
        id: `task:${t.id}`,
        title: `Due: ${t.title}`,
        start: t.dueAt!,
        allDay: true,
        backgroundColor: "rgba(99,102,241,0.15)",
        borderColor: "rgba(99,102,241,0.35)",
        textColor: "rgb(226,232,240)",
        extendedProps: { kind: "task", taskId: t.id },
      }));

    const meetingEvents = meetings.map((m) => ({
      id: `meeting:${m.id}`,
      title: m.title,
      start: m.startTime,
      end: m.endTime,
      backgroundColor: "rgba(16,185,129,0.15)",
      borderColor: "rgba(16,185,129,0.35)",
      textColor: "rgb(226,232,240)",
      extendedProps: { kind: "meeting", meetingId: m.id },
    }));

    return [...taskEvents, ...meetingEvents];
  }, [tasks, meetings]);

  function onDateClick(arg: DateClickArg) {
    const start = arg.allDay ? new Date(arg.dateStr) : new Date(arg.date);
    setDraftTask({ title: "", dueAt: start.toISOString() });
    setSelectedMeetingId(null);
    setInitialMeetingStartIso(start.toISOString());
    // choose dialog: default to meeting, but allow quick task
    setOpenMeeting(true);
  }

  function onEventClick(arg: EventClickArg) {
    const kind = (arg.event.extendedProps as any)?.kind as string | undefined;
    if (kind === "meeting") {
      const id = String((arg.event.extendedProps as any).meetingId);
      setSelectedMeetingId(id);
      setInitialMeetingStartIso(undefined);
      setOpenMeeting(true);
    }
  }

  async function createTask() {
    if (!draftTask) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draftTask.title,
        dueAt: draftTask.dueAt,
      }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { task: ApiTask };
    setTasks((prev) => [json.task, ...prev]);
    setOpenTask(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Tasks with due dates and team meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setOpenTask(true)}>
            New task
          </Button>
          <Button
            onClick={() => {
              setSelectedMeetingId(null);
              setInitialMeetingStartIso(undefined);
              setOpenMeeting(true);
            }}
          >
            New meeting
          </Button>
        </div>
      </div>

      <div className={cn("rounded-xl border bg-card p-2", "fc-dark")}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="calc(100dvh - 10.5rem)"
          events={events}
          nowIndicator
          selectable
          dateClick={onDateClick}
          eventClick={onEventClick}
        />
      </div>

      <Dialog open={openTask} onOpenChange={setOpenTask}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New task (quick)</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={draftTask?.title ?? ""}
                onChange={(e) => setDraftTask((d) => (d ? { ...d, title: e.target.value } : d))}
                placeholder="e.g. Fix collision bug"
              />
            </div>
            <div className="grid gap-2">
              <Label>Due at (ISO)</Label>
              <Input
                value={draftTask?.dueAt ?? ""}
                onChange={(e) => setDraftTask((d) => (d ? { ...d, dueAt: e.target.value } : d))}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenTask(false)}>
                Cancel
              </Button>
              <Button onClick={createTask} disabled={!draftTask?.title.trim() || !draftTask?.dueAt}>
                Create task
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <MeetingDialog
        open={openMeeting}
        onOpenChange={setOpenMeeting}
        users={users}
        meeting={selectedMeeting}
        initialStartIso={initialMeetingStartIso}
        onCreated={(m) => setMeetings((prev) => [...prev, m].sort((a, b) => a.startTime.localeCompare(b.startTime)))}
        onUpdated={(m) => setMeetings((prev) => prev.map((x) => (x.id === m.id ? m : x)))}
        onDeleted={(id) => setMeetings((prev) => prev.filter((x) => x.id !== id))}
      />
    </div>
  );
}

