import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication, requirePermissions } from "../auth/auth.middleware.js";

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const schema = z.object({
  companyName: z.string().trim().min(1).max(160),
  address: optionalText(500),
  taxNumber: optionalText(80),
  phone: optionalText(40),
  email: z.union([z.literal(""), z.email().max(254)]).transform((value) => value || null),
  bankName: optionalText(160),
  accountName: optionalText(160),
  accountNumber: optionalText(80),
});

export const settingsRouter = Router();
settingsRouter.use(requireAuthentication);

settingsRouter.get("/company", requirePermissions("settings.view"), async (_request, response, next) => {
  try {
    response.json(await prisma.companySettings.findUnique({ where: { id: "company" } }));
  } catch (error) { next(error); }
});

settingsRouter.put("/company", requirePermissions("settings.update"), async (request, response, next) => {
  try {
    const data = schema.parse(request.body);
    const settings = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(73284413)`;
      const previous = await transaction.companySettings.findUnique({ where: { id: "company" } });
      const updated = await transaction.companySettings.upsert({ where: { id: "company" }, create: { id: "company", ...data }, update: data });
      const auditValues = (value: typeof updated) => ({ companyName: value.companyName, address: value.address, taxNumber: value.taxNumber, phone: value.phone, email: value.email, bankName: value.bankName, accountName: value.accountName, accountNumberLast4: value.accountNumber?.slice(-4) ?? null });
      await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "UPDATE", module: "settings", recordType: "CompanySettings", recordId: "company", ...(previous ? { oldValues: auditValues(previous) } : {}), newValues: auditValues(updated), ipAddress: request.ip, userAgent: request.get("user-agent") } });
      return updated;
    });
    response.json(settings);
  } catch (error) { next(error); }
});
