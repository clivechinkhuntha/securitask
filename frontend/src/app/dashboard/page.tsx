"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Summary = {
  currency: string;
  availableFunds: number | null;
  receivedThisMonth: number | null;
  expensesThisMonth: number | null;
  outstandingInvoices: string | null;
  totalEmployees: number | null;
};

type Card = { key: string; label: string; value: number | string; href: string; format: "money" | "count" };

const money = (amount: number | string, currency: string) => {
  if (typeof amount === "number") return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const [whole, fraction] = amount.split(".");
  return `${currency} ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction && fraction !== "00" ? `.${fraction}` : ""}`;
};

function Dashboard({ session }: { session: AuthSession }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Summary>("/api/dashboard/summary", session.token)
      .then(setSummary)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load dashboard data."));
  }, [session.token]);

  const has = (permission: string) => session.permissions.includes(permission);
  const cards = useMemo<Card[]>(() => {
    if (!summary) return [];
    const candidates: (Card | null)[] = [
      has("accounts.view") && summary.availableFunds !== null ? { key: "funds", label: "Available funds", value: summary.availableFunds, href: "/accounts", format: "money" } : null,
      has("invoices.view") && summary.outstandingInvoices !== null ? { key: "invoices", label: "Outstanding invoices", value: summary.outstandingInvoices, href: "/invoices", format: "money" } : null,
      has("payments.view") && summary.receivedThisMonth !== null ? { key: "received", label: "Received this month", value: summary.receivedThisMonth, href: "/payments", format: "money" } : null,
      has("expenses.view") && summary.expensesThisMonth !== null ? { key: "expenses", label: "Expenses this month", value: summary.expensesThisMonth, href: "/expenses", format: "money" } : null,
      has("employees.view") && summary.totalEmployees !== null ? { key: "employees", label: "Total employees", value: summary.totalEmployees, href: "/employees", format: "count" } : null,
    ];
    return candidates.filter((card): card is Card => card !== null);
  }, [session.permissions, summary]);

  return <AppShell session={session}><section className="mx-auto max-w-7xl space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Dashboard</p><h1 className="mt-1 text-2xl font-semibold">Overview</h1></header>
    {error && <p role="alert" className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
    {!summary ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[.06]" />)}</div> : cards.length ? <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((card) => <Link key={card.key} href={card.href} className="dashboard-stat-card rounded-xl border border-white/15 bg-[linear-gradient(145deg,#171a1a,#101212)] p-4 transition hover:-translate-y-0.5 hover:border-[#f4c20d]/65"><p className="text-sm text-white/60">{card.label}</p><p className="mt-4 text-2xl font-semibold">{card.format === "money" ? money(card.value, summary.currency) : card.value.toLocaleString()}</p></Link>)}</section> : <section className="rounded-xl border border-dashed border-white/20 bg-[#111414] p-8 text-center"><h2 className="font-semibold">Your workspace is ready</h2><p className="mx-auto mt-2 max-w-md text-sm text-white/55">Dashboard summaries appear as your permitted modules and records become available.</p></section>}
  </section></AppShell>;
}

export default function DashboardPage() {
  return <ProtectedPage>{(session) => <Dashboard session={session} />}</ProtectedPage>;
}

