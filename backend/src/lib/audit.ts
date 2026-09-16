import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "./prisma.js";

type AuditEntry = {
  userId?: string;
  action: string;
  module: string;
  recordType: string;
  recordId?: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(entry: AuditEntry, request?: Request) {
  await prisma.auditLog.create({
    data: {
      ...entry,
      ipAddress: request?.ip,
      userAgent: request?.get("user-agent"),
    },
  });
}
