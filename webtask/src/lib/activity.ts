import { prisma } from "@/lib/db";

export async function logTaskActivity(input: {
  taskId: string;
  type:
    | "CREATED"
    | "UPDATED"
    | "STATUS_CHANGED"
    | "PRIORITY_CHANGED"
    | "DUE_DATE_CHANGED"
    | "ASSIGNEE_CHANGED"
    | "LIST_CHANGED"
    | "TAGS_CHANGED"
    | "SUBTASKS_CHANGED"
    | "COMMENTED"
    | "ATTACHMENT_ADDED"
    | "ATTACHMENT_REMOVED";
  message?: string;
  data?: unknown;
}) {
  await prisma.taskActivity.create({
    data: {
      taskId: input.taskId,
      type: input.type as any,
      message: input.message ?? "",
      dataJson: JSON.stringify(input.data ?? {}),
    },
  });
}

