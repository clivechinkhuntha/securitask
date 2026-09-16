import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication } from "./auth.middleware.js";

const userWithRoles = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
} as const;

function effectivePermissions(roles: { role: { isActive: boolean; permissions: { permission: { key: string; isActive: boolean } }[] } }[]) {
  return [...new Set(roles.flatMap(({ role }) => role.isActive ? role.permissions.filter(({ permission }) => permission.isActive).map(({ permission }) => permission.key) : []))];
}

export const authRouter = Router();

const credentialsSchema = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string().min(8).max(128) });
const registrationSchema = credentialsSchema.extend({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80) });

function issueLocalToken(user: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be configured.");
  return jwt.sign({ email: user.email }, secret, { algorithm: "HS256", subject: user.id, issuer: "securitask-local", expiresIn: (process.env.JWT_EXPIRES_IN ?? "8h") as SignOptions["expiresIn"] });
}

function profile(user: { id: string; firstName: string; lastName: string; email: string; isActive: boolean; roles: Parameters<typeof effectivePermissions>[0] }) {
  return { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, isActive: user.isActive }, permissions: effectivePermissions(user.roles) };
}

authRouter.post("/login", async (request, response, next) => {
  try {
    const { email, password } = credentialsSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email }, include: userWithRoles });
    if (!user || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) { response.status(401).json({ error: "Incorrect email or password." }); return; }
    if (!user.isActive) { response.status(401).json({ error: "Your account is inactive." }); return; }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await writeAuditLog({ userId: user.id, action: "LOGIN", module: "auth", recordType: "User", recordId: user.id }, request);
    response.json({ token: issueLocalToken(user), ...profile(user) });
  } catch (error) { next(error); }
});

authRouter.post("/register", async (request, response, next) => {
  try {
    const data = registrationSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: data.email }, include: userWithRoles });
    if (!user) { response.status(403).json({ error: "Your email has not been added to Securitask. Ask an administrator to add you first." }); return; }
    if (user.passwordHash) { response.status(409).json({ error: "This account already has a password. Sign in instead." }); return; }
    if (!user.isActive) { response.status(401).json({ error: "Your account is inactive." }); return; }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const registered = await prisma.user.update({ where: { id: user.id }, data: { firstName: data.firstName, lastName: data.lastName, passwordHash, lastLoginAt: new Date() }, include: userWithRoles });
    await writeAuditLog({ userId: registered.id, action: "REGISTER", module: "auth", recordType: "User", recordId: registered.id }, request);
    response.status(201).json({ token: issueLocalToken(registered), ...profile(registered) });
  } catch (error) { next(error); }
});

authRouter.get("/me", requireAuthentication, async (request, response, next) => {
  try {
    if (request.auth!.externalAuthId.startsWith("local:")) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.id }, include: userWithRoles });
      if (!user.isActive) { response.status(401).json({ error: "Your account is inactive." }); return; }
      response.json(profile(user));
      return;
    }
    const email = request.auth!.email.toLowerCase();
    const externalAuthId = request.auth!.externalAuthId;
    let user = await prisma.user.findUnique({ where: { externalAuthId }, include: userWithRoles });

    if (!user) {
      const [firstName = "User", ...remainingNames] = email.split("@")[0].split(/[._-]/).filter(Boolean);
      const existingEmailUser = await prisma.user.findUnique({ where: { email } });
      user = existingEmailUser
        ? await prisma.user.update({ where: { id: existingEmailUser.id }, data: { externalAuthId }, include: userWithRoles })
        : await prisma.user.create({ data: { externalAuthId, email, firstName, lastName: remainingNames.join(" ") || "User" }, include: userWithRoles });

      if (process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase() === email) {
        const superAdmin = await prisma.role.findUnique({ where: { name: "Super Administrator" } });
        if (superAdmin) await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } }, update: {}, create: { userId: user.id, roleId: superAdmin.id } });
        user = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: userWithRoles });
      }

      await writeAuditLog({ userId: user.id, action: "PROFILE_PROVISIONED", module: "auth", recordType: "User", recordId: user.id, metadata: { provider: "neon-auth" } }, request);
    }

    if (!user.isActive) { response.status(401).json({ error: "Your account is inactive." }); return; }
    const permissions = effectivePermissions(user.roles);
    response.json({ user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, isActive: user.isActive }, permissions });
  } catch (error) { next(error); }
});
