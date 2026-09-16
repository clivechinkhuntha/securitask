import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const permissions = [
  ["users", "view", "View users"], ["users", "create", "Create users"], ["users", "update", "Update users"], ["users", "deactivate", "Deactivate users"],
  ["roles", "view", "View roles and permissions"], ["roles", "create", "Create roles"], ["roles", "update", "Update roles"], ["roles", "delete", "Delete roles"], ["roles", "assign_permissions", "Assign permissions to roles"],
  ["clients", "view", "View clients"], ["clients", "create", "Create clients"], ["clients", "update", "Update clients"], ["clients", "archive", "Archive clients"],
  ["contracts", "view", "View client contracts"], ["contracts", "create", "Create client contracts"], ["contracts", "update", "Update client contracts"], ["contracts", "archive", "Archive client contracts"],
  ["sites", "view", "View client sites"], ["sites", "create", "Create client sites"], ["sites", "update", "Update client sites"], ["sites", "archive", "Archive client sites"],
  ["employees", "view", "View employees"], ["employees", "create", "Create employees"], ["employees", "update", "Update employees"], ["employees", "archive", "Archive employees"],
  ["accounts", "view", "View financial accounts"], ["accounts", "create", "Create financial accounts"], ["accounts", "update", "Update financial accounts"],
  ["expense_categories", "view", "View expense categories"], ["expense_categories", "create", "Create expense categories"], ["expense_categories", "update", "Update expense categories"],
  ["invoices", "view", "View invoices"], ["invoices", "create", "Create invoices"], ["invoices", "update", "Update invoices"], ["invoices", "issue", "Issue invoices"], ["invoices", "cancel", "Cancel invoices"],
  ["payments", "view", "View payments"], ["payments", "create", "Record payments"], ["payments", "reverse", "Reverse payments"],
  ["expenses", "view", "View expenses"], ["expenses", "create", "Record expenses"], ["expenses", "update", "Update expenses"], ["expenses", "approve", "Approve expenses"], ["expenses", "void", "Void expenses"],
  ["payroll", "view", "View payroll"], ["payroll", "create", "Create payroll runs"], ["payroll", "update", "Update payroll runs"], ["payroll", "approve", "Approve payroll"], ["payroll", "mark_paid", "Record payroll payment"],
  ["advances", "view", "View employee advances"], ["advances", "create", "Record employee advances"], ["advances", "update", "Update employee advances"], ["advances", "recover", "Recover employee advances"],
  ["reports", "view", "View reports"], ["reports", "export", "Export reports"],
  ["audit", "view", "View audit logs"], ["settings", "view", "View settings"], ["settings", "update", "Update settings"],
] as const;

async function main() {
  for (const [module, action, description] of permissions) await prisma.permission.upsert({ where: { key: `${module}.${action}` }, update: { description, isActive: true }, create: { module, action, key: `${module}.${action}`, description } });
  const role = await prisma.role.upsert({ where: { name: "Super Administrator" }, update: { isSystemRole: true, isActive: true }, create: { name: "Super Administrator", description: "Protected system-level role with full access.", isSystemRole: true } });
  const allPermissions = await prisma.permission.findMany({ select: { id: true } });
  await prisma.rolePermission.createMany({ data: allPermissions.map(({ id }) => ({ roleId: role.id, permissionId: id })), skipDuplicates: true });

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    const [firstName = "System", ...lastNameParts] = email.split("@")[0].split(/[._-]/).filter(Boolean);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, isActive: true },
      create: { email, firstName, lastName: lastNameParts.join(" ") || "Administrator", passwordHash, isActive: true },
    });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
  }
}

main().finally(() => prisma.$disconnect());
