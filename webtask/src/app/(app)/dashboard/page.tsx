import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

export default async function DashboardPage() {
  const now = new Date();
  const in48h = hoursFromNow(48);

  const [activeTasks, completedTasks, users, upcomingMeetings] = await Promise.all([
    prisma.task.count({ where: { status: { not: "DONE" } } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.meeting.findMany({
      where: {
        startTime: { gte: now, lt: in48h },
      },
      include: {
        attendees: { include: { user: true } },
      },
      orderBy: { startTime: "asc" },
      take: 10,
    }),
  ]);

  const tasksByUser = await prisma.task.groupBy({
    by: ["assigneeId"],
    _count: { _all: true },
    where: { status: { not: "DONE" } },
  });

  const assignedCounts = new Map<string, number>();
  for (const row of tasksByUser) {
    if (row.assigneeId) assignedCounts.set(row.assigneeId, row._count._all);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Summary of active and completed tasks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{completedTasks}</div>
          </CardContent>
        </Card>
        {users.slice(0, 2).map((u) => (
          <Card key={u.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assigned to @{u.handle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{assignedCounts.get(u.id) ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming meetings (next 48h)</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No upcoming meetings.</div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => (
                <div key={m.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.attendees.map((a) => `@${a.user.handle}`).join(", ")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.startTime.toLocaleString()} – {m.endTime.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

