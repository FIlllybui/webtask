import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const [users, tags] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({ users, tags });
}

