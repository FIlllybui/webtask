import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaultProject = await prisma.project.upsert({
    where: { slug: "default" },
    update: { isActive: true },
    create: { name: "Default Project", slug: "default", colorHex: "#4A154B" },
  });

  const res = await prisma.task.updateMany({
    where: { projectId: null },
    data: { projectId: defaultProject.id },
  });

  console.log(`Default Project: ${defaultProject.id} (${defaultProject.slug})`);
  console.log(`Backfilled tasks: ${res.count}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

