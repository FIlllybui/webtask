import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { z } from "zod";

const MeetingCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(20_000).optional().default(""),
  meetingLink: z.string().max(2000).optional().default(""),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeIds: z.array(z.string()).optional().default([]),
});

export async function GET() {
  const meetings = await prisma.meeting.findMany({
    include: {
      attendees: { include: { user: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({
    meetings: meetings.map((m) => ({
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
    })),
  });
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = MeetingCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, meetingLink, startTime, endTime, attendeeIds } = parsed.data;
  const created = await prisma.meeting.create({
    data: {
      title,
      description,
      meetingLink,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees: {
        create: attendeeIds.map((userId) => ({ userId })),
      },
    },
    include: {
      attendees: { include: { user: true } },
    },
  });

  return NextResponse.json(
    {
      meeting: {
        id: created.id,
        title: created.title,
        description: created.description,
        startTime: created.startTime.toISOString(),
        endTime: created.endTime.toISOString(),
        meetingLink: created.meetingLink,
        attendees: created.attendees.map((a) => ({
          id: a.user.id,
          name: a.user.name,
          handle: a.user.handle,
        })),
      },
    },
    { status: 201 },
  );
}

