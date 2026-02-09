-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "dept" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "hourlyRate" REAL NOT NULL DEFAULT 0.0,
    "avatar" TEXT,
    "pin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("avatar", "createdAt", "dept", "id", "name", "pin", "role", "updatedAt") SELECT "avatar", "createdAt", "dept", "id", "name", "pin", "role", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
CREATE UNIQUE INDEX "Employee_cpf_key" ON "Employee"("cpf");
CREATE UNIQUE INDEX "Employee_pin_key" ON "Employee"("pin");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
