"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { CompanySettings } from "@/components/company-settings";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Service = { id: string; name: string; description: string | null; defaultPrice: string; isActive: boolean };

function Settings({ session }: { session: AuthSession }) {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [editing, setEditing] = useState<Service | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const can = (permission: string) => session.permissions.includes(permission);

  useEffect(() => {
    if (!session.permissions.includes("services.view")) { setLoading(false); return; }
    apiRequest<Service[]>("/api/services", session.token)
      .then(setServices)
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load services."))
      .finally(() => setLoading(false));
  }, [session.token, session.permissions]);

  const visible = useMemo(() => services.filter((service) =>
    (filter === "all" || service.isActive === (filter === "active")) &&
    (service.name + " " + (service.description ?? "")).toLowerCase().includes(search.toLowerCase()),
  ), [services, search, filter]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setMessage("");
    try {
      const data = Object.fromEntries(new FormData(form));
      const service = await apiRequest<Service>(editing ? `/api/services/${editing.id}` : "/api/services", session.token, { method: editing ? "PATCH" : "POST", body: JSON.stringify(data) });
      setServices((current) => editing ? current.map((item) => item.id === service.id ? service : item) : [...current, service].sort((first, second) => first.name.localeCompare(second.name)));
      setMessage(editing ? "Service updated." : "Service added.");
      setEditing(null);
      setFormOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save service.");
    } finally { setSaving(false); }
  };

  const changeStatus = async (service: Service) => {
    if (!window.confirm(`${service.isActive ? "Deactivate" : "Reactivate"} ${service.name}?`)) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiRequest<Service>(`/api/services/${service.id}/status`, session.token, { method: "PATCH", body: JSON.stringify({ isActive: !service.isActive }) });
      setServices((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(updated.isActive ? "Service reactivated." : "Service deactivated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change service status.");
    } finally { setSaving(false); }
  };

  return <AppShell session={session}><section className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Settings</p><h1 className="mt-1 text-2xl font-semibold">Services & Fees</h1><p className="mt-1 text-sm text-white/55">Manage the services and default prices used for invoices.</p></div>{can("services.create") && <button type="button" onClick={() => { setEditing(null); setFormOpen(!formOpen); }} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d]">{formOpen ? "Close form" : "Add service"}</button>}</header>
    {can("settings.view") && <CompanySettings session={session} />}
    {message && <p role="status" className="rounded-md border border-[#f4c20d]/30 bg-[#f4c20d]/10 px-3 py-2 text-sm text-[#ffe48a]">{message}</p>}
    {!can("services.view") ? <p className="rounded-lg border border-white/15 p-5 text-sm text-white/60">You do not have permission to view services and fees.</p> : <>
      {formOpen && <form key={editing?.id ?? "new"} onSubmit={submit} className="grid gap-4 rounded-lg border border-white/15 bg-[#111414] p-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm text-white/70"><span>Service name</span><input required name="name" maxLength={160} defaultValue={editing?.name ?? ""} className="field w-full" /></label>
        <label className="space-y-1.5 text-sm text-white/70"><span>Default price (MWK)</span><input required name="defaultPrice" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" defaultValue={editing?.defaultPrice ?? ""} className="field w-full" /></label>
        <label className="space-y-1.5 text-sm text-white/70 sm:col-span-2"><span>Description (optional)</span><textarea name="description" maxLength={1000} defaultValue={editing?.description ?? ""} className="field min-h-20 w-full" /></label>
        <div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Add service"}</button><button type="button" onClick={() => { setFormOpen(false); setEditing(null); }} className="rounded-md border border-white/20 px-4 py-2.5 text-sm">Cancel</button></div>
      </form>}
      <section className="rounded-lg border border-white/15 bg-[#111414]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services" aria-label="Search services" className="field min-w-0 flex-1" /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter service status" className="field"><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All services</option></select></div>
        {loading ? <p className="p-5 text-sm text-white/50">Loading services...</p> : visible.length ? <div className="divide-y divide-white/10">{visible.map((service) => <article key={service.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-medium">{service.name}</h2>{service.description && <p className="mt-1 text-sm text-white/50">{service.description}</p>}<p className="mt-1 text-xs text-white/50">{service.isActive ? "Active" : "Inactive"}</p></div><div className="flex flex-wrap items-center gap-3"><p className="font-semibold text-[#f4c20d]">MWK {service.defaultPrice}</p>{can("services.update") && <button type="button" onClick={() => { setEditing(service); setFormOpen(true); }} className="rounded-md border border-white/20 px-3 py-2 text-sm">Edit</button>}{can("services.deactivate") && <button type="button" disabled={saving} onClick={() => void changeStatus(service)} className="rounded-md border border-white/20 px-3 py-2 text-sm disabled:opacity-50">{service.isActive ? "Deactivate" : "Reactivate"}</button>}</div></article>)}</div> : <p className="p-8 text-center text-sm text-white/50">No services found.</p>}
      </section>
    </>}
  </section></AppShell>;
}

export default function SettingsPage() {
  return <ProtectedPage>{(session) => <Settings session={session} />}</ProtectedPage>;
}
