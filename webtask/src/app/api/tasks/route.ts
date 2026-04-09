import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { TaskUpsertSchema } from "@/lib/task-types";

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      assignee: true,
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const normalized = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, handle: t.assignee.handle } : null,
    tags: t.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name })),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return NextResponse.json({ tasks: normalized });
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = TaskUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, status, priority, dueAt, assigneeId, tagIds } = parsed.data;

  const created = await prisma.task.create({
    data: {
      title,
      description,
      status,
      priority,
      dueAt: dueAt ? new Date(dueAt) : null,
      assigneeId: assigneeId ?? null,
      tags: {
        create: (tagIds ?? []).map((tagId) => ({ tagId })),
      },
    },
    include: {
      assignee: true,
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json(
    {
      task: {
        id: created.id,
        title: created.title,
        description: created.description,
        status: created.status,
        priority: created.priority,
        dueAt: created.dueAt ? created.dueAt.toISOString() : null,
        assignee: created.assignee
          ? { id: created.assignee.id, name: created.assignee.name, handle: created.assignee.handle }
          : null,
        tags: created.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name })),
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    },
    { status: 201 },
  );
}

