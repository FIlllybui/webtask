import { NextResponse } from "next/server";

import { logTaskActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const { id: taskId, attachmentId } = await params;
  const before = await prisma.taskAttachment.findUnique({ where: { id: attachmentId } });
  if (!before || before.taskId !== taskId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  await logTaskActivity({
    taskId,
    type: "ATTACHMENT_REMOVED",
    message: `Attachment removed: ${before.name}`,
  });
  return NextResponse.json({ ok: true });
}

