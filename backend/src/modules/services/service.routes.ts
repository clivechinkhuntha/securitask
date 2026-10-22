import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication, requirePermissions } from "../auth/auth.middleware.js";

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  defaultPrice: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/, "Enter a valid non-negative price with up to two decimal places."),
});
const idSchema = z.string().cuid();
export const servicesRouter = Router();
servicesRouter.use(requireAuthentication);

servicesRouter.get("/", requirePermissions("services.view"), async (_request, response, next) => {
  try { response.json(await prisma.serviceCatalogItem.findMany({ orderBy: { name: "asc" } })); } catch (error) { next(error); }
});

servicesRouter.post("/", requirePermissions("services.create"), async (request, response, next) => {
  try {
    const data = schema.parse(request.body);
    const service = await prisma.$transaction(async (transaction) => {
      const created = await transaction.serviceCatalogItem.create({ data: { ...data, description: data.description || null } });
      await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "CREATE", module: "services", recordType: "ServiceCatalogItem", recordId: created.id, newValues: { name: created.name, description: created.description, defaultPrice: created.defaultPrice.toString(), isActive: created.isActive }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
      return created;
    });
    response.status(201).json(service);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { response.status(409).json({ error: "A service with this name already exists." }); return; }
    next(error);
  }
});

servicesRouter.patch("/:serviceId", requirePermissions("services.update"), async (request, response, next) => {
  try {
    const id = idSchema.parse(request.params.serviceId);
    const data = schema.parse(request.body);
    const service = await prisma.$transaction(async (transaction) => {
      const previous = await transaction.serviceCatalogItem.findUniqueOrThrow({ where: { id } });
      const updated = await transaction.serviceCatalogItem.update({ where: { id }, data: { ...data, description: data.description || null } });
      await transaction.auditLog.create({ data: { userId: request.auth!.id, action: "UPDATE", module: "services", recordType: "ServiceCatalogItem", recordId: id, oldValues: { name: previous.name, description: previous.description, defaultPrice: previous.defaultPrice.toString() }, newValues: { name: updated.name, description: updated.description, defaultPrice: updated.defaultPrice.toString() }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
      return updated;
    });
    response.json(service);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { response.status(409).json({ error: "A service with this name already exists." }); return; }
    next(error);
  }
});

servicesRouter.patch("/:serviceId/status", requirePermissions("services.deactivate"), async (request, response, next) => {
  try {
    const id = idSchema.parse(request.params.serviceId);
    const { isActive } = z.object({ isActive: z.boolean() }).parse(request.body);
    const service = await prisma.$transaction(async (transaction) => {
      const previous = await transaction.serviceCatalogItem.findUniqueOrThrow({ where: { id } });
      const updated = await transaction.serviceCatalogItem.update({ where: { id }, data: { isActive } });
      await transaction.auditLog.create({ data: { userId: request.auth!.id, action: isActive ? "ACTIVATE" : "DEACTIVATE", module: "services", recordType: "ServiceCatalogItem", recordId: id, oldValues: { isActive: previous.isActive }, newValues: { isActive }, ipAddress: request.ip, userAgent: request.get("user-agent") } });
      return updated;
    });
    response.json(service);
  } catch (error) { next(error); }
});
