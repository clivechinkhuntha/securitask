import Image from "next/image";
import { invoiceStatusLabel } from "@/lib/invoice-status";

type Company = { companyName: string; address: string | null; taxNumber: string | null; phone: string | null; email: string | null; bankName: string | null; accountName: string | null; accountNumber: string | null };
type Client = { name: string; billingAddress: string | null; physicalAddress: string | null };
export type InvoicePreviewData = { invoiceNumber: string; invoiceDate: string; dueDate: string | null; status: string; total: string; notes: string | null; client: Client; documentSnapshot: { company: Company; client: Client } | null; previewCompany: Company | null; items: { id: string; description: string; remarks: string | null; quantity: string; unitPrice: string; amount: string }[] };

export function InvoicePreview({ invoice }: { invoice: InvoicePreviewData }) {
  const snapshot = invoice.documentSnapshot;
  const company = invoice.status === "DRAFT" ? invoice.previewCompany : snapshot?.company;
  const client = snapshot?.client ?? invoice.client;
  const historicMissing = invoice.status !== "DRAFT" && !snapshot;
  return <section id="invoice-print-area" aria-label="Invoice preview" className="overflow-hidden rounded-lg bg-white text-[#171717] shadow-sm">
    {historicMissing && <p role="status" className="invoice-preview-notice bg-amber-100 px-5 py-3 text-sm">Company details were not saved when this older invoice was issued. They are not shown as historical facts.</p>}
    {invoice.status === "DRAFT" && !company && <p role="status" className="invoice-preview-notice bg-amber-100 px-5 py-3 text-sm">Add company details in Settings before issuing this invoice.</p>}
    <div className="border-l-8 border-[#f4c20d] p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-5 border-b border-neutral-200 pb-5"><div><Image src="/securitask-logo.jpeg" alt="Securitask" width={100} height={100} className="rounded" /><p className="mt-2 font-bold">{company?.companyName ?? "Company details unavailable"}</p></div><div className="text-left sm:text-right"><p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Invoice</p><p className="mt-1 break-all text-xs font-medium text-neutral-600">{invoice.invoiceNumber}</p><p className="mt-1 text-sm">{invoiceStatusLabel(invoice.status)}</p></div></div>
      <div className="grid gap-5 py-6 text-sm sm:grid-cols-2"><div><p className="font-semibold">Billed by</p><p className="mt-1">{company?.companyName ?? "Not available"}</p>{company?.address && <p className="whitespace-pre-line">{company.address}</p>}{company?.taxNumber && <p>TPIN: {company.taxNumber}</p>}{company?.phone && <p>{company.phone}</p>}{company?.email && <p>{company.email}</p>}</div><div><p className="font-semibold">Billed to</p><p className="mt-1">{client.name}</p>{(client.billingAddress || client.physicalAddress) && <p className="whitespace-pre-line">{client.billingAddress || client.physicalAddress}</p>}<p className="mt-3">Invoice date: {invoice.invoiceDate.slice(0, 10)}</p>{invoice.dueDate && <p>Due date: {invoice.dueDate.slice(0, 10)}</p>}</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-neutral-100"><tr><th className="p-2">Qty</th><th className="p-2">Service</th><th className="p-2">Unit price</th><th className="p-2">Amount</th><th className="p-2">Remarks</th></tr></thead><tbody>{invoice.items.map((item) => <tr key={item.id} className="border-b border-neutral-200"><td className="p-2">{item.quantity}</td><td className="p-2">{item.description}</td><td className="p-2">MWK {item.unitPrice}</td><td className="p-2">MWK {item.amount}</td><td className="p-2">{item.remarks || "â€”"}</td></tr>)}</tbody></table></div>
      <p className="mt-5 text-right text-lg font-bold">Total: MWK {invoice.total}</p>
      {invoice.notes && <p className="mt-5 whitespace-pre-line text-sm">Notes: {invoice.notes}</p>}
      {(company?.bankName || company?.accountName || company?.accountNumber) && <div className="mt-6 border-t border-neutral-200 pt-4 text-sm"><p className="font-semibold">Bank details</p>{company.accountName && <p>Account name: {company.accountName}</p>}{company.accountNumber && <p>Account number: {company.accountNumber}</p>}{company.bankName && <p>Bank: {company.bankName}</p>}</div>}
    </div>
  </section>;
}
