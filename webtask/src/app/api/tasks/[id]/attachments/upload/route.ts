import { NextResponse } from "next/server";

import { logTaskActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function extFromName(name: string) {
  const ext = path.extname(name).toLowerCase();
  return ext && ext.length <= 10 ? ext : "";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  const originalName = file.name || "upload";
  const ext = extFromName(originalName);
  const filename = `${randomUUID()}${ext}`;

  // Save under /public/uploads/<taskId>/<filename>
  const uploadsDir = path.join(process.cwd(), "public", "uploads", taskId);
  await mkdir(uploadsDir, { recursive: true });
  const absPath = path.join(uploadsDir, filename);
  await writeFile(absPath, buf);

  const url = `/uploads/${encodeURIComponent(taskId)}/${encodeURIComponent(filename)}`;
  const mimeType = file.type || "";
  const sizeBytes = buf.byteLength;

  const created = await prisma.taskAttachment.create({
    data: {
      taskId,
      name: originalName,
      url,
      mimeType,
      sizeBytes,
    },
  });

  await logTaskActivity({
    taskId,
    type: "ATTACHMENT_ADDED",
    message: `Attachment uploaded: ${created.name}`,
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

