import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication } from "../auth/auth.middleware.js";

const asNumber = (value: { toString(): string } | number) => Number(value);

export const dashboardRouter = Router();
dashboardRouter.use(requireAuthentication);

dashboardRouter.get("/summary", async (request, response, next) => {
  try {
    const permissions = new Set(request.auth!.permissions);
    const can = (permission: string) => permissions.has(permission);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [accounts, payments, invoices, expenses, employeeCounts] = await Promise.all([
      can("accounts.view") ? prisma.financialAccount.findMany({ where: { isActive: true }, include: { transactions: { where: { status: "POSTED" }, select: { amount: true, direction: true } } } }) : Promise.resolve(null),
      can("payments.view") ? prisma.payment.findMany({ where: { status: "RECORDED", paymentDate: { gte: monthStart } }, select: { amount: true } }) : Promise.resolve(null),
      can("invoices.view") ? prisma.invoice.findMany({ where: { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } }, select: { total: true, allocations: { include: { payment: { select: { status: true } } } } } }) : Promise.resolve(null),
      can("expenses.view") ? prisma.expense.findMany({ where: { status: "PAID", expenseDate: { gte: monthStart } }, select: { amount: true } }) : Promise.resolve(null),
      can("employees.view") ? prisma.employee.groupBy({ by: ["status"], _count: { _all: true } }) : Promise.resolve(null),
    ]);

    const availableFunds = accounts?.reduce((total, account) => total + asNumber(account.openingBalance) + account.transactions.reduce((balance, transaction) => balance + (transaction.direction === "CREDIT" ? asNumber(transaction.amount) : -asNumber(transaction.amount)), 0), 0) ?? null;
    const receivedThisMonth = payments?.reduce((total, payment) => total + asNumber(payment.amount), 0) ?? null;
    const expensesThisMonth = expenses?.reduce((total, expense) => total + asNumber(expense.amount), 0) ?? null;
    const outstandingInvoices = invoices?.reduce((total, invoice) => {
      const paid = invoice.allocations.filter((allocation) => allocation.payment.status === "RECORDED").reduce((sum, allocation) => sum.add(allocation.amount), new Prisma.Decimal(0));
      return total.add(Prisma.Decimal.max(0, invoice.total.sub(paid)));
    }, new Prisma.Decimal(0)).toFixed(2) ?? null;
    const totalEmployees = employeeCounts?.reduce((total, group) => total + group._count._all, 0) ?? null;

    response.json({
      currency: accounts?.[0]?.currency ?? "MWK",
      availableFunds,
      receivedThisMonth,
      expensesThisMonth,
      outstandingInvoices,
      totalEmployees,
    });
  } catch (error) { next(error); }
});

