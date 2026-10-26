"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Category = { id: string; name: string; description: string | null; isActive: boolean };

function Workspace({ session }: { session: AuthSession }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const canCreate = session.permissions.includes("expense_categories.create");
  const canUpdate = session.permissions.includes("expense_categories.update");

  const load = async () => {
    try {
      setCategories(await apiRequest<Category[]>("/api/finance/expense-categories", session.token));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load categories.");
    }
  };

  useEffect(() => { void load(); }, []);

  const visibleCategories = useMemo(() => categories.filter((category) => filter === "all" || (filter === "active" ? category.isActive : !category.isActive)), [categories, filter]);

  const closeForm = () => { setOpen(false); setEditing(null); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setMessage("");
    try {
      const category = await apiRequest<Category>(editing ? `/api/finance/expense-categories/${editing.id}` : "/api/finance/expense-categories", session.token, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      setCategories((current) => editing ? current.map((item) => item.id === category.id ? category : item) : [...current, category].sort((first, second) => first.name.localeCompare(second.name)));
      setMessage(editing ? "Category updated." : "Category added.");
      closeForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save category.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (category: Category) => {
    const action = category.isActive ? "deactivate" : "reactivate";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${category.name}? Existing expenses will keep their category.`)) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiRequest<Category>(`/api/finance/expense-categories/${category.id}`, session.token, { method: "PATCH", body: JSON.stringify({ isActive: !category.isActive }) });
      setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(updated.isActive ? "Category reactivated." : "Category deactivated. It will no longer appear when recording new expenses.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update category.");
    } finally {
      setSaving(false);
    }
  };

  return <AppShell session={session}><section className="mx-auto max-w-5xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Expense settings</p><h1 className="mt-1 text-2xl font-semibold">Expense categories</h1><p className="mt-1 text-sm text-white/55">Create clear categories so expenses stay consistent in reports.</p></div>{canCreate && <button type="button" onClick={() => { setEditing(null); setOpen((current) => !current); }} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d]">{open ? "Close form" : "Add category"}</button>}</header>
    {message && <p role="status" className="rounded-md border border-[#f4c20d]/30 bg-[#f4c20d]/10 px-3 py-2 text-sm text-[#ffe48a]">{message}</p>}
    {open && <form key={editing?.id ?? "new"} onSubmit={submit} className="grid gap-3 rounded-lg border border-white/15 bg-[#111414] p-4 sm:grid-cols-2"><label className="space-y-1 text-sm text-white/70"><span>Category name</span><input required name="name" maxLength={120} defaultValue={editing?.name ?? ""} placeholder="For example, Fuel" className="field w-full" /></label><label className="space-y-1 text-sm text-white/70"><span>Description <span className="text-white/45">(optional)</span></span><input name="description" maxLength={500} defaultValue={editing?.description ?? ""} placeholder="What belongs in this category" className="field w-full" /></label><div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Add category"}</button><button type="button" onClick={closeForm} className="rounded-md border border-white/20 px-4 py-2.5 text-sm">Cancel</button></div></form>}
    <section className="overflow-hidden rounded-lg border border-white/15 bg-[#111414]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><p className="text-sm text-white/60">{categories.filter((category) => category.isActive).length} active categories</p><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="field w-auto" aria-label="Filter expense categories"><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All categories</option></select></div><div className="divide-y divide-white/8">{visibleCategories.map((category) => <article key={category.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-medium">{category.name}</h2>{category.description && <p className="mt-1 text-sm text-white/55">{category.description}</p>}</div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${category.isActive ? "bg-[#f4c20d]/15 text-[#f4c20d]" : "bg-white/10 text-white/55"}`}>{category.isActive ? "Active" : "Inactive"}</span>{canUpdate && <><button type="button" onClick={() => { setEditing(category); setOpen(true); }} className="rounded-md border border-white/20 px-3 py-2 text-sm">Edit</button><button type="button" disabled={saving} onClick={() => void changeStatus(category)} className="rounded-md border border-white/20 px-3 py-2 text-sm disabled:opacity-50">{category.isActive ? "Deactivate" : "Reactivate"}</button></>}</div></article>)}{visibleCategories.length === 0 && <p className="p-10 text-center text-sm text-white/50">No {filter === "all" ? "" : filter} expense categories.</p>}</div></section>
  </section></AppShell>;
}

export default function ExpenseCategoriesPage() { return <ProtectedPage>{(session) => <Workspace session={session} />}</ProtectedPage>; }
