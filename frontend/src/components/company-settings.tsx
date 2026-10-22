"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Settings = { companyName: string; address: string | null; taxNumber: string | null; phone: string | null; email: string | null; bankName: string | null; accountName: string | null; accountNumber: string | null };

export function CompanySettings({ session }: { session: AuthSession }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canUpdate = session.permissions.includes("settings.update");

  useEffect(() => {
    apiRequest<Settings | null>("/api/settings/company", session.token)
      .then(setSettings)
      .catch((error: unknown) => { setLoadFailed(true); setMessage(error instanceof Error ? error.message : "Could not load company settings."); })
      .finally(() => setLoading(false));
  }, [session.token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setMessage("");
    try {
      const saved = await apiRequest<Settings>("/api/settings/company", session.token, { method: "PUT", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      setSettings(saved);
      setMessage("Company and bank details saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save company settings.");
    } finally { setSaving(false); }
  };

  return <section className="space-y-4 rounded-lg border border-white/15 bg-[#111414] p-4 sm:p-6">
    <div><h2 className="text-lg font-semibold">Company & invoice bank details</h2><p className="mt-1 text-sm text-white/55">Set the details that will appear on invoices. Bank details are for display only; no payments are initiated.</p></div>
    <div className="flex items-center gap-3 text-sm text-white/60"><Image src="/securitask-logo.jpeg" alt="Securitask logo" width={64} height={64} className="rounded-md" /><span>Current Securitask logo</span></div>
    {message && <p role="status" className="text-sm text-[#ffe48a]">{message}</p>}
    {loading ? <p className="text-sm text-white/50">Loading settings...</p> : !loadFailed && <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1 text-sm text-white/70"><span>Company name</span><input name="companyName" required maxLength={160} defaultValue={settings?.companyName ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      <label className="space-y-1 text-sm text-white/70"><span>TPIN (optional)</span><input name="taxNumber" maxLength={80} defaultValue={settings?.taxNumber ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      <label className="space-y-1 text-sm text-white/70 sm:col-span-2"><span>Address (optional)</span><textarea name="address" maxLength={500} defaultValue={settings?.address ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      <label className="space-y-1 text-sm text-white/70"><span>Phone (optional)</span><input name="phone" maxLength={40} defaultValue={settings?.phone ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      <label className="space-y-1 text-sm text-white/70"><span>Email (optional)</span><input name="email" type="email" maxLength={254} defaultValue={settings?.email ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      <label className="space-y-1 text-sm text-white/70"><span>Bank name (optional)</span><input name="bankName" maxLength={160} defaultValue={settings?.bankName ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      <label className="space-y-1 text-sm text-white/70"><span>Account name (optional)</span><input name="accountName" maxLength={160} defaultValue={settings?.accountName ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      <label className="space-y-1 text-sm text-white/70"><span>Account number (optional)</span><input name="accountNumber" maxLength={80} defaultValue={settings?.accountNumber ?? ""} disabled={!canUpdate} className="field w-full" /></label>
      {canUpdate && <div className="sm:col-span-2"><button disabled={saving} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] disabled:opacity-50">{saving ? "Saving..." : "Save company details"}</button></div>}
    </form>}
  </section>;
}
