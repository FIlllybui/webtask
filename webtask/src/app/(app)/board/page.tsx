import { BoardClient } from "@/app/(app)/board/board-client";
import { prisma } from "@/lib/db";

export default async function BoardPage() {
  const [tasks, users, tags] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignee: true,
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const normalizedTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, handle: t.assignee.handle } : null,
    tags: t.tags.map((tt) => ({ id: tt.tag.id, name: tt.tag.name })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const normalizedUsers = users.map((u) => ({ id: u.id, name: u.name, handle: u.handle }));
  const normalizedTags = tags.map((t) => ({ id: t.id, name: t.name }));

  return <BoardClient initialTasks={normalizedTasks} users={normalizedUsers} tags={normalizedTags} />;
}

