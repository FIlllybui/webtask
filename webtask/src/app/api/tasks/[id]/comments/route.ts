import { NextResponse } from "next/server";

import { logTaskActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateSchema = z.object({
  body: z.string().trim().min(1).max(20_000),
  authorId: z.string().min(1).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // For now: if authorId omitted, use dev1
  const author =
    parsed.data.authorId
      ? await prisma.user.findUnique({ where: { id: parsed.data.authorId } })
      : await prisma.user.findUnique({ where: { handle: "dev1" } });

  if (!author) return NextResponse.json({ error: "Author not found" }, { status: 400 });

  const created = await prisma.taskComment.create({
    data: {
      taskId,
      authorId: author.id,
      body: parsed.data.body,
    },
    include: { author: true },
  });

  await logTaskActivity({
    taskId,
    type: "COMMENTED",
    message: `Comment added by @${created.author.handle}`,
  });

  return NextResponse.json(
    {
      comment: {
        id: created.id,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
        author: { id: created.author.id, handle: created.author.handle, name: created.author.name },
      },
    },
    { status: 201 },
  );
}

