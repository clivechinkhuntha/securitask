"use client";

import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { demoAdvances, demoExpenses, demoInvoices, demoPayments, demoPayrollRuns } from "@/lib/demo-data";

function amount(value: string) { return Number(value.replaceAll(/[^0-9]/g, "")); }
function money(value: number) { return `MWK ${value.toLocaleString()}`; }

export default function ReportsPage() {
  const income = demoPayments.filter((payment) => payment.status === "RECORDED").reduce((sum, payment) => sum + amount(payment.amount), 0);
  const expenses = demoExpenses.filter((expense) => expense.status === "PAID").reduce((sum, expense) => sum + amount(expense.amount), 0);
  const outstanding = demoInvoices.reduce((sum, invoice) => sum + amount(invoice.balance), 0);
  const payroll = amount(demoPayrollRuns[0].totalNetPay);
  const advances = demoAdvances.reduce((sum, advance) => sum + amount(advance.balance), 0);
  const reports = [{ name: "Income report", description: "Recorded client payments by period.", value: money(income) }, { name: "Expense report", description: "Paid operational expenses by category.", value: money(expenses) }, { name: "Outstanding invoices", description: "Unpaid and partially paid client balances.", value: money(outstanding) }, { name: "Payroll report", description: "Net pay for the current payroll run.", value: money(payroll) }, { name: "Advances report", description: "Employee advance balances awaiting recovery.", value: money(advances) }, { name: "Profit & loss", description: "Recorded income less paid expenses.", value: money(income - expenses) }];

  return <ProtectedPage>{(session) => <AppShell session={session}><section className="mt-10"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f4c20d]">Reporting</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Reports</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Operational financial summaries calculated from the currently recorded demo data.</p></div><select className="rounded-lg border border-white/15 bg-[#1f1f1f] px-4 py-3 text-sm text-white outline-none focus:border-[#f4c20d]"><option>May 2026</option><option>This quarter</option><option>This year</option></select></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map((report) => <article key={report.name} className="rounded-xl border border-white/10 bg-[#1f1f1f] p-6 transition hover:border-[#f4c20d]/40"><p className="text-sm text-white/50">{report.name}</p><p className="mt-4 text-2xl font-semibold text-[#f4c20d]">{report.value}</p><p className="mt-3 min-h-10 text-sm leading-5 text-white/55">{report.description}</p><button className="mt-6 text-sm font-semibold text-white/80 transition hover:text-[#f4c20d]">View report →</button></article>)}</div><section className="mt-8 rounded-xl border border-white/10 bg-[#1f1f1f]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Report readiness</h2><p className="mt-1 text-sm text-white/45">Exports will be enabled after reports are connected to Supabase.</p></div><div className="grid gap-4 p-5 sm:grid-cols-3"><div><p className="text-sm text-white/45">Data source</p><p className="mt-1 font-medium">Demo records</p></div><div><p className="text-sm text-white/45">Export formats</p><p className="mt-1 font-medium">PDF and Excel planned</p></div><div><p className="text-sm text-white/45">Filters</p><p className="mt-1 font-medium">Date, client, account</p></div></div></section></section></AppShell>}</ProtectedPage>;
}
