import { prisma } from "@/lib/db";

import { CalendarClient } from "./calendar-client";

export default async function CalendarPage() {
  const [tasks, meetings, users, tags] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignee: true,
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.meeting.findMany({
      include: {
        attendees: { include: { user: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const normalizedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, handle: t.assignee.handle } : null,
    tags: t.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const normalizedMeetings = meetings.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    startTime: m.startTime.toISOString(),
    endTime: m.endTime.toISOString(),
    meetingLink: m.meetingLink,
    attendees: m.attendees.map((a) => ({
      id: a.user.id,
      name: a.user.name,
      handle: a.user.handle,
    })),
  }));

  const normalizedUsers = users.map((u) => ({ id: u.id, name: u.name, handle: u.handle }));
  const normalizedTags = tags.map((t) => ({ id: t.id, name: t.name }));

  return (
    <CalendarClient
      initialTasks={normalizedTasks}
      initialMeetings={normalizedMeetings}
      users={normalizedUsers}
      tags={normalizedTags}
    />
  );
}

