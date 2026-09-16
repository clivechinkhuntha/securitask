import express from "express";
import pino from "pino";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { clientRouter } from "./modules/clients/client.routes.js";
import { employeeRouter } from "./modules/employees/employee.routes.js";
import { financeRouter } from "./modules/finance/finance.routes.js";
import { revenueRouter } from "./modules/revenue/revenue.routes.js";
import { payrollRouter } from "./modules/payroll/payroll.routes.js";
import { advanceRouter } from "./modules/advances/advance.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";

const logger = pino({ name: "securitask-api" });

export const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/clients", clientRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/finance", financeRouter);
app.use("/api/revenue", revenueRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/advances", advanceRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "securitask-api" });
});

app.use((_request, response) => {
  response.status(404).json({ error: "Not found" });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Invalid request data.", details: error.flatten() });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    logger.error(error, "Database connection failed");
    response.status(503).json({ error: "The database is currently unavailable. Check the Neon connection strings and try again." });
    return;
  }

  logger.error(error, "Unhandled API error");
  response.status(500).json({ error: "An unexpected error occurred." });
});

export { logger };
