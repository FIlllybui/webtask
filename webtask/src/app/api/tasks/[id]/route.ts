import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { logTaskActivity } from "@/lib/activity";
import { TaskUpsertSchema } from "@/lib/task-types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      list: true,
      assignee: true,
      tags: { include: { tag: true } },
      subtasks: { orderBy: { order: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
      project: task.project ? { id: task.project.id, name: task.project.name, colorHex: task.project.colorHex } : null,
      list: task.list ? { id: task.list.id, name: task.list.name } : null,
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name, handle: task.assignee.handle } : null,
      tags: task.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name })),
      subtasks: task.subtasks.map((s) => ({
        id: s.id,
        title: s.title,
        checked: s.checked,
        order: s.order,
      })),
      comments: task.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: { id: c.author.id, handle: c.author.handle, name: c.author.name },
      })),
      attachments: task.attachments.map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        isCover: a.isCover,
        createdAt: a.createdAt.toISOString(),
      })),
      activities: task.activities.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        dataJson: a.dataJson,
        createdAt: a.createdAt.toISOString(),
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await req.json();
  const parsed = TaskUpsertSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, status, priority, dueAt, listId, assigneeId, tagIds } = parsed.data;

  const before = await prisma.task.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
      ...(listId !== undefined ? { listId: listId ?? null } : {}),
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

  // activity log (best-effort)
  const activityPromises: Promise<void>[] = [];
  if (status !== undefined && before.status !== updated.status) {
    activityPromises.push(
      logTaskActivity({
        taskId: id,
        type: "STATUS_CHANGED",
        message: `Status: ${before.status} → ${updated.status}`,
      }),
    );
  }
  if (priority !== undefined && before.priority !== updated.priority) {
    activityPromises.push(
      logTaskActivity({
        taskId: id,
        type: "PRIORITY_CHANGED",
        message: `Priority: ${before.priority} → ${updated.priority}`,
      }),
    );
  }
  if (dueAt !== undefined) {
    const beforeDue = before.dueAt ? before.dueAt.toISOString() : null;
    const afterDue = updated.dueAt ? updated.dueAt.toISOString() : null;
    if (beforeDue !== afterDue) {
      activityPromises.push(
        logTaskActivity({
          taskId: id,
          type: "DUE_DATE_CHANGED",
          message: `Due date changed`,
          data: { before: beforeDue, after: afterDue },
        }),
      );
    }
  }
  if (assigneeId !== undefined) {
    const beforeAssignee = before.assigneeId ?? null;
    const afterAssignee = updated.assignee?.id ?? null;
    if (beforeAssignee !== afterAssignee) {
      activityPromises.push(
        logTaskActivity({
          taskId: id,
          type: "ASSIGNEE_CHANGED",
          message: `Assignee changed`,
          data: { before: beforeAssignee, after: afterAssignee },
        }),
      );
    }
  }
  if (listId !== undefined) {
    const beforeList = before.listId ?? null;
    const afterList = updated.listId ?? null;
    if (beforeList !== afterList) {
      activityPromises.push(
        logTaskActivity({
          taskId: id,
          type: "LIST_CHANGED",
          message: "List changed",
          data: { before: beforeList, after: afterList },
        }),
      );
    }
  }
  if (tagIds !== undefined) {
    activityPromises.push(
      logTaskActivity({
        taskId: id,
        type: "TAGS_CHANGED",
        message: "Tags updated",
      }),
    );
  }
  if (title !== undefined || description !== undefined) {
    activityPromises.push(
      logTaskActivity({
        taskId: id,
        type: "UPDATED",
        message: "Task updated",
      }),
    );
  }
  await Promise.allSettled(activityPromises);

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

