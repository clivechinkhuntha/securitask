"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Category = { id: string; name: string; isActive: boolean };
type ExpenseStatus = "RECORDED" | "APPROVED" | "PAID" | "VOIDED";
type Expense = { id: string; expenseNumber: string; expenseDate: string; categoryId: string; description: string; amount: string; supplier: string | null; paymentMethod: string | null; notes: string | null; status: ExpenseStatus; category: { id: string; name: string } };

const today = () => new Date().toLocaleDateString("en-CA");
const statusLabel: Record<ExpenseStatus, string> = { RECORDED: "Recorded", APPROVED: "Approved", PAID: "Paid", VOIDED: "Voided" };

function Workspace({ session }: { session: AuthSession }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const canCreate = session.permissions.includes("expenses.create");
  const canUpdate = session.permissions.includes("expenses.update");
  const canApprove = session.permissions.includes("expenses.approve");
  const canVoid = session.permissions.includes("expenses.void");

  const load = async () => {
    try {
      const [expenseData, categoryData] = await Promise.all([
        apiRequest<Expense[]>("/api/finance/expenses", session.token),
        apiRequest<Category[]>("/api/finance/expense-categories", session.token),
      ]);
      setExpenses(expenseData);
      setCategories(categoryData.filter((category) => category.isActive));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load expenses.");
    }
  };

  useEffect(() => { void load(); }, []);

  const visibleExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return expenses;
    return expenses.filter((expense) => [expense.expenseNumber, expense.description, expense.supplier, expense.category.name].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [expenses, search]);

  const closeForm = () => { setOpen(false); setEditing(null); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
    setSaving(true);
    setMessage("");
    try {
      const expense = await apiRequest<Expense>(editing ? `/api/finance/expenses/${editing.id}` : "/api/finance/expenses", session.token, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      await load();
      closeForm();
      setMessage(editing ? `Expense ${expense.expenseNumber} was updated.` : `Expense ${expense.expenseNumber} was recorded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save expense.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (expense: Expense, action: "approve" | "mark-paid") => {
    const text = action === "approve" ? "Approve" : "Mark as paid";
    if (!window.confirm(`${text} expense ${expense.expenseNumber}?`)) return;
    setSaving(true);
    setMessage("");
    try {
      await apiRequest(`/api/finance/expenses/${expense.id}/${action}`, session.token, { method: "POST", body: JSON.stringify({}) });
      await load();
      setMessage(action === "approve" ? "Expense approved." : "Expense marked as paid. No payment was sent by the system.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update expense status.");
    } finally {
      setSaving(false);
    }
  };

  const voidExpense = async (expense: Expense) => {
    const reason = window.prompt(`Why are you voiding ${expense.expenseNumber}? This cannot be undone.`);
    if (reason === null) return;
    if (reason.trim().length < 3) { setMessage("Enter a void reason with at least 3 characters."); return; }
    if (!window.confirm(`Void ${expense.expenseNumber}? The expense will remain in the audit history.`)) return;
    setSaving(true);
    setMessage("");
    try {
      await apiRequest(`/api/finance/expenses/${expense.id}/void`, session.token, { method: "POST", body: JSON.stringify({ reason }) });
      await load();
      setMessage("Expense voided. Its history was kept.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not void expense.");
    } finally {
      setSaving(false);
    }
  };

  return <AppShell session={session}><section className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Financial records</p><h1 className="mt-1 text-2xl font-semibold">Expenses</h1><p className="mt-1 text-sm text-white/55">Record business spending that happened outside the system.</p></div>{canCreate && <button type="button" onClick={() => { setEditing(null); setOpen((current) => !current); }} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d]">{open ? "Close form" : "Record expense"}</button>}</header>
    {message && <p role="status" className="rounded-md border border-[#f4c20d]/30 bg-[#f4c20d]/10 px-3 py-2 text-sm text-[#ffe48a]">{message}</p>}
    {open && <form key={editing?.id ?? "new"} onSubmit={submit} className="rounded-lg border border-white/15 bg-[#111414] p-4 sm:p-5"><div className="mb-4"><h2 className="font-semibold">{editing ? "Edit recorded expense" : "Record an expense"}</h2><p className="mt-1 text-sm text-white/55">{editing ? "Only recorded expenses can be changed." : "The expense number is created automatically. Required fields are marked with an asterisk."}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="space-y-1.5 text-sm text-white/70"><span>Expense date <span className="text-white/45">(optional)</span></span><input type="date" name="expenseDate" defaultValue={editing?.expenseDate.slice(0, 10) ?? today()} className="field w-full" /></label><label className="space-y-1.5 text-sm text-white/70"><span>Category *</span><select required name="categoryId" className="field w-full" defaultValue={editing?.categoryId ?? ""}><option value="" disabled>Select a category</option>{editing && !categories.some((category) => category.id === editing.categoryId) && <option value={editing.categoryId}>{editing.category.name} (inactive)</option>}{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{categories.length === 0 && <span className="block text-xs text-[#ffe48a]">Add an expense category before recording an expense.</span>}</label><label className="space-y-1.5 text-sm text-white/70"><span>Amount (MWK) *</span><input required name="amount" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" defaultValue={editing?.amount ?? ""} placeholder="For example, 25000" className="field w-full" /></label><label className="space-y-1.5 text-sm text-white/70 sm:col-span-2"><span>What was this expense for? *</span><input required name="description" maxLength={1000} defaultValue={editing?.description ?? ""} placeholder="For example, fuel for patrol vehicle" className="field w-full" /></label><label className="space-y-1.5 text-sm text-white/70"><span>Supplier or payee <span className="text-white/45">(optional)</span></span><input name="supplier" maxLength={160} defaultValue={editing?.supplier ?? ""} placeholder="For example, ABC Fuel" className="field w-full" /></label><label className="space-y-1.5 text-sm text-white/70"><span>How was it paid? <span className="text-white/45">(optional)</span></span><select name="paymentMethod" defaultValue={editing?.paymentMethod ?? ""} className="field w-full"><option value="">Not specified</option><option value="Cash">Cash</option><option value="Bank transfer">Bank transfer</option><option value="Cheque">Cheque</option><option value="Mobile money">Mobile money</option><option value="Other">Other</option></select></label><label className="space-y-1.5 text-sm text-white/70 sm:col-span-2"><span>Notes <span className="text-white/45">(optional)</span></span><textarea name="notes" maxLength={2000} defaultValue={editing?.notes ?? ""} placeholder="Add any useful context" className="field min-h-24 w-full" /></label></div><div className="mt-5 flex flex-wrap gap-2"><button disabled={saving || categories.length === 0} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Record expense"}</button><button type="button" onClick={closeForm} className="rounded-md border border-white/20 px-4 py-2.5 text-sm">Cancel</button></div></form>}
    <section className="overflow-hidden rounded-lg border border-white/15 bg-[#111414]"><div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">All expenses</h2><p className="mt-1 text-sm text-white/50">{expenses.length} recorded</p></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expense, supplier, or number" aria-label="Search expenses" className="field w-full sm:max-w-sm" /></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-white/[.03] text-xs uppercase text-white/45"><tr><th className="px-4 py-3">Expense</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{visibleExpenses.map((expense) => <tr key={expense.id} className="border-t border-white/8"><td className="px-4 py-3"><p className="font-medium">{expense.description}</p><p className="mt-1 text-xs text-white/50">{expense.expenseNumber} · {new Date(expense.expenseDate).toLocaleDateString()} {expense.supplier ? `· ${expense.supplier}` : ""}</p></td><td className="px-4 py-3">{expense.category.name}</td><td className="px-4 py-3 font-medium">MWK {Number(expense.amount).toLocaleString()}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${expense.status === "VOIDED" ? "bg-red-400/10 text-red-300" : expense.status === "PAID" ? "bg-emerald-400/10 text-emerald-300" : "bg-[#f4c20d]/15 text-[#f4c20d]"}`}>{statusLabel[expense.status]}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-2">{expense.status === "RECORDED" && canUpdate && <button type="button" onClick={() => { setEditing(expense); setOpen(true); }} className="rounded-md border border-white/20 px-3 py-1.5 text-xs">Edit</button>}{expense.status === "RECORDED" && canApprove && <button type="button" disabled={saving} onClick={() => void changeStatus(expense, "approve")} className="rounded-md border border-[#f4c20d]/50 px-3 py-1.5 text-xs text-[#f4c20d] disabled:opacity-50">Approve</button>}{expense.status === "APPROVED" && canApprove && <button type="button" disabled={saving} onClick={() => void changeStatus(expense, "mark-paid")} className="rounded-md border border-emerald-400/50 px-3 py-1.5 text-xs text-emerald-300 disabled:opacity-50">Mark paid</button>}{expense.status !== "VOIDED" && canVoid && <button type="button" disabled={saving} onClick={() => void voidExpense(expense)} className="rounded-md border border-red-400/50 px-3 py-1.5 text-xs text-red-300 disabled:opacity-50">Void</button>}{expense.status === "VOIDED" && <span className="text-xs text-white/45">No further actions</span>}</div></td></tr>)}{visibleExpenses.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-white/50">{expenses.length ? "No expenses match your search." : "No expenses recorded yet."}</td></tr>}</tbody></table></div></section>
  </section></AppShell>;
}

export default function ExpensesPage() { return <ProtectedPage>{(session) => <Workspace session={session} />}</ProtectedPage>; }
