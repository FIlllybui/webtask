import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = [
    { handle: "dev1", name: "Dev 1" },
    { handle: "dev2", name: "Dev 2" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { handle: u.handle },
      update: { name: u.name },
      create: u,
    });
  }

  const defaultTags = ["Bug", "Feature", "Level Design", "UI"];
  for (const name of defaultTags) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

