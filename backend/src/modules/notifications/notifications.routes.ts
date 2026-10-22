import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication } from "../auth/auth.middleware.js";

type Notice = { key: string; title: string; description: string; href: string; date: Date };

async function currentNotifications(permissions: string[]): Promise<Notice[]> {
  const allowed = new Set(permissions);
  const notices: Notice[] = [];
  if (allowed.has("invoices.view")) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const invoices = await prisma.invoice.findMany({ where: { dueDate: { lt: today }, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } }, select: { id: true, invoiceNumber: true, dueDate: true, total: true, allocations: { where: { payment: { status: "RECORDED" } }, select: { amount: true } } }, orderBy: { dueDate: "desc" }, take: 100 });
    for (const invoice of invoices) {
      const paid = invoice.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0));
      if (invoice.dueDate && invoice.total.greaterThan(paid)) notices.push({ key: `overdue:${invoice.id}:${invoice.dueDate.toISOString().slice(0, 10)}`, title: "Invoice overdue", description: `Invoice ${invoice.invoiceNumber} is past its due date.`, href: `/invoices/${invoice.id}`, date: invoice.dueDate });
    }
  }
  if (allowed.has("payroll.view") && allowed.has("payroll.approve")) {
    const runs = await prisma.payrollRun.findMany({ where: { status: "REVIEWED" }, select: { id: true, name: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 100 });
    for (const run of runs) notices.push({ key: `payroll-review:${run.id}:${run.updatedAt.toISOString()}`, title: "Payroll awaiting approval", description: `${run.name} is ready for approval.`, href: `/payroll/${run.id}`, date: run.updatedAt });
  }
  return notices.sort((first, second) => second.date.getTime() - first.date.getTime());
}

export const notificationsRouter = Router();
notificationsRouter.use(requireAuthentication);

notificationsRouter.get("/", async (request, response, next) => {
  try {
    const notices = await currentNotifications(request.auth!.permissions);
    const reads = await prisma.notificationRead.findMany({ where: { userId: request.auth!.id, key: { in: notices.map((notice) => notice.key) } }, select: { key: true } });
    const readKeys = new Set(reads.map((read) => read.key));
    response.json({ notifications: notices.map((notice) => ({ ...notice, isRead: readKeys.has(notice.key) })), unreadCount: notices.filter((notice) => !readKeys.has(notice.key)).length });
  } catch (error) { next(error); }
});

notificationsRouter.post("/read", async (request, response, next) => {
  try {
    const { keys } = z.object({ keys: z.array(z.string().max(200)).min(1).max(200) }).parse(request.body);
    const allowed = new Set((await currentNotifications(request.auth!.permissions)).map((notice) => notice.key));
    if (keys.some((key) => !allowed.has(key))) { response.status(400).json({ error: "One or more notifications are no longer available." }); return; }
    await prisma.notificationRead.createMany({ data: [...new Set(keys)].map((key) => ({ userId: request.auth!.id, key })), skipDuplicates: true });
    response.json({ success: true });
  } catch (error) { next(error); }
});
