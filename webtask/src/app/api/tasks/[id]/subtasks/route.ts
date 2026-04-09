import { NextResponse } from "next/server";

import { logTaskActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const max = await prisma.taskSubtask.aggregate({
    where: { taskId },
    _max: { order: true },
  });
  const nextOrder = (max._max.order ?? 0) + 1;

  const created = await prisma.taskSubtask.create({
    data: { taskId, title: parsed.data.title, order: nextOrder },
  });

  await logTaskActivity({
    taskId,
    type: "SUBTASKS_CHANGED",
    message: `Added subtask: ${created.title}`,
  });

  return NextResponse.json({
    subtask: { id: created.id, title: created.title, checked: created.checked, order: created.order },
  }, { status: 201 });
}

