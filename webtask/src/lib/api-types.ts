import type { TaskPriority, TaskStatus } from "@/lib/task-types";

export type ApiUser = { id: string; name: string; handle: string };
export type ApiTag = { id: string; name: string };

export type ApiTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  assignee: ApiUser | null;
  tags: ApiTag[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type ApiMeeting = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  attendees: ApiUser[];
};

