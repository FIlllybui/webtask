import { NextResponse } from "next/server";

import { logTaskActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  checked: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; subtaskId: string }> }) {
  const { id: taskId, subtaskId } = await params;
  const json = await req.json();
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.taskSubtask.findUnique({ where: { id: subtaskId } });
  if (!before || before.taskId !== taskId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.taskSubtask.update({
    where: { id: subtaskId },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.checked !== undefined ? { checked: parsed.data.checked } : {}),
      ...(parsed.data.order !== undefined ? { order: parsed.data.order } : {}),
    },
  });

  if (parsed.data.checked !== undefined && before.checked !== updated.checked) {
    await logTaskActivity({
      taskId,
      type: "SUBTASKS_CHANGED",
      message: `${updated.checked ? "Checked" : "Unchecked"} subtask: ${updated.title}`,
    });
  } else if (parsed.data.title !== undefined && before.title !== updated.title) {
    await logTaskActivity({
      taskId,
      type: "SUBTASKS_CHANGED",
      message: `Renamed subtask`,
      data: { before: before.title, after: updated.title },
    });
  } else if (parsed.data.order !== undefined && before.order !== updated.order) {
    await logTaskActivity({
      taskId,
      type: "SUBTASKS_CHANGED",
      message: `Reordered subtasks`,
    });
  }

  return NextResponse.json({
    subtask: { id: updated.id, title: updated.title, checked: updated.checked, order: updated.order },
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; subtaskId: string }> }) {
  const { id: taskId, subtaskId } = await params;
  const before = await prisma.taskSubtask.findUnique({ where: { id: subtaskId } });
  if (!before || before.taskId !== taskId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.taskSubtask.delete({ where: { id: subtaskId } });
  await logTaskActivity({
    taskId,
    type: "SUBTASKS_CHANGED",
    message: `Removed subtask: ${before.title}`,
  });
  return NextResponse.json({ ok: true });
}

