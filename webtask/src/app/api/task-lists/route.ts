import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const lists = await prisma.taskList.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    lists: lists.map((l) => ({ id: l.id, name: l.name })),
  });
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.taskList.create({
    data: { projectId: parsed.data.projectId, name: parsed.data.name },
  });

  return NextResponse.json({ list: { id: created.id, name: created.name } }, { status: 201 });
}

