import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuthentication } from "../auth/auth.middleware.js";

const asNumber = (value: { toString(): string } | number) => Number(value);

export const dashboardRouter = Router();
dashboardRouter.use(requireAuthentication);

dashboardRouter.get("/summary", async (_request, response, next) => {
  try {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);
    const [accounts, payments, invoices, paidExpenses, payrollRuns, advances, transactions] = await Promise.all([
      prisma.financialAccount.findMany({ where: { isActive: true }, include: { transactions: { where: { status: "POSTED" }, select: { amount: true, direction: true } } } }),
      prisma.payment.findMany({ where: { status: "RECORDED" }, select: { amount: true } }),
      prisma.invoice.findMany({ where: { status: { not: "CANCELLED" } }, select: { total: true, allocations: { include: { payment: { select: { status: true } } } } } }),
      prisma.expense.findMany({ where: { status: "PAID" }, include: { category: { select: { name: true } } } }),
      prisma.payrollRun.findMany({ where: { status: { in: ["DRAFT", "REVIEWED", "APPROVED"] } }, include: { items: { select: { netPay: true } } } }),
      prisma.employeeAdvance.findMany({ where: { status: { not: "CANCELLED" } }, include: { recoveries: { select: { amount: true } } } }),
      prisma.accountTransaction.findMany({ where: { status: "POSTED", transactionDate: { gte: sixMonthsAgo } }, select: { transactionDate: true, amount: true, direction: true } }),
    ]);
    const accountBalance = (type: "BANK" | "CASH") => accounts.filter((account) => account.accountType === type).reduce((total, account) => total + asNumber(account.openingBalance) + account.transactions.reduce((balance, transaction) => balance + (transaction.direction === "CREDIT" ? asNumber(transaction.amount) : -asNumber(transaction.amount)), 0), 0);
    const totalReceived = payments.reduce((total, payment) => total + asNumber(payment.amount), 0);
    const totalExpenses = paidExpenses.reduce((total, expense) => total + asNumber(expense.amount), 0);
    const outstandingInvoices = invoices.reduce((total, invoice) => total + asNumber(invoice.total) - invoice.allocations.filter((allocation) => allocation.payment.status === "RECORDED").reduce((paid, allocation) => paid + asNumber(allocation.amount), 0), 0);
    const payrollDue = payrollRuns.reduce((total, run) => total + run.items.reduce((runTotal, item) => runTotal + asNumber(item.netPay), 0), 0);
    const outstandingAdvances = advances.reduce((total, advance) => total + asNumber(advance.amount) - advance.recoveries.reduce((recovered, item) => recovered + asNumber(item.amount), 0), 0);
    const categoryTotals = new Map<string, number>(); paidExpenses.forEach((expense) => categoryTotals.set(expense.category.name, (categoryTotals.get(expense.category.name) ?? 0) + asNumber(expense.amount)));
    const expenseCategories = [...categoryTotals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4).map(([name, amount]) => ({ name, amount }));
    const cashFlow = Array.from({ length: 6 }, (_, index) => { const date = new Date(sixMonthsAgo); date.setMonth(date.getMonth() + index); const key = `${date.getFullYear()}-${date.getMonth()}`; return { label: date.toLocaleDateString("en", { month: "short" }), amount: transactions.filter((transaction) => `${transaction.transactionDate.getFullYear()}-${transaction.transactionDate.getMonth()}` === key).reduce((total, transaction) => total + (transaction.direction === "CREDIT" ? asNumber(transaction.amount) : -asNumber(transaction.amount)), 0) }; });
    response.json({ currency: accounts[0]?.currency ?? "MWK", bankBalance: accountBalance("BANK"), cashBalance: accountBalance("CASH"), totalReceived, totalExpenses, outstandingInvoices, payrollDue, outstandingAdvances, netProfit: totalReceived - totalExpenses, cashFlow, expenseCategories });
  } catch (error) { next(error); }
});
