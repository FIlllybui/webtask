import { z } from "zod";

export const TaskStatusValues = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export const TaskPriorityValues = ["LOW", "MID", "HIGH", "URGENT"] as const;

export const TaskStatusSchema = z.enum(TaskStatusValues);
export const TaskPrioritySchema = z.enum(TaskPriorityValues);

export const TaskUpsertSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(20_000).optional().default(""),
  status: TaskStatusSchema.optional().default("BACKLOG"),
  priority: TaskPrioritySchema.optional().default("MID"),
  dueAt: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional().default([]),
});

export const TaskPatchSchema = TaskUpsertSchema.partial().extend({
  id: z.string().min(1),
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

