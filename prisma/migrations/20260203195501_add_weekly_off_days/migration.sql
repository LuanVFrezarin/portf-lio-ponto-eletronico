-- CreateTable
CREATE TABLE "EmployeeWeeklyOffDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmployeeWeeklyOffDay_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeWeeklyOffDay_employeeId_dayOfWeek_key" ON "EmployeeWeeklyOffDay"("employeeId", "dayOfWeek");

-- Populate default weekend days (Saturday=6 and Sunday=0) for all employees
INSERT INTO "EmployeeWeeklyOffDay" (id, "employeeId", "dayOfWeek", "createdAt", "updatedAt")
SELECT 
    lower(hex(randomblob(12))) || lower(hex(randomblob(2))),
    "Employee".id,
    days.day,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Employee"
CROSS JOIN (SELECT 0 as day UNION SELECT 6) as days;
