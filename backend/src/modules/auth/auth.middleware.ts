import { createRemoteJWKSet, jwtVerify } from "jose";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser } from "./auth.types.js";
import { prisma } from "../../lib/prisma.js";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  const url = process.env.NEON_AUTH_JWKS_URL;
  if (!url) throw new Error("NEON_AUTH_JWKS_URL must be configured.");
  jwks ??= createRemoteJWKSet(new URL(url));
  return jwks;
}

export async function requireAuthentication(request: Request, response: Response, next: NextFunction) {
  const token = request.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) { response.status(401).json({ error: "Authentication is required." }); return; }

  const localIdentity = verifyLocalToken(token);
  if (localIdentity) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: localIdentity.id },
        include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
      });
      if (!user || !user.isActive || user.email.toLowerCase() !== localIdentity.email) { response.status(401).json({ error: "Your session is invalid or your account is inactive." }); return; }
      const permissions = [...new Set(user.roles.flatMap(({ role }) => role.isActive ? role.permissions.filter(({ permission }) => permission.isActive).map(({ permission }) => permission.key) : []))];
      request.auth = { id: user.id, externalAuthId: `local:${user.id}`, email: user.email, permissions } satisfies AuthenticatedUser;
      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  let payload: Awaited<ReturnType<typeof jwtVerify>>["payload"];
  try {
    ({ payload } = await jwtVerify(token, getJwks()));
  } catch {
    response.status(401).json({ error: "Your Neon Auth session is invalid or has expired." });
    return;
  }

  if (!payload.sub || typeof payload.email !== "string") { response.status(401).json({ error: "The authentication token is missing required identity claims." }); return; }

  try {
    const user = await prisma.user.findUnique({
      where: { externalAuthId: payload.sub },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
    const permissions = user ? [...new Set(user.roles.flatMap(({ role }) => role.isActive ? role.permissions.filter(({ permission }) => permission.isActive).map(({ permission }) => permission.key) : []))] : [];
    request.auth = { id: user?.id ?? payload.sub, externalAuthId: payload.sub, email: payload.email, permissions } satisfies AuthenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
}

function verifyLocalToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"], issuer: "securitask-local" });
    if (typeof payload === "string" || typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { id: payload.sub, email: payload.email.toLowerCase() };
  } catch {
    return null;
  }
}

export function requirePermissions(...requiredPermissions: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const permissions = new Set(request.auth?.permissions ?? []);
    if (!requiredPermissions.every((permission) => permissions.has(permission))) { response.status(403).json({ error: "You do not have permission to perform this action." }); return; }
    next();
  };
}
