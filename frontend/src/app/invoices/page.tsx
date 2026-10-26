"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";
import { invoiceStatusLabel } from "@/lib/invoice-status";

type Client = { id: string; name: string; code: string; status: string };
type Service = { id: string; name: string; defaultPrice: string; isActive: boolean };
type Invoice = { id: string; invoiceNumber: string; total: string; balance: string; status: string; cancelledFromStatus: string | null; client: { name: string } };
type InvoiceDetail = Invoice & { clientId: string; invoiceDate: string; dueDate: string | null; notes: string | null; items: { id: string; description: string; remarks: string | null; quantity: string; unitPrice: string }[] };
type Line = { id: string; description: string; remarks: string; quantity: string; unitPrice: string; serviceId: string };

const newLine = (): Line => ({ id: crypto.randomUUID(), description: "", remarks: "", quantity: "1", unitPrice: "", serviceId: "" });
const today = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); };
const cents = (value: string) => { if (!/^\d+(\.\d{1,2})?$/.test(value)) return null; const [whole, fraction = ""] = value.split("."); return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0")); };
const lineAmount = (line: Line) => { const quantity = cents(line.quantity); const price = cents(line.unitPrice); return quantity === null || price === null ? null : (quantity * price + BigInt(50)) / BigInt(100); };
const formatAmount = (value: bigint) => `${(value / BigInt(100)).toLocaleString()}.${String(value % BigInt(100)).padStart(2, "0")}`;

function Invoices({ session }: { session: AuthSession }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InvoiceDetail | null>(null);
  const [message, setMessage] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState<{ invoice: Invoice; top: number; left: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const dismiss = (event: PointerEvent) => { if (!(event.target as Element).closest("[data-invoice-menu]")) setMenu(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    const close = () => setMenu(null);
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); };
  }, [menu]);

  const load = async () => {
    const data = await apiRequest<Invoice[]>("/api/revenue/invoices", session.token);
    setInvoices(data);
  };
  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load invoices.")); }, [session.token]);

  const openForm = async (invoiceId?: string) => {
    if (showForm && !invoiceId) { setShowForm(false); return; }
    setMessage("");
    try {
      const [clientData, serviceData, invoice] = await Promise.all([
        apiRequest<Client[]>("/api/clients", session.token),
        session.permissions.includes("services.view") ? apiRequest<Service[]>("/api/services", session.token) : Promise.resolve([]),
        invoiceId ? apiRequest<InvoiceDetail>(`/api/revenue/invoices/${invoiceId}`, session.token) : Promise.resolve(null),
      ]);
      if (invoice && invoice.status !== "DRAFT") throw new Error("Only draft invoices can be edited.");
      setClients(clientData.filter((client) => client.status === "ACTIVE" || client.id === invoice?.clientId));
      setServices(serviceData.filter((service) => service.isActive));
      setEditing(invoice);
      setClientId(invoice?.clientId ?? "");
      setClientSearch("");
      setLines(invoice ? invoice.items.map((item) => ({ ...item, remarks: item.remarks ?? "", serviceId: "" })) : [newLine()]);
      setShowForm(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load clients or services."); }
  };

  const changeLine = (id: string, changes: Partial<Line>) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...changes } : line));
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientId) { setMessage("Select a client."); return; }
    setSaving(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest(editing ? `/api/revenue/invoices/${editing.id}` : "/api/revenue/invoices", session.token, { method: editing ? "PUT" : "POST", body: JSON.stringify({ clientId, invoiceDate: data.get("invoiceDate"), dueDate: data.get("dueDate"), notes: data.get("notes"), items: lines.map(({ description, remarks, quantity, unitPrice }) => ({ description, remarks, quantity, unitPrice })) }) });
      setShowForm(false);
      setMessage(editing ? "Draft invoice updated." : "Draft invoice created.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create invoice."); }
    finally { setSaving(false); }
  };
  const transition = async (invoice: Invoice, action: "issue" | "cancel" | "restore") => {
    const reason = action === "cancel" ? window.prompt(`Why are you cancelling ${invoice.invoiceNumber}?`) : null;
    if (action === "cancel" && !reason?.trim()) return;
    const question = action === "issue" ? `Approve and post ${invoice.invoiceNumber}? It will appear in outstanding invoices.` : action === "restore" ? `Restore ${invoice.invoiceNumber} as a draft? It will not appear in outstanding invoices.` : `Cancel ${invoice.invoiceNumber}? This cannot be undone for a posted invoice.`;
    if (!window.confirm(question)) return;
    try { await apiRequest(`/api/revenue/invoices/${invoice.id}/${action}`, session.token, { method: "POST", ...(action === "cancel" ? { body: JSON.stringify({ reason: reason!.trim() }) } : {}) }); setMessage(action === "issue" ? "Invoice approved and posted." : action === "restore" ? "Draft invoice restored." : "Invoice cancelled."); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not update invoice."); }
  };
  const total = lines.reduce((sum, line) => sum + (lineAmount(line) ?? BigInt(0)), BigInt(0));
  const filtered = invoices.filter((invoice) => `${invoice.invoiceNumber} ${invoice.client.name}`.toLowerCase().includes(search.toLowerCase()));
  const matchingClients = clients.filter((client) => `${client.name} ${client.code}`.toLowerCase().includes(clientSearch.trim().toLowerCase()));

  const actions = (invoice: Invoice) => <button type="button" data-invoice-menu aria-label={`Actions for ${invoice.invoiceNumber}`} aria-expanded={menu?.invoice.id === invoice.id} aria-haspopup="true" onClick={(event) => {
    if (menu?.invoice.id === invoice.id) { setMenu(null); return; }
    const bounds = event.currentTarget.getBoundingClientRect();
    setMenu({ invoice, left: Math.max(8, Math.min(bounds.right - 208, window.innerWidth - 216)), top: Math.max(8, Math.min(bounds.bottom + 6, window.innerHeight - 230)) });
  }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-medium transition hover:border-[#f4c20d]/60 hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-[#f4c20d]">Actions <span aria-hidden="true">⋮</span></button>;
  const status = (invoice: Invoice) => <span className="inline-flex rounded-full bg-[#f4c20d]/10 px-2.5 py-1 text-xs font-semibold text-[#f4c20d]">{invoiceStatusLabel(invoice.status)}</span>;

  return <AppShell session={session}><section className="page-polished mx-auto max-w-7xl space-y-6">
    {menu && createPortal(<div data-invoice-menu className="invoice-action-menu fixed z-[100] w-52 rounded-xl border border-white/15 bg-[#171919] p-1.5 text-sm text-white shadow-2xl" style={{ top: menu.top, left: menu.left }}>
      <Link href={`/invoices/${menu.invoice.id}`} onClick={() => setMenu(null)} className="block rounded-lg px-3 py-2.5 transition hover:bg-white/10">View invoice</Link>
      {menu.invoice.status === "DRAFT" && session.permissions.includes("invoices.update") && <button type="button" onClick={() => { void openForm(menu.invoice.id); setMenu(null); }} className="block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10">Edit draft</button>}
      {menu.invoice.status === "DRAFT" && session.permissions.includes("invoices.issue") && <button type="button" onClick={() => { void transition(menu.invoice, "issue"); setMenu(null); }} className="block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10">Approve &amp; post</button>}
      {["DRAFT", "ISSUED", "OVERDUE"].includes(menu.invoice.status) && session.permissions.includes("invoices.cancel") && <button type="button" onClick={() => { void transition(menu.invoice, "cancel"); setMenu(null); }} className="block w-full rounded-lg px-3 py-2.5 text-left text-red-300 transition hover:bg-red-500/10">Cancel invoice</button>}
      {menu.invoice.status === "CANCELLED" && menu.invoice.cancelledFromStatus === "DRAFT" && session.permissions.includes("invoices.restore") && <button type="button" onClick={() => { void transition(menu.invoice, "restore"); setMenu(null); }} className="block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10">Restore draft</button>}
    </div>, document.body)}
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Revenue management</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Invoices</h1><p className="mt-2 text-sm text-white/60">Create and manage your client invoices.</p></div>{session.permissions.includes("invoices.create") && <button type="button" onClick={() => void openForm()} className="min-h-11 rounded-lg bg-[#f4c20d] px-5 py-2.5 text-sm font-semibold text-[#0d0d0d] transition hover:bg-[#ffda42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]">{showForm ? "Close form" : "+ Create invoice"}</button>}</header>
    {message && <p role="status" className="rounded bg-[#f4c20d]/10 p-3 text-sm text-[#ffe48a]">{message}</p>}
    {showForm && <form key={editing?.id ?? "new"} onSubmit={create} className="space-y-6 rounded-xl border border-white/15 bg-[#111414] p-5 shadow-lg sm:p-6">
      <div><h2 className="text-lg font-semibold">{editing ? `Edit draft ${editing.invoiceNumber}` : "New draft invoice"}</h2><p className="mt-1 text-sm text-white/60">Add the client and services to prepare your invoice.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1 text-sm text-white/70">
          <label htmlFor="invoice-client-search">Search clients</label>
          <input id="invoice-client-search" value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Search by name or client code" className="field w-full" autoComplete="off" />
          {clientSearch.trim() && <div className="max-h-48 overflow-y-auto rounded-md border border-white/15 bg-[#0d0f0f]" aria-label="Matching clients">
            {matchingClients.length ? matchingClients.map((client) => <button key={client.id} type="button" onClick={() => { setClientId(client.id); setClientSearch(""); }} className="block w-full px-3 py-2 text-left text-white hover:bg-white/10 focus:bg-white/10">{client.name}{client.code ? ` — ${client.code}` : ""}</button>) : <p role="status" className="px-3 py-2 text-white/60">No matching clients found.</p>}
          </div>}
        </div>
        <label className="space-y-1 text-sm text-white/70"><span>Client</span><select required value={clientId} onChange={(event) => setClientId(event.target.value)} className="field w-full"><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
        <label className="space-y-1 text-sm text-white/70"><span>Invoice date</span><input required type="date" name="invoiceDate" defaultValue={editing?.invoiceDate.slice(0, 10) ?? today()} className="field w-full" /></label>
        <label className="space-y-1 text-sm text-white/70"><span>Due date (optional)</span><input type="date" name="dueDate" defaultValue={editing?.dueDate?.slice(0, 10) ?? ""} className="field w-full" /></label>
        <label className="space-y-1 text-sm text-white/70 sm:col-span-2"><span>Notes (optional)</span><input name="notes" maxLength={2000} defaultValue={editing?.notes ?? ""} className="field w-full" /></label>
      </div>
      <div className="space-y-3"><h2 className="font-semibold">Services or items</h2>{lines.map((line, index) => <div key={line.id} className="grid gap-3 rounded-lg border border-white/10 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-sm text-white/70"><span>Choose a service</span><select value={line.serviceId} onChange={(event) => { const service = services.find((item) => item.id === event.target.value); changeLine(line.id, { serviceId: event.target.value, description: service?.name ?? "", unitPrice: service?.defaultPrice ?? "" }); }} className="field w-full"><option value="">Custom service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} — MWK {service.defaultPrice}</option>)}</select></label>
        <label className="space-y-1 text-sm text-white/70"><span>Service or item</span><input required value={line.description} onChange={(event) => changeLine(line.id, { description: event.target.value })} className="field w-full" /></label>
        <label className="space-y-1 text-sm text-white/70"><span>Quantity</span><input required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" value={line.quantity} onChange={(event) => changeLine(line.id, { quantity: event.target.value })} className="field w-full" /></label>
        <label className="space-y-1 text-sm text-white/70"><span>Price per unit (MWK)</span><input required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" value={line.unitPrice} onChange={(event) => changeLine(line.id, { unitPrice: event.target.value })} className="field w-full" /></label>
        <label className="space-y-1 text-sm text-white/70 sm:col-span-2 lg:col-span-4"><span>Remarks (optional)</span><input value={line.remarks} maxLength={1000} onChange={(event) => changeLine(line.id, { remarks: event.target.value })} className="field w-full" /></label>
        <div className="flex items-center justify-between gap-3 text-sm sm:col-span-2 lg:col-span-4"><span>Amount: MWK {formatAmount(lineAmount(line) ?? BigInt(0))}</span>{lines.length > 1 && <button type="button" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))} aria-label={`Remove item ${index + 1}`} className="text-red-300">Remove</button>}</div>
      </div>)}<button type="button" onClick={() => setLines((current) => [...current, newLine()])} className="rounded-md border border-white/20 px-3 py-2 text-sm">Add another item</button></div>
      <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-lg font-semibold">Total: MWK {formatAmount(total)}</p><button disabled={saving} className="min-h-11 rounded-lg bg-[#f4c20d] px-5 py-2.5 text-sm font-semibold text-[#0d0d0d] transition hover:bg-[#ffda42] disabled:opacity-50">{saving ? "Saving..." : "Save draft invoice"}</button></div>
    </form>}
    <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111414] shadow-lg"><div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">All invoices</h2><p className="mt-1 text-sm text-white/60">{filtered.length} {filtered.length === 1 ? "invoice" : "invoices"}</p></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice or client" aria-label="Search invoices" className="field w-full sm:max-w-xs" /></div>
      {!filtered.length ? <p className="p-10 text-center text-sm text-white/50">{search ? "No invoices match your search." : "No invoices recorded yet."}</p> : <>
        <div className="divide-y divide-white/10 md:hidden">{filtered.map((invoice) => <article key={invoice.id} className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{invoice.invoiceNumber}</p><p className="mt-1 text-sm text-white/60">{invoice.client.name}</p></div>{status(invoice)}</div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-white/50">Total</dt><dd className="mt-1 font-medium">MWK {invoice.total}</dd></div><div><dt className="text-white/50">Balance</dt><dd className="mt-1 font-medium">MWK {invoice.balance}</dd></div></dl>{actions(invoice)}</article>)}</div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-white/[.03] text-xs uppercase tracking-wide text-white/45"><tr><th className="px-5 py-4">Invoice</th><th className="px-5 py-4">Client</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Balance</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead><tbody>{filtered.map((invoice) => <tr key={invoice.id} className="border-t border-white/8 transition hover:bg-white/[.03]"><td className="px-5 py-4 font-semibold">{invoice.invoiceNumber}</td><td className="px-5 py-4">{invoice.client.name}</td><td className="whitespace-nowrap px-5 py-4">MWK {invoice.total}</td><td className="whitespace-nowrap px-5 py-4">MWK {invoice.balance}</td><td className="px-5 py-4">{status(invoice)}</td><td className="px-5 py-4">{actions(invoice)}</td></tr>)}</tbody></table></div>
      </>}
    </section>
  </section></AppShell>;
}
export default function InvoicesPage() { return <ProtectedPage>{(session) => <Invoices session={session} />}</ProtectedPage>; }
