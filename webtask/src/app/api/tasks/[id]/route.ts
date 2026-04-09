import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { TaskUpsertSchema } from "@/lib/task-types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  const parsed = TaskUpsertSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, status, priority, dueAt, assigneeId, tagIds } = parsed.data;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
      ...(assigneeId !== undefined ? { assigneeId: assigneeId ?? null } : {}),
      ...(tagIds !== undefined
        ? {
            tags: {
              deleteMany: { taskId: id },
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }
        : {}),
    },
    include: {
      assignee: true,
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({
    task: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      dueAt: updated.dueAt ? updated.dueAt.toISOString() : null,
      assignee: updated.assignee
        ? { id: updated.assignee.id, name: updated.assignee.name, handle: updated.assignee.handle }
        : null,
      tags: updated.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name })),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

