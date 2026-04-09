import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({ select: { id: true, slug: true } });
  let createdLists = 0;
  let backfilledTasks = 0;

  for (const p of projects) {
    const list = await prisma.taskList.upsert({
      where: { projectId_name: { projectId: p.id, name: "General" } },
      update: {},
      create: { projectId: p.id, name: "General" },
    });
    createdLists += 1;

    const res = await prisma.task.updateMany({
      where: { projectId: p.id, listId: null },
      data: { listId: list.id },
    });
    backfilledTasks += res.count;
  }

  console.log(`Projects: ${projects.length}`);
  console.log(`Ensured default lists: ${createdLists}`);
  console.log(`Backfilled tasks listId: ${backfilledTasks}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

