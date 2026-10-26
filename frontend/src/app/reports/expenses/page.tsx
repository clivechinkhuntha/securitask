"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Expense = { id: string; expenseNumber: string; expenseDate: string; description: string; amount: string; supplier: string | null; status: "RECORDED" | "APPROVED" | "PAID" | "VOIDED"; category: { id: string; name: string } };
type Range = "week" | "month" | "three-months" | "year" | "custom" | "all";

const money = (value: number) => `MWK ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const dateValue = (date: Date) => date.toLocaleDateString("en-CA");

function rangeDates(range: Range) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  if (range === "week") start.setDate(end.getDate() - 6);
  if (range === "month") start.setDate(1);
  if (range === "three-months") start.setMonth(end.getMonth() - 2, 1);
  if (range === "year") start.setMonth(0, 1);
  return { from: range === "all" ? "" : dateValue(start), to: range === "all" ? "" : dateValue(end) };
}

function ExpenseReport({ session }: { session: AuthSession }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [range, setRange] = useState<Range>("month");
  const [from, setFrom] = useState(() => rangeDates("month").from);
  const [to, setTo] = useState(() => rangeDates("month").to);
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("PAID");
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Expense[]>("/api/finance/expenses", session.token).then(setExpenses).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load the expense report."));
  }, [session.token]);

  const categories = useMemo(() => Array.from(new Map(expenses.map((expense) => [expense.category.id, expense.category])).values()).sort((first, second) => first.name.localeCompare(second.name)), [expenses]);
  const filtered = useMemo(() => expenses.filter((expense) => {
    const expenseDate = expense.expenseDate.slice(0, 10);
    const matchesDate = (!from || expenseDate >= from) && (!to || expenseDate <= to);
    const matchesCategory = categoryId === "all" || expense.category.id === categoryId;
    const matchesStatus = status === "valid" ? expense.status !== "VOIDED" : expense.status === status;
    return matchesDate && matchesCategory && matchesStatus;
  }), [expenses, from, to, categoryId, status]);
  const total = filtered.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const categoryTotals = useMemo(() => Array.from(filtered.reduce((totals, expense) => totals.set(expense.category.name, (totals.get(expense.category.name) ?? 0) + Number(expense.amount)), new Map<string, number>()).entries()).sort((first, second) => second[1] - first[1]), [filtered]);

  const setPreset = (nextRange: Range) => {
    setRange(nextRange);
    if (nextRange !== "custom") {
      const dates = rangeDates(nextRange);
      setFrom(dates.from);
      setTo(dates.to);
    }
  };

  return <AppShell session={session}><section className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3 print:hidden"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Reporting</p><h1 className="mt-1 text-2xl font-semibold">Expense report</h1><p className="mt-1 text-sm text-white/55">Review recorded expenses by period, category, and status.</p></div><button type="button" onClick={() => window.print()} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d]">Print / save PDF</button></header>
    {error && <p role="alert" className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
    <section className="rounded-lg border border-white/15 bg-[#111414] p-4 print:hidden"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><label className="space-y-1 text-sm text-white/65"><span>Period</span><select value={range} onChange={(event) => setPreset(event.target.value as Range)} className="field w-full"><option value="week">This week</option><option value="month">This month</option><option value="three-months">Last 3 months</option><option value="year">This year</option><option value="custom">Custom range</option><option value="all">All time</option></select></label><label className="space-y-1 text-sm text-white/65"><span>From</span><input type="date" value={from} disabled={range === "all"} onChange={(event) => { setRange("custom"); setFrom(event.target.value); }} className="field w-full disabled:opacity-45" /></label><label className="space-y-1 text-sm text-white/65"><span>To</span><input type="date" value={to} disabled={range === "all"} onChange={(event) => { setRange("custom"); setTo(event.target.value); }} className="field w-full disabled:opacity-45" /></label><label className="space-y-1 text-sm text-white/65"><span>Category</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="field w-full"><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="space-y-1 text-sm text-white/65"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="field w-full"><option value="PAID">Paid only</option><option value="valid">All valid expenses</option><option value="RECORDED">Recorded</option><option value="APPROVED">Approved</option><option value="VOIDED">Voided</option></select></label></div></section>
    <section className="grid gap-4 sm:grid-cols-2"><article className="rounded-lg border border-white/15 bg-[#111414] p-5"><p className="text-sm text-white/60">Total expenses</p><p className="mt-2 text-3xl font-semibold text-[#f4c20d]">{money(total)}</p><p className="mt-2 text-sm text-white/50">{filtered.length} matching expense{filtered.length === 1 ? "" : "s"}</p></article><article className="rounded-lg border border-white/15 bg-[#111414] p-5"><p className="text-sm text-white/60">Period</p><p className="mt-2 text-lg font-semibold">{from && to ? `${new Date(`${from}T00:00:00`).toLocaleDateString()} – ${new Date(`${to}T00:00:00`).toLocaleDateString()}` : "All recorded dates"}</p><p className="mt-2 text-sm text-white/50">{status === "PAID" ? "Paid expenses only" : status === "valid" ? "All non-voided expenses" : `${status[0]} ${status.slice(1).toLowerCase()} expenses`}</p></article></section>
    <section className="overflow-hidden rounded-lg border border-white/15 bg-[#111414]"><div className="border-b border-white/10 p-4"><h2 className="font-semibold">Expense details</h2></div><div className="overflow-x-auto"><table className="min-w-[680px] w-full text-left text-sm"><thead className="bg-white/[.03] text-xs uppercase text-white/45"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Expense</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Amount</th></tr></thead><tbody>{filtered.map((expense) => <tr key={expense.id} className="border-t border-white/8"><td className="px-4 py-3">{new Date(expense.expenseDate).toLocaleDateString()}</td><td className="px-4 py-3"><p className="font-medium">{expense.description}</p><p className="mt-1 text-xs text-white/50">{expense.expenseNumber}{expense.supplier ? ` · ${expense.supplier}` : ""}</p></td><td className="px-4 py-3">{expense.category.name}</td><td className="px-4 py-3">{expense.status[0]}{expense.status.slice(1).toLowerCase()}</td><td className="px-4 py-3 text-right font-medium">{money(Number(expense.amount))}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-white/50">No expenses match these filters.</td></tr>}</tbody></table></div></section>
    <section className="rounded-lg border border-white/15 bg-[#111414] p-5"><h2 className="font-semibold">Category breakdown</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categoryTotals.map(([category, amount]) => <div key={category} className="rounded-md border border-white/10 p-3"><p className="text-sm text-white/60">{category}</p><p className="mt-1 font-semibold">{money(amount)}</p></div>)}{categoryTotals.length === 0 && <p className="text-sm text-white/50">No category totals for these filters.</p>}</div></section>
    <style jsx global>{`@media print { .app-sidebar, .dashboard-shell > header, .print\\:hidden { display: none !important; } .dashboard-shell > section { padding: 0 !important; } body { background: white !important; } }`}</style>
  </section></AppShell>;
}

export default function ExpenseReportPage() { return <ProtectedPage>{(session) => <ExpenseReport session={session} />}</ProtectedPage>; }
