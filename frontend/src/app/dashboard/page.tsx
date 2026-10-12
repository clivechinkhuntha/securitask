"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Alert = { key: string; kind: "warning" | "info"; title: string; detail: string; amount: number; href: string };
type Activity = { id: string; action: string; module: string; recordType: string; createdAt: string; actor: string };
type OperationalCard = { label: string; value: string; subtext?: string; href: string };
type Summary = {
  currency: string; availableFunds: number | null; receivedThisMonth: number | null; expensesThisMonth: number | null;
  outstandingInvoices: number | null; payrollDue: number | null; outstandingAdvances: number | null;
  totalClients: number | null; totalEmployees: number | null; activeEmployees: number | null;
  alerts: Alert[]; activity: Activity[] | null;
};

const money = (amount: number, currency: string) => `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const hasPermission = (session: AuthSession, permission: string) => session.permissions.includes(permission);

function Dashboard({ session }: { session: AuthSession }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Summary>("/api/dashboard/summary", session.token).then(setSummary).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load dashboard data."));
  }, [session.token]);

  const cards = useMemo(() => {
    if (!summary) return [];
    return [
      hasPermission(session, "accounts.view") && summary.availableFunds !== null ? { key: "funds", icon: "◫", label: "Available funds", value: summary.availableFunds, helper: "Bank, cash, and recorded accounts", href: "/accounts" } : null,
      hasPermission(session, "invoices.view") && summary.outstandingInvoices !== null ? { key: "invoices", icon: "▤", label: "Outstanding invoices", value: summary.outstandingInvoices, helper: "Client balances still due", href: "/invoices" } : null,
      hasPermission(session, "payments.view") && summary.receivedThisMonth !== null ? { key: "received", icon: "↓", label: "Received this month", value: summary.receivedThisMonth, helper: "Valid recorded client payments", href: "/payments" } : null,
      hasPermission(session, "expenses.view") && summary.expensesThisMonth !== null ? { key: "expenses", icon: "↑", label: "Expenses this month", value: summary.expensesThisMonth, helper: "Paid expenses recorded this month", href: "/expenses" } : null,
      hasPermission(session, "employees.view") && summary.totalEmployees !== null ? { key: "employees", icon: "♟", label: "Total employees", value: summary.totalEmployees, helper: `${summary.activeEmployees ?? 0} active employee${summary.activeEmployees === 1 ? "" : "s"}`, href: "/employees" } : null,
    ].filter((card): card is { key: string; icon: string; label: string; value: number; helper: string; href: string } => Boolean(card));
  }, [session, summary]);

  const operational: OperationalCard[] = summary ? [
    hasPermission(session, "clients.view") && summary.totalClients !== null ? { label: "Clients", value: summary.totalClients.toLocaleString(), href: "/clients" } : null,
    hasPermission(session, "employees.view") && summary.totalEmployees !== null ? { label: "Employees", value: summary.totalEmployees.toLocaleString(), subtext: `${summary.activeEmployees ?? 0} active`, href: "/employees" } : null,
    hasPermission(session, "payroll.view") && summary.payrollDue !== null ? { label: "Payroll pending", value: money(summary.payrollDue, summary.currency), href: "/payroll" } : null,
    hasPermission(session, "advances.view") && summary.outstandingAdvances !== null ? { label: "Outstanding advances", value: money(summary.outstandingAdvances, summary.currency), href: "/advances" } : null,
  ].filter((item): item is OperationalCard => item !== null) : [];

  return <AppShell session={session}><section className="mx-auto max-w-7xl space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Dashboard</p><h1 className="mt-1 text-2xl font-semibold">Overview</h1><p className="mt-1 text-sm text-white/55">The information you need to act on today.</p></header>
    {error && <p role="alert" className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
    {!summary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-lg border border-white/10 bg-white/[.06]" />)}</div> : <>{cards.length > 0 && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((card) => <Link key={card.key} href={card.href} className="group rounded-xl border border-white/15 bg-[linear-gradient(145deg,#171a1a,#101212)] p-4 transition hover:-translate-y-0.5 hover:border-[#f4c20d]/65"><div className="flex items-start justify-between gap-3"><p className="text-sm text-white/60">{card.label}</p><span className="text-xl text-[#f4c20d]">{card.icon}</span></div><p className="mt-4 text-2xl font-semibold">{money(card.value, summary.currency)}</p><p className="mt-2 text-xs text-white/45">{card.helper}</p><p className="mt-4 text-xs font-semibold text-[#f4c20d]">Open {card.label.toLowerCase()} ›</p></Link>)}</section>}
      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111414]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Needs attention</h2><p className="mt-1 text-sm text-white/55">Items that may need your next action.</p></div><div className="divide-y divide-white/8">{summary.alerts.length ? summary.alerts.map((alert) => <Link key={alert.key} href={alert.href} className="flex items-center justify-between gap-4 p-4 transition hover:bg-white/[.03]"><div><p className={alert.kind === "warning" ? "font-medium text-[#ffe48a]" : "font-medium text-white"}>{alert.title}</p><p className="mt-1 text-sm text-white/55">{alert.detail}</p></div><div className="text-right"><p className="font-semibold">{money(alert.amount, summary.currency)}</p><p className="mt-1 text-xs text-[#f4c20d]">Review ›</p></div></Link>) : <p className="p-5 text-sm text-white/50">Nothing needs attention from the modules you can access.</p>}</div></section>
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111414]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Operational snapshot</h2><p className="mt-1 text-sm text-white/55">Your permitted workforce and finance workload.</p></div><div className="divide-y divide-white/8">{operational.length ? operational.map((item) => <Link key={item.label} href={item.href} className="flex items-center justify-between gap-4 p-4 transition hover:bg-white/[.03]"><div><p className="font-medium">{item.label}</p>{item.subtext && <p className="mt-1 text-xs text-white/50">{item.subtext}</p>}</div><p className="font-semibold text-[#f4c20d]">{item.value}</p></Link>) : <p className="p-5 text-sm text-white/50">No operational data is available for your current permissions.</p>}</div></section>
      </div>
      {summary.activity !== null && <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111414]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-sm text-white/55">Latest audited system activity.</p></div><div className="divide-y divide-white/8">{summary.activity.length ? summary.activity.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"><div><p className="font-medium">{item.action.replaceAll("_", " ")} · {item.recordType}</p><p className="mt-1 text-xs text-white/50">{item.module} · {item.actor}</p></div><time className="text-xs text-white/45">{new Date(item.createdAt).toLocaleString()}</time></article>) : <p className="p-5 text-sm text-white/50">No activity recorded yet.</p>}</div></section>}
      {!cards.length && !operational.length && <section className="rounded-xl border border-dashed border-white/20 bg-[#111414] p-8 text-center"><h2 className="font-semibold">Your workspace is ready</h2><p className="mx-auto mt-2 max-w-md text-sm text-white/55">You will see useful summaries here as your assigned modules and records become available.</p></section>}
    </>}
  </section></AppShell>;
}

export default function DashboardPage() {
  return <ProtectedPage>{(session) => <Dashboard session={session} />}</ProtectedPage>;
}
