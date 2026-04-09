-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT '',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskAttachment" ("createdAt", "id", "mimeType", "name", "sizeBytes", "taskId", "url") SELECT "createdAt", "id", "mimeType", "name", "sizeBytes", "taskId", "url" FROM "TaskAttachment";
DROP TABLE "TaskAttachment";
ALTER TABLE "new_TaskAttachment" RENAME TO "TaskAttachment";
CREATE INDEX "TaskAttachment_taskId_createdAt_idx" ON "TaskAttachment"("taskId", "createdAt");
CREATE INDEX "TaskAttachment_taskId_isCover_idx" ON "TaskAttachment"("taskId", "isCover");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
