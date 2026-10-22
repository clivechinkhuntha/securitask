"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { InvoicePreview, type InvoicePreviewData } from "@/components/invoice-preview";
import { apiRequest, type AuthSession } from "@/lib/auth";
import { invoiceStatusLabel } from "@/lib/invoice-status";

type Invoice = InvoicePreviewData & { amountPaid: string; balance: string; allocations: { paymentId: string; amount: string; payment: { paymentNumber: string; paymentDate: string; status: string; paymentMethod: string } }[] };

function InvoiceDetail({ session }: { session: AuthSession }) {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiRequest<Invoice>(`/api/revenue/invoices/${invoiceId}`, session.token).then(setInvoice).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load invoice.")); }, [invoiceId, session.token]);
  return <AppShell session={session}><section className="mx-auto max-w-7xl space-y-5">
    <Link href="/invoices" className="text-sm text-[#f4c20d]">Back to invoices</Link>
    {error ? <p role="alert" className="text-red-300">{error}</p> : !invoice ? <p className="text-white/50">Loading invoice...</p> : <>
      <header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Invoice</p><h1 className="mt-1 text-2xl font-semibold">{invoice.invoiceNumber}</h1><p className="mt-2 text-sm text-white/60">{invoice.client.name} · {invoiceStatusLabel(invoice.status)}</p><p className="mt-1 text-sm text-white/50">Invoice date: {new Date(invoice.invoiceDate).toLocaleDateString()} · Due date: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Not specified"}</p></header>
      <div className="grid gap-3 sm:grid-cols-3">{[{ label: "Invoice total", value: invoice.total }, { label: "Amount paid", value: invoice.amountPaid }, { label: "Balance", value: invoice.balance }].map((card) => <article key={card.label} className="rounded-lg border border-white/15 bg-[#111414] p-4"><p className="text-sm text-white/55">{card.label}</p><p className="mt-2 text-xl font-semibold">MWK {card.value}</p></article>)}</div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => window.print()} className="rounded-md bg-[#f4c20d] px-4 py-2 text-sm font-semibold text-[#0d0d0d]">Print / Save as PDF</button>
        {invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && <a href={`https://wa.me/?text=${encodeURIComponent(`Hello, please find invoice ${invoice.invoiceNumber} for MWK ${invoice.total}. I will send the invoice PDF separately.`)}`} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/20 px-4 py-2 text-sm">Share via WhatsApp</a>}
        <p className="w-full text-xs text-white/55">Choose “Save as PDF” in the print dialog. To send the document, attach the saved PDF in WhatsApp.</p>
      </div>
      <InvoicePreview invoice={invoice} />
      <section className="rounded-lg border border-white/15 bg-[#111414] p-4"><h2 className="font-semibold">Services or items</h2><div className="mt-3 divide-y divide-white/10">{invoice.items.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{item.description} · {item.quantity} × MWK {item.unitPrice}</span><span>MWK {item.amount}</span></div>)}</div>{invoice.notes && <p className="mt-3 text-sm text-white/60">Notes: {invoice.notes}</p>}</section>
      <section className="rounded-lg border border-white/15 bg-[#111414] p-4"><h2 className="font-semibold">Payment history</h2>{invoice.allocations.length ? <div className="mt-3 divide-y divide-white/10">{invoice.allocations.map((allocation) => <div key={allocation.paymentId} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{allocation.payment.paymentNumber} · {new Date(allocation.payment.paymentDate).toLocaleDateString()} · {allocation.payment.status}</span><span>MWK {allocation.amount}</span></div>)}</div> : <p className="mt-3 text-sm text-white/50">No payments recorded.</p>}</section>
    </>}
  </section></AppShell>;
}
export default function InvoiceDetailPage() { return <ProtectedPage>{(session) => <InvoiceDetail session={session} />}</ProtectedPage>; }
