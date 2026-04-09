import { NextResponse } from "next/server";

import { logTaskActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(300),
  url: z.string().trim().min(1).max(3000),
  mimeType: z.string().max(200).optional().default(""),
  sizeBytes: z.number().int().min(0).optional().default(0),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const json = await req.json();
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.taskAttachment.create({
    data: {
      taskId,
      name: parsed.data.name,
      url: parsed.data.url,
      mimeType: parsed.data.mimeType ?? "",
      sizeBytes: parsed.data.sizeBytes ?? 0,
    },
  });

  await logTaskActivity({
    taskId,
    type: "ATTACHMENT_ADDED",
    message: `Attachment added: ${created.name}`,
  });

  return NextResponse.json(
    {
      attachment: {
        id: created.id,
        name: created.name,
        url: created.url,
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}

