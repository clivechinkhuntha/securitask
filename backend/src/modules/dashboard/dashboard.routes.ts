import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication } from "../auth/auth.middleware.js";

const asNumber = (value: { toString(): string } | number) => Number(value);

export const dashboardRouter = Router();
dashboardRouter.use(requireAuthentication);

dashboardRouter.get("/summary", async (request, response, next) => {
  try {
    const permissions = new Set(request.auth!.permissions);
    const can = (permission: string) => permissions.has(permission);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [accounts, payments, invoices, paidExpenses, payrollRuns, advances, clientCount, employeeCounts, activity] = await Promise.all([
      can("accounts.view") ? prisma.financialAccount.findMany({ where: { isActive: true }, include: { transactions: { where: { status: "POSTED" }, select: { amount: true, direction: true } } } }) : Promise.resolve(null),
      can("payments.view") ? prisma.payment.findMany({ where: { status: "RECORDED", paymentDate: { gte: monthStart } }, select: { amount: true } }) : Promise.resolve(null),
      can("invoices.view") ? prisma.invoice.findMany({ where: { status: { not: "CANCELLED" } }, select: { total: true, dueDate: true, allocations: { include: { payment: { select: { status: true } } } } } }) : Promise.resolve(null),
      can("expenses.view") ? prisma.expense.findMany({ where: { status: "PAID", expenseDate: { gte: monthStart } }, select: { amount: true } }) : Promise.resolve(null),
      can("payroll.view") ? prisma.payrollRun.findMany({ where: { status: { in: ["DRAFT", "REVIEWED", "APPROVED"] } }, include: { items: { select: { netPay: true } } } }) : Promise.resolve(null),
      can("advances.view") ? prisma.employeeAdvance.findMany({ where: { status: { not: "CANCELLED" } }, include: { recoveries: { select: { amount: true } } } }) : Promise.resolve(null),
      can("clients.view") ? prisma.client.count() : Promise.resolve(null),
      can("employees.view") ? prisma.employee.groupBy({ by: ["status"], _count: { _all: true } }) : Promise.resolve(null),
      can("audit.view") ? prisma.auditLog.findMany({ take: 6, orderBy: { createdAt: "desc" }, select: { id: true, action: true, module: true, recordType: true, createdAt: true, user: { select: { firstName: true, lastName: true } } } }) : Promise.resolve(null),
    ]);

    const availableFunds = accounts?.reduce((total, account) => total + asNumber(account.openingBalance) + account.transactions.reduce((balance, transaction) => balance + (transaction.direction === "CREDIT" ? asNumber(transaction.amount) : -asNumber(transaction.amount)), 0), 0) ?? null;
    const receivedThisMonth = payments?.reduce((total, payment) => total + asNumber(payment.amount), 0) ?? null;
    const expensesThisMonth = paidExpenses?.reduce((total, expense) => total + asNumber(expense.amount), 0) ?? null;

    const invoiceBalances = invoices?.map((invoice) => ({ balance: asNumber(invoice.total) - invoice.allocations.filter((allocation) => allocation.payment.status === "RECORDED").reduce((paid, allocation) => paid + asNumber(allocation.amount), 0), overdue: invoice.dueDate < now })) ?? null;
    const outstandingInvoices = invoiceBalances?.reduce((total, invoice) => total + Math.max(0, invoice.balance), 0) ?? null;
    const overdueInvoices = invoiceBalances ? invoiceBalances.filter((invoice) => invoice.overdue && invoice.balance > 0) : null;
    const payrollDue = payrollRuns?.reduce((total, run) => total + run.items.reduce((runTotal, item) => runTotal + asNumber(item.netPay), 0), 0) ?? null;
    const outstandingAdvances = advances?.reduce((total, advance) => total + Math.max(0, asNumber(advance.amount) - advance.recoveries.reduce((recovered, recovery) => recovered + asNumber(recovery.amount), 0)), 0) ?? null;
    const totalEmployees = employeeCounts?.reduce((total, group) => total + group._count._all, 0) ?? null;
    const activeEmployees = employeeCounts?.find((group) => group.status === "ACTIVE")?._count._all ?? (employeeCounts ? 0 : null);

    response.json({
      currency: accounts?.[0]?.currency ?? "MWK", availableFunds, receivedThisMonth, expensesThisMonth, outstandingInvoices, payrollDue, outstandingAdvances, totalClients: clientCount, totalEmployees, activeEmployees,
      alerts: [
        ...(overdueInvoices?.length ? [{ key: "overdue-invoices", kind: "warning", title: "Overdue invoices", detail: overdueInvoices.length + " invoice" + (overdueInvoices.length === 1 ? "" : "s") + " need follow-up.", amount: overdueInvoices.reduce((total, invoice) => total + invoice.balance, 0), href: "/invoices" }] : []),
        ...(payrollRuns?.length ? [{ key: "payroll-pending", kind: "warning", title: "Payroll needs attention", detail: payrollRuns.length + " payroll run" + (payrollRuns.length === 1 ? "" : "s") + " await review, approval, or payment.", amount: payrollDue ?? 0, href: "/payroll" }] : []),
        ...(outstandingAdvances && outstandingAdvances > 0 ? [{ key: "advances", kind: "info", title: "Outstanding advances", detail: "Employee advances remain to be recovered.", amount: outstandingAdvances, href: "/advances" }] : []),
      ],
      activity: activity?.map((entry) => ({ ...entry, actor: entry.user ? (entry.user.firstName + " " + entry.user.lastName).trim() : "System" })) ?? null,
    });
  } catch (error) { next(error); }
});
