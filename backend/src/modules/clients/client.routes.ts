import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication, requirePermissions } from "../auth/auth.middleware.js";

const clientSchema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()).optional().or(z.literal("")),
  name: z.string().trim().min(2).max(180),
  contactPerson: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  physicalAddress: z.string().trim().max(500).optional(),
  billingAddress: z.string().trim().max(500).optional(),
  taxNumber: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(2_000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const clientUpdateSchema = clientSchema.partial();
const idSchema = z.string().cuid();
const optionalDate = z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional());
const siteSchema = z.object({
  name: z.string().trim().min(2).max(180), code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(), contactPerson: z.string().trim().max(160).optional(), contactPhone: z.string().trim().max(40).optional(), notes: z.string().trim().max(2_000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const contractSchema = z.object({
  contractNumber: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()).optional().or(z.literal("")),
  startDate: z.coerce.date(), endDate: optionalDate, monthlyCharge: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount."),
  paymentTerms: z.string().trim().max(300).optional().or(z.literal("")), description: z.string().trim().max(2_000).optional(), notes: z.string().trim().max(2_000).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED", "ARCHIVED"]).optional(),
}).superRefine((value, context) => { if (value.endDate && value.endDate < value.startDate) context.addIssue({ code: "custom", path: ["endDate"], message: "End date cannot precede start date." }); });

export const clientRouter = Router();
clientRouter.use(requireAuthentication);

clientRouter.get("/", requirePermissions("clients.view"), async (request, response, next) => {
  try {
    const search = String(request.query.search ?? "").trim();
    const status = request.query.status === "ACTIVE" || request.query.status === "INACTIVE" ? request.query.status : undefined;
    response.json(await prisma.client.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }, { contactPerson: { contains: search, mode: "insensitive" } }] } : {}),
      },
      orderBy: { name: "asc" },
    }));
  } catch (error) { next(error); }
});

clientRouter.post("/", requirePermissions("clients.create"), async (request, response, next) => {
  try {
    const data = clientSchema.parse(request.body);
    const client = await prisma.client.create({ data: { ...data, code: data.code || `CLI-${randomUUID().slice(0, 8).toUpperCase()}`, contactPerson: data.contactPerson || "Not provided", phone: data.phone || "Not provided", email: data.email || null } });
    await writeAuditLog({ userId: request.auth!.id, action: "CREATE", module: "clients", recordType: "Client", recordId: client.id, newValues: { ...data, code: client.code, contactPerson: client.contactPerson, phone: client.phone } }, request);
    response.status(201).json(client);
  } catch (error) { next(error); }
});

clientRouter.patch("/:clientId", requirePermissions("clients.update"), async (request, response, next) => {
  try {
    const id = idSchema.parse(request.params.clientId);
    const data = clientUpdateSchema.parse(request.body);
    const existing = await prisma.client.findUniqueOrThrow({ where: { id } });
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...data,
        ...(data.code !== undefined ? { code: data.code || existing.code } : {}),
        ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson || "Not provided" } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || "Not provided" } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
      },
    });
    await writeAuditLog({ userId: request.auth!.id, action: "UPDATE", module: "clients", recordType: "Client", recordId: client.id, oldValues: { name: existing.name, contactPerson: existing.contactPerson, phone: existing.phone, email: existing.email, status: existing.status }, newValues: { name: client.name, contactPerson: client.contactPerson, phone: client.phone, email: client.email, status: client.status } }, request);
    response.json(client);
  } catch (error) { next(error); }
});

clientRouter.get("/:clientId", requirePermissions("clients.view"), async (request, response, next) => {
  try {
    const id = idSchema.parse(request.params.clientId);
    response.json(await prisma.client.findUniqueOrThrow({ where: { id }, include: { sites: { orderBy: { name: "asc" } }, contracts: { orderBy: { startDate: "desc" } } } }));
  } catch (error) { next(error); }
});

clientRouter.post("/:clientId/sites", requirePermissions("sites.create"), async (request, response, next) => {
  try {
    const clientId = idSchema.parse(request.params.clientId); const data = siteSchema.parse(request.body);
    await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    const site = await prisma.clientSite.create({ data: { ...data, clientId, code: data.code || `SITE-${randomUUID().slice(0, 8).toUpperCase()}` } });
    await writeAuditLog({ userId: request.auth!.id, action: "CREATE", module: "sites", recordType: "ClientSite", recordId: site.id, newValues: data, metadata: { clientId } }, request);
    response.status(201).json(site);
  } catch (error) { next(error); }
});

clientRouter.post("/:clientId/contracts", requirePermissions("contracts.create"), async (request, response, next) => {
  try {
    const clientId = idSchema.parse(request.params.clientId); const data = contractSchema.parse(request.body);
    await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
    const contract = await prisma.clientContract.create({ data: { ...data, clientId, contractNumber: data.contractNumber || `CON-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`, paymentTerms: data.paymentTerms || "Not specified" } });
    await writeAuditLog({ userId: request.auth!.id, action: "CREATE", module: "contracts", recordType: "ClientContract", recordId: contract.id, newValues: { ...data, monthlyCharge: data.monthlyCharge }, metadata: { clientId } }, request);
    response.status(201).json(contract);
  } catch (error) { next(error); }
});
