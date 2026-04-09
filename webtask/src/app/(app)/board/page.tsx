import { BoardClient } from "@/app/(app)/board/board-client";
import { prisma } from "@/lib/db";

export default async function BoardPage({
  searchParams,
}: {
  searchParams?: Promise<{ project?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const project = sp.project ?? null;
  const projectFilter = project ? { projectId: project } : {};

  const [tasks, users, tags] = await Promise.all([
    prisma.task.findMany({
      where: projectFilter,
      include: {
        assignee: true,
        tags: { include: { tag: true } },
        attachments: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const normalizedTasks = tasks.map((t) => ({
    cover: (() => {
      const cover = t.attachments.find((x) => x.isCover);
      const a =
        cover ??
        t.attachments.find((x) => x.mimeType.startsWith("image/") || x.mimeType.startsWith("video/"));
      return a ? { url: a.url, mimeType: a.mimeType } : null;
    })(),
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

