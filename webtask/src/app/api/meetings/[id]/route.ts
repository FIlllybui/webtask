import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { z } from "zod";

const MeetingPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(20_000).optional(),
  meetingLink: z.string().max(2000).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  attendeeIds: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  const parsed = MeetingPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.meeting.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.meetingLink !== undefined ? { meetingLink: data.meetingLink } : {}),
      ...(data.startTime !== undefined ? { startTime: new Date(data.startTime) } : {}),
      ...(data.endTime !== undefined ? { endTime: new Date(data.endTime) } : {}),
      ...(data.attendeeIds !== undefined
        ? {
            attendees: {
              deleteMany: { meetingId: id },
              create: data.attendeeIds.map((userId) => ({ userId })),
            },
          }
        : {}),
    },
    include: {
      attendees: { include: { user: true } },
    },
  });

  return NextResponse.json({
    meeting: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      meetingLink: updated.meetingLink,
      attendees: updated.attendees.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        handle: a.user.handle,
      })),
    },
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.meeting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

