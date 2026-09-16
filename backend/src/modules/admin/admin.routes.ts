import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication, requirePermissions } from "../auth/auth.middleware.js";

const idSchema = z.string().trim().min(1).max(100);
const roleSchema = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).optional() });
const permissionIdsSchema = z.object({ permissionIds: z.array(idSchema).max(500) });
const userSchema = z.object({
  firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  roleIds: z.array(idSchema).min(1, "Select at least one role.").max(20),
  isActive: z.boolean().optional(),
});
const userRolesSchema = z.object({ roleIds: z.array(idSchema).min(1).max(20) });
const userStatusSchema = z.object({ isActive: z.boolean() });

async function ensureSingleSuperAdministrator(roleIds: string[], userId?: string) {
  const superAdministrator = await prisma.role.findUnique({ where: { name: "Super Administrator" }, select: { id: true } });
  if (!superAdministrator || !roleIds.includes(superAdministrator.id)) return true;
  const existingAssignment = await prisma.userRole.findFirst({ where: { roleId: superAdministrator.id, ...(userId ? { userId: { not: userId } } : {}) }, select: { userId: true } });
  return !existingAssignment;
}

const userSelection = {
  id: true, firstName: true, lastName: true, email: true, externalAuthId: true,
  isActive: true, lastLoginAt: true, createdAt: true, roles: { include: { role: true } },
} as const;

export const adminRouter = Router();
adminRouter.use(requireAuthentication);

adminRouter.get("/permissions", requirePermissions("roles.view"), async (_request, response, next) => {
  try { response.json(await prisma.permission.findMany({ where: { isActive: true }, orderBy: [{ module: "asc" }, { action: "asc" }] })); } catch (error) { next(error); }
});

adminRouter.get("/roles", requirePermissions("roles.view"), async (_request, response, next) => {
  try { response.json(await prisma.role.findMany({ include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } }, orderBy: { name: "asc" } })); } catch (error) { next(error); }
});

adminRouter.post("/roles", requirePermissions("roles.create"), async (request, response, next) => {
  try {
    const data = roleSchema.parse(request.body); const role = await prisma.role.create({ data });
    await writeAuditLog({ userId: request.auth!.id, action: "CREATE", module: "roles", recordType: "Role", recordId: role.id, newValues: data }, request);
    response.status(201).json(role);
  } catch (error) { next(error); }
});

adminRouter.put("/roles/:roleId/permissions", requirePermissions("roles.assign_permissions"), async (request, response, next) => {
  try {
    const data = permissionIdsSchema.parse(request.body); const roleId = idSchema.parse(request.params.roleId); const role = await prisma.role.findUniqueOrThrow({ where: { id: roleId } });
    await prisma.$transaction([prisma.rolePermission.deleteMany({ where: { roleId: role.id } }), prisma.rolePermission.createMany({ data: data.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })), skipDuplicates: true })]);
    await writeAuditLog({ userId: request.auth!.id, action: "ASSIGN_PERMISSIONS", module: "roles", recordType: "Role", recordId: role.id, newValues: data }, request);
    response.status(204).send();
  } catch (error) { next(error); }
});

adminRouter.get("/users", requirePermissions("users.view"), async (_request, response, next) => {
  try {
    const users = await prisma.user.findMany({ select: userSelection, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
    response.json(users.map(({ externalAuthId, ...user }) => ({ ...user, isLinkedToNeonAuth: Boolean(externalAuthId) })));
  } catch (error) { next(error); }
});

adminRouter.post("/users", requirePermissions("users.create"), async (request, response, next) => {
  try {
    const data = userSchema.parse(request.body);
    const roleCount = await prisma.role.count({ where: { id: { in: data.roleIds }, isActive: true } });
    if (roleCount !== data.roleIds.length) { response.status(400).json({ error: "One or more selected roles are unavailable." }); return; }
    const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (!await ensureSingleSuperAdministrator(data.roleIds, existing?.id)) { response.status(409).json({ error: "Only one user can hold the Super Administrator role." }); return; }
    const provisionedUser = existing
      ? await prisma.user.update({ where: { id: existing.id }, data: { firstName: data.firstName, lastName: data.lastName, isActive: data.isActive ?? true }, select: { id: true } })
      : await prisma.user.create({ data: { firstName: data.firstName, lastName: data.lastName, email: data.email, isActive: data.isActive ?? true }, select: { id: true } });
    await prisma.userRole.createMany({ data: data.roleIds.map((roleId) => ({ userId: provisionedUser.id, roleId })), skipDuplicates: true });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: provisionedUser.id }, select: userSelection });
    await writeAuditLog({ userId: request.auth!.id, action: "PROVISION", module: "users", recordType: "User", recordId: user.id, newValues: { ...data, activation: "Neon Auth sign-up required" } }, request);
    const { externalAuthId, ...profile } = user;
    response.status(existing ? 200 : 201).json({ ...profile, isLinkedToNeonAuth: Boolean(externalAuthId) });
  } catch (error) { next(error); }
});

adminRouter.put("/users/:userId/roles", requirePermissions("users.update"), async (request, response, next) => {
  try {
    const userId = idSchema.parse(request.params.userId); const data = userRolesSchema.parse(request.body);
    if (!await ensureSingleSuperAdministrator(data.roleIds, userId)) { response.status(409).json({ error: "Only one user can hold the Super Administrator role." }); return; }
    const user = await prisma.user.update({ where: { id: userId }, data: { roles: { deleteMany: {}, create: data.roleIds.map((roleId) => ({ roleId })) } }, select: userSelection });
    await writeAuditLog({ userId: request.auth!.id, action: "ASSIGN_ROLES", module: "users", recordType: "User", recordId: user.id, newValues: data }, request);
    const { externalAuthId, ...profile } = user;
    response.json({ ...profile, isLinkedToNeonAuth: Boolean(externalAuthId) });
  } catch (error) { next(error); }
});

adminRouter.patch("/users/:userId/status", requirePermissions("users.deactivate"), async (request, response, next) => {
  try {
    const userId = idSchema.parse(request.params.userId); const { isActive } = userStatusSchema.parse(request.body);
    const user = await prisma.user.update({ where: { id: userId }, data: { isActive }, select: userSelection });
    await writeAuditLog({ userId: request.auth!.id, action: isActive ? "ACTIVATE" : "DEACTIVATE", module: "users", recordType: "User", recordId: user.id, newValues: { isActive } }, request);
    const { externalAuthId, ...profile } = user;
    response.json({ ...profile, isLinkedToNeonAuth: Boolean(externalAuthId) });
  } catch (error) { next(error); }
});

adminRouter.get("/audit-logs", requirePermissions("audit.view"), async (request, response, next) => {
  try {
    const requestedTake = Number(request.query.limit ?? 50); const take = Number.isInteger(requestedTake) ? Math.min(Math.max(requestedTake, 1), 100) : 50;
    response.json(await prisma.auditLog.findMany({ take, orderBy: { createdAt: "desc" }, include: { user: { select: { firstName: true, lastName: true, email: true } } } }));
  } catch (error) { next(error); }
});
