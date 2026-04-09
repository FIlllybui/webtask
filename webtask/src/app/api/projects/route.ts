import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      colorHex: p.colorHex,
    })),
  });
}

