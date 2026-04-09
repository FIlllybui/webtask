import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { z } from "zod";

const QuerySchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  excludeId: z.string().optional(),
  attendeeIds: z.string().optional(), // comma-separated
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    startTime: url.searchParams.get("startTime") ?? "",
    endTime: url.searchParams.get("endTime") ?? "",
    excludeId: url.searchParams.get("excludeId") ?? undefined,
    attendeeIds: url.searchParams.get("attendeeIds") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const start = new Date(parsed.data.startTime);
  const end = new Date(parsed.data.endTime);
  const excludeId = parsed.data.excludeId;

  const attendeeIds = (parsed.data.attendeeIds ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Overlap logic: existing.start < proposed.end AND existing.end > proposed.start
  const conflicts = await prisma.meeting.findMany({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startTime: { lt: end },
      endTime: { gt: start },
      ...(attendeeIds.length
        ? {
            attendees: {
              some: { userId: { in: attendeeIds } },
            },
          }
        : {}),
    },
    include: {
      attendees: { include: { user: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({
    ok: true,
    hasConflicts: conflicts.length > 0,
    conflicts: conflicts.map((m) => ({
      id: m.id,
      title: m.title,
      startTime: m.startTime.toISOString(),
      endTime: m.endTime.toISOString(),
      attendees: m.attendees.map((a) => ({ id: a.user.id, handle: a.user.handle })),
    })),
  });
}

