import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });

async function main() {
  await prisma.$transaction(async (transaction) => {
    const role = await transaction.role.findUniqueOrThrow({ where: { name: "Super Administrator" } });
    if (!role.isSystemRole) throw new Error("The Super Administrator role is not a protected system role.");
    const permission = await transaction.permission.upsert({
      where: { key: "payments.update" },
      update: {},
      create: { module: "payments", action: "update", key: "payments.update", description: "Update payment details" },
    });
    if (!permission.isActive) throw new Error("The payments.update permission is inactive; review it before granting access.");
    await transaction.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  });
  console.log("Payment update permission registered for the protected Super Administrator role.");
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
