import { Router } from "express";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication, requirePermissions } from "../auth/auth.middleware.js";

const amount = z.string().regex(/^\d+(\.\d{1,2})?$/);
const invoiceSchema = z.object({ clientId: z.string().cuid(), invoiceDate: z.coerce.date(), dueDate: z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.date().optional()), notes: z.string().trim().max(2_000).optional(), items: z.array(z.object({ description: z.string().trim().min(1).max(1000), remarks: z.string().trim().max(1000).optional(), quantity: amount.refine((value) => new Prisma.Decimal(value).greaterThan(0), "Quantity must be greater than zero."), unitPrice: amount })).min(1) }).refine((value) => !value.dueDate || value.dueDate >= value.invoiceDate, { path: ["dueDate"], message: "Due date cannot precede invoice date." });
const paymentSchema = z.object({ paymentNumber: z.string().trim().min(2).transform((value) => value.toUpperCase()), clientId: z.string().cuid(), paymentDate: z.coerce.date(), amount, paymentMethod: z.string().trim().min(2), accountId: z.string().cuid(), externalReference: z.string().trim().max(120).optional(), notes: z.string().trim().max(2_000).optional(), allocations: z.array(z.object({ invoiceId: z.string().cuid(), amount })).min(1) });
const invalid = (message: string) => new z.ZodError([{ code: "custom", path: [], message }]);
async function refreshInvoiceStatus(transaction: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await transaction.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { allocations: { include: { payment: { select: { status: true } } } } } });
  const paid = invoice.allocations.filter((allocation) => allocation.payment.status === "RECORDED").reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0));
  const status = paid.greaterThanOrEqualTo(invoice.total) && paid.greaterThan(0) ? "PAID" : paid.greaterThan(0) ? "PARTIALLY_PAID" : invoice.dueDate && invoice.dueDate < new Date() ? "OVERDUE" : "ISSUED";
  await transaction.invoice.update({ where: { id: invoiceId }, data: { status } });
}
export const revenueRouter = Router(); revenueRouter.use(requireAuthentication);
revenueRouter.get("/invoices", requirePermissions("invoices.view"), async (_request, response, next) => { try { const invoices = await prisma.invoice.findMany({ include: { client: { select: { name: true } }, allocations: { include: { payment: true } } }, orderBy: { invoiceDate: "desc" } }); response.json(invoices.map(({ allocations, total, ...invoice }) => { const paid = allocations.filter((item) => item.payment.status === "RECORDED").reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0)); return { ...invoice, total, amountPaid: paid.toFixed(2), balance: total.sub(paid).toFixed(2) }; })); } catch (error) { next(error); } });
revenueRouter.post("/invoices", requirePermissions("invoices.create"), async (request, response, next) => { try {
  const data = invoiceSchema.parse(request.body);
  const items = data.items.map((item) => ({ ...item, amount: new Prisma.Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2) }));
  const subtotal = items.reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0));
  const invoiceNumber = `INV-${data.invoiceDate.getUTCFullYear()}-${randomUUID().replaceAll("-", "").toUpperCase()}`;
  const invoice = await prisma.$transaction(async (transaction) => {
    const created = await transaction.invoice.create({ data: { invoiceNumber, clientId: data.clientId, invoiceDate: data.invoiceDate, dueDate: data.dueDate ?? null, notes: data.notes || null, subtotal, total: subtotal, items: { create: items } }, include: { items: true } });
    await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "CREATE", module: "invoices", recordType: "Invoice", recordId: created.id, newValues: { invoiceNumber }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
    return created;
  });
  response.status(201).json(invoice);
} catch (error) { next(error); } });
revenueRouter.put("/invoices/:invoiceId", requirePermissions("invoices.update"), async (request, response, next) => { try {
  const id = z.string().cuid().parse(request.params.invoiceId);
  const data = invoiceSchema.parse(request.body);
  const items = data.items.map((item) => ({ ...item, amount: new Prisma.Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2) }));
  const subtotal = items.reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0));
  const invoice = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${id} FOR UPDATE`;
    const current = await transaction.invoice.findUniqueOrThrow({ where: { id }, include: { items: true } });
    if (current.status !== "DRAFT") throw invalid("Only draft invoices can be edited.");
    if (!current.vat.isZero() || !current.wht.isZero()) throw invalid("Drafts with tax amounts cannot be edited until tax rules are configured.");
    const client = await transaction.client.findUnique({ where: { id: data.clientId }, select: { status: true } });
    if (client?.status !== "ACTIVE") throw invalid("Select an active client.");
    await transaction.invoiceItem.deleteMany({ where: { invoiceId: id } });
    const updated = await transaction.invoice.update({ where: { id }, data: { clientId: data.clientId, invoiceDate: data.invoiceDate, dueDate: data.dueDate ?? null, notes: data.notes || null, subtotal, total: subtotal, items: { create: items } }, include: { items: true } });
    await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "UPDATE", module: "invoices", recordType: "Invoice", recordId: id, oldValues: JSON.parse(JSON.stringify(current)), newValues: JSON.parse(JSON.stringify(updated)), ipAddress: request.ip, userAgent: request.get("user-agent") } });
    return updated;
  });
  response.json(invoice);
} catch (error) { next(error); } });
revenueRouter.get("/invoices/:invoiceId", requirePermissions("invoices.view"), async (request, response, next) => { try {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: z.string().cuid().parse(request.params.invoiceId) }, include: { client: { select: { name: true, billingAddress: true, physicalAddress: true } }, items: true, allocations: { include: { payment: { select: { paymentNumber: true, paymentDate: true, status: true, paymentMethod: true } } } } } });
  const paid = invoice.allocations.filter((allocation) => allocation.payment.status === "RECORDED").reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0));
  const company = invoice.status === "DRAFT" ? await prisma.companySettings.findUnique({ where: { id: "company" } }) : null;
  response.json({ ...invoice, previewCompany: company, amountPaid: paid.toFixed(2), balance: invoice.total.sub(paid).toFixed(2) });
} catch (error) { next(error); } });
revenueRouter.get("/payments", requirePermissions("payments.view"), async (_request, response, next) => { try { response.json(await prisma.payment.findMany({ include: { client: { select: { name: true } }, account: { select: { name: true } }, allocations: { include: { invoice: { select: { invoiceNumber: true } } } } }, orderBy: { paymentDate: "desc" } })); } catch (error) { next(error); } });
revenueRouter.get("/clients/:clientId/statement", requirePermissions("reports.view"), async (request, response, next) => { try { const clientId = z.string().cuid().parse(request.params.clientId); const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId }, select: { id: true, name: true, code: true } }); const [invoices, payments] = await Promise.all([prisma.invoice.findMany({ where: { clientId, status: { not: "CANCELLED" } }, select: { id: true, invoiceNumber: true, invoiceDate: true, total: true }, orderBy: { invoiceDate: "asc" } }), prisma.payment.findMany({ where: { clientId, status: "RECORDED" }, select: { id: true, paymentNumber: true, paymentDate: true, amount: true, allocations: { select: { invoiceId: true, amount: true } } }, orderBy: { paymentDate: "asc" } })]); const entries = [...invoices.map((invoice) => ({ date: invoice.invoiceDate, type: "INVOICE", reference: invoice.invoiceNumber, debit: Number(invoice.total), credit: 0 })), ...payments.map((payment) => ({ date: payment.paymentDate, type: "PAYMENT", reference: payment.paymentNumber, debit: 0, credit: Number(payment.amount) }))].sort((a, b) => a.date.getTime() - b.date.getTime()); let balance = 0; response.json({ client, entries: entries.map((entry) => ({ ...entry, balance: (balance += entry.debit - entry.credit).toFixed(2) })), closingBalance: balance.toFixed(2) }); } catch (error) { next(error); } });
revenueRouter.post("/payments", requirePermissions("payments.create"), async (request, response, next) => { try {
  const data = paymentSchema.parse(request.body);
  const ids = data.allocations.map((allocation) => allocation.invoiceId);
  if (new Set(ids).size !== ids.length) throw invalid("An invoice can only be allocated once per payment.");
  if (new Prisma.Decimal(data.amount).lte(0) || data.allocations.some((allocation) => new Prisma.Decimal(allocation.amount).lte(0))) throw invalid("Payment and allocations must be greater than zero.");
  if (!data.allocations.reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0)).equals(data.amount)) throw invalid("Allocations must equal the payment amount.");
  const payment = await prisma.$transaction(async (transaction) => {
    for (const id of [...ids].sort()) await transaction.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${id} FOR UPDATE`;
    const invoices = await transaction.invoice.findMany({ where: { id: { in: ids }, clientId: data.clientId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } }, include: { allocations: { include: { payment: true } } } });
    if (invoices.length !== ids.length) throw invalid("Each allocation must target an outstanding invoice for this client.");
    for (const allocation of data.allocations) {
      const invoice = invoices.find((item) => item.id === allocation.invoiceId)!;
      const paid = invoice.allocations.filter((item) => item.payment.status === "RECORDED").reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0));
      if (new Prisma.Decimal(allocation.amount).greaterThan(invoice.total.sub(paid))) throw invalid("Payment allocation exceeds the invoice balance.");
    }
    const account = await transaction.financialAccount.findUnique({ where: { id: data.accountId }, select: { isActive: true } });
    if (!account?.isActive) throw invalid("Select an active account.");
    const created = await transaction.payment.create({ data: { ...data, allocations: { create: data.allocations } } });
    await transaction.accountTransaction.create({ data: { accountId: data.accountId, transactionType: "CLIENT_PAYMENT", transactionDate: data.paymentDate, amount: data.amount, direction: "CREDIT", referenceType: "Payment", referenceId: created.id, externalReference: data.externalReference, description: `Client payment ${created.paymentNumber}`, createdById: request.auth!.id } });
    for (const id of ids) await refreshInvoiceStatus(transaction, id);
    await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "RECORD", module: "payments", recordType: "Payment", recordId: created.id, newValues: { paymentNumber: created.paymentNumber }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
    return created;
  });
  response.status(201).json(payment);
} catch (error) { next(error); } });
revenueRouter.post("/invoices/:invoiceId/issue", requirePermissions("invoices.issue"), async (request, response, next) => { try {
  const id = z.string().cuid().parse(request.params.invoiceId);
  const invoice = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${id} FOR UPDATE`;
    const current = await transaction.invoice.findUniqueOrThrow({ where: { id }, include: { client: { select: { name: true, billingAddress: true, physicalAddress: true } } } });
    if (current.status !== "DRAFT") throw invalid("Only a draft invoice can be issued.");
    const company = await transaction.companySettings.findUnique({ where: { id: "company" } });
    if (!company) throw invalid("Set company details in Settings before issuing an invoice.");
    const documentSnapshot = { company: { companyName: company.companyName, address: company.address, taxNumber: company.taxNumber, phone: company.phone, email: company.email, bankName: company.bankName, accountName: company.accountName, accountNumber: company.accountNumber }, client: current.client };
    const updated = await transaction.invoice.updateMany({ where: { id, status: "DRAFT" }, data: { status: "ISSUED", documentSnapshot } });
    if (updated.count !== 1) throw invalid("Only a draft invoice can be issued.");
    await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "ISSUE", module: "invoices", recordType: "Invoice", recordId: id, ipAddress: request.ip, userAgent: request.get("user-agent") } });
    return transaction.invoice.findUniqueOrThrow({ where: { id } });
  });
  response.json(invoice);
} catch (error) { next(error); } });
revenueRouter.post("/invoices/:invoiceId/cancel", requirePermissions("invoices.cancel"), async (request, response, next) => { try {
  const id = z.string().cuid().parse(request.params.invoiceId);
  const { reason } = z.object({ reason: z.string().trim().min(1).max(2000) }).parse(request.body);
  const invoice = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${id} FOR UPDATE`;
    const current = await transaction.invoice.findUniqueOrThrow({ where: { id }, include: { allocations: { include: { payment: true } } } });
    if (!["DRAFT", "ISSUED", "OVERDUE"].includes(current.status) || current.allocations.some((allocation) => allocation.payment.status === "RECORDED")) throw invalid("Only unpaid invoices can be cancelled. Reverse payments first.");
    const updated = await transaction.invoice.update({ where: { id }, data: { status: "CANCELLED", cancelledFromStatus: current.status, cancellationReason: reason, cancelledAt: new Date(), cancelledById: request.auth!.id } });
    await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "CANCEL", module: "invoices", recordType: "Invoice", recordId: id, oldValues: { status: current.status }, newValues: { status: "CANCELLED", reason }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
    return updated;
  });
  response.json(invoice);
} catch (error) { next(error); } });
revenueRouter.post("/invoices/:invoiceId/restore", requirePermissions("invoices.restore"), async (request, response, next) => { try {
  const id = z.string().cuid().parse(request.params.invoiceId);
  const invoice = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${id} FOR UPDATE`;
    const current = await transaction.invoice.findUniqueOrThrow({ where: { id }, include: { allocations: true } });
    if (current.status !== "CANCELLED" || current.cancelledFromStatus !== "DRAFT" || current.allocations.length || current.documentSnapshot !== null) throw invalid("Only invoices cancelled as drafts can be restored.");
    const updated = await transaction.invoice.update({ where: { id }, data: { status: "DRAFT", cancelledFromStatus: null, cancellationReason: null, cancelledAt: null, cancelledById: null } });
    await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "RESTORE", module: "invoices", recordType: "Invoice", recordId: id, oldValues: { status: "CANCELLED", reason: current.cancellationReason }, newValues: { status: "DRAFT" }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
    return updated;
  });
  response.json(invoice);
} catch (error) { next(error); } });
revenueRouter.post("/payments/:paymentId/reverse", requirePermissions("payments.reverse"), async (request, response, next) => { try {
  const paymentId = z.string().cuid().parse(request.params.paymentId);
  const { reason } = z.object({ reason: z.string().trim().min(1).max(2000) }).parse(request.body);
  const payment = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { allocations: true } });
    for (const id of existing.allocations.map((allocation) => allocation.invoiceId).sort()) await transaction.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${id} FOR UPDATE`;
    const updated = await transaction.payment.updateMany({ where: { id: paymentId, status: "RECORDED" }, data: { status: "REVERSED" } });
    if (updated.count !== 1) throw invalid("Payment has already been reversed.");
    await transaction.accountTransaction.create({ data: { accountId: existing.accountId, transactionType: "REVERSAL", transactionDate: new Date(), amount: existing.amount, direction: "DEBIT", referenceType: "Payment", referenceId: existing.id, description: `Reversal of payment ${existing.paymentNumber}: ${reason}`, createdById: request.auth!.id } });
    for (const allocation of existing.allocations) await refreshInvoiceStatus(transaction, allocation.invoiceId);
    await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "REVERSE", module: "payments", recordType: "Payment", recordId: paymentId, newValues: { reason }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
    return { ...existing, status: "REVERSED" };
  });
  response.json(payment);
} catch (error) { next(error); } });
