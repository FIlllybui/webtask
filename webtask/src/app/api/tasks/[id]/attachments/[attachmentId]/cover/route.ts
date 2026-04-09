import { NextResponse } from "next/server";

import { logTaskActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function POST(_: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const { id: taskId, attachmentId } = await params;

  const att = await prisma.taskAttachment.findUnique({ where: { id: attachmentId } });
  if (!att || att.taskId !== taskId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.taskAttachment.updateMany({ where: { taskId }, data: { isCover: false } }),
    prisma.taskAttachment.update({ where: { id: attachmentId }, data: { isCover: true } }),
  ]);

  await logTaskActivity({
    taskId,
    type: "UPDATED",
    message: `Set cover: ${att.name}`,
  });

  return NextResponse.json({ ok: true });
}

