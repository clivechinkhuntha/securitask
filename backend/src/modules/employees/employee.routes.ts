import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication, requirePermissions } from "../auth/auth.middleware.js";

const idSchema = z.string().cuid();
const employeeSchema = z.object({
  employeeNumber: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(320).optional().or(z.literal("")), nationalId: z.string().trim().max(100).optional(), jobTitle: z.string().trim().min(2).max(120),
  employeeType: z.enum(["GUARD", "SUPERVISOR", "MANAGER", "OFFICE_STAFF", "DRIVER", "OTHER"]), basicSalary: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid salary amount."),
  status: z.enum(["ACTIVE", "SUSPENDED", "TERMINATED", "INACTIVE"]).optional(), dateJoined: z.coerce.date(), assignedSiteId: idSchema.optional().or(z.literal("")), notes: z.string().trim().max(2_000).optional(),
});

export const employeeRouter = Router();
employeeRouter.use(requireAuthentication);
employeeRouter.get("/", requirePermissions("employees.view"), async (request, response, next) => { try { const search = String(request.query.search ?? "").trim(); response.json(await prisma.employee.findMany({ where: search ? { OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }, { employeeNumber: { contains: search, mode: "insensitive" } }] } : {}, include: { assignedSite: { include: { client: { select: { name: true } } } } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] })); } catch (error) { next(error); } });
employeeRouter.get("/sites", requirePermissions("employees.view"), async (_request, response, next) => { try { response.json(await prisma.clientSite.findMany({ where: { status: "ACTIVE", client: { status: "ACTIVE" } }, select: { id: true, name: true, code: true, client: { select: { name: true } } }, orderBy: { name: "asc" } })); } catch (error) { next(error); } });
employeeRouter.post("/", requirePermissions("employees.create"), async (request, response, next) => { try { const data = employeeSchema.parse(request.body); const employee = await prisma.employee.create({ data: { ...data, email: data.email || null, assignedSiteId: data.assignedSiteId || null } }); await writeAuditLog({ userId: request.auth!.id, action: "CREATE", module: "employees", recordType: "Employee", recordId: employee.id, newValues: { ...data, dateJoined: data.dateJoined.toISOString() } }, request); response.status(201).json(employee); } catch (error) { next(error); } });
employeeRouter.get("/:employeeId", requirePermissions("employees.view"), async (request, response, next) => { try { response.json(await prisma.employee.findUniqueOrThrow({ where: { id: idSchema.parse(request.params.employeeId) }, include: { assignedSite: { include: { client: { select: { name: true } } } } } })); } catch (error) { next(error); } });
