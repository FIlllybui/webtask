export default function TimelinePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
      <p className="text-sm text-muted-foreground">
        Gantt-style view across projects (frappe-gantt).
      </p>

      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        (layout placeholder) ต่อไปจะใส่: timeline bars จาก tasks ที่มี start_date + due_date + dependency
      </div>
    </div>
  );
}

