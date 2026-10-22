"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { apiRequest, clearSession, saveSession, type AuthSession } from "@/lib/auth";

type Profile = { id: string; firstName: string; lastName: string; email: string; isActive: boolean; roles: string[] };

export function ProfileContent({ session }: { session: AuthSession }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentSession, setCurrentSession] = useState(session);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (session.isDemo) { setProfile({ ...session.user, isActive: true, roles: [] }); return; }
    apiRequest<Profile>("/api/auth/profile", session.token).then(setProfile).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load your profile."));
  }, [session]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await apiRequest<Profile>("/api/auth/profile", session.token, { method: "PATCH", body: JSON.stringify({ firstName: form.get("firstName"), lastName: form.get("lastName") }) });
      setProfile(updated);
      const nextSession = { ...currentSession, user: { id: updated.id, firstName: updated.firstName, lastName: updated.lastName, email: updated.email } };
      setCurrentSession(nextSession);
      saveSession(nextSession);
      setEditing(false);
      setMessage("Your profile has been updated.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update your profile."); }
    finally { setSaving(false); }
  };
  const logout = () => { clearSession(); router.replace("/login"); };

  return <AppShell session={currentSession}><section className="page-polished mx-auto max-w-3xl space-y-6 pb-6">
    <header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Account</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">My profile</h1><p className="mt-2 text-sm text-white/55">Manage your personal details and see your access.</p></header>
    {message && <p role="status" className="rounded-xl border border-[#f4c20d]/20 bg-[#f4c20d]/10 px-4 py-3 text-sm text-[#ffe48a]">{message}</p>}
    {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300">{error}</p>}
    {!profile ? !error && <div role="status" aria-label="Loading profile" className="animate-pulse rounded-2xl border border-white/10 bg-[#1f1f1f] p-6 motion-reduce:animate-none"><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-white/10" /><div className="space-y-3"><div className="h-4 w-36 rounded bg-white/10" /><div className="h-3 w-48 rounded bg-white/5" /></div></div><div className="mt-8 h-20 rounded-xl bg-white/5" /></div> : <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f1f] shadow-[0_16px_45px_rgba(0,0,0,0.12)]">
      <div className="h-1 bg-[#f4c20d]" />
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#f4c20d]/15 text-2xl font-bold text-[#f4c20d] ring-1 ring-[#f4c20d]/20">{profile.firstName.charAt(0).toUpperCase()}</span><div className="min-w-0"><h2 className="break-words text-lg font-semibold">{profile.firstName} {profile.lastName}</h2><p className="mt-1 break-all text-sm text-white/55">{profile.email}</p></div></div>
          {!editing && !session.isDemo && <button type="button" onClick={() => { setEditing(true); setMessage(""); setError(""); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-medium transition hover:border-[#f4c20d]/50 hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d="m4 20 4-.8L19 8.2 15.8 5 4.8 16zM14.5 6.3l3.2 3.2" /></svg>Edit profile</button>}
        </div>
        {editing && <form onSubmit={submit} className="mt-7 grid gap-4 rounded-xl border border-white/10 bg-black/10 p-4 sm:grid-cols-2 sm:p-5"><div className="sm:col-span-2"><h3 className="font-semibold">Personal details</h3><p className="mt-1 text-sm text-white/50">Update the name shown on your account.</p></div><label className="space-y-2 text-sm text-white/75"><span>First name</span><input name="firstName" defaultValue={profile.firstName} required maxLength={80} autoComplete="given-name" className="field w-full" /></label><label className="space-y-2 text-sm text-white/75"><span>Last name</span><input name="lastName" defaultValue={profile.lastName} required maxLength={80} autoComplete="family-name" className="field w-full" /></label><div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={saving} className="min-h-11 rounded-lg bg-[#f4c20d] px-4 text-sm font-semibold text-[#0d0d0d] transition hover:bg-[#ffda45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button><button type="button" onClick={() => setEditing(false)} disabled={saving} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm transition hover:bg-white/5 disabled:opacity-50">Cancel</button></div></form>}
        <div className="mt-7 border-t border-white/10 pt-6"><h3 className="text-sm font-semibold">Account details</h3><dl className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-black/10 p-4"><dt className="text-xs text-white/50">Account status</dt><dd className="mt-2 inline-flex items-center gap-2 text-sm font-medium"><span className={`h-2 w-2 rounded-full ${profile.isActive ? "bg-emerald-400" : "bg-white/40"}`} />{profile.isActive ? "Active" : "Inactive"}</dd></div><div className="rounded-xl border border-white/10 bg-black/10 p-4"><dt className="text-xs text-white/50">Assigned roles</dt><dd className="mt-2 flex flex-wrap gap-1.5">{profile.roles.length ? profile.roles.map((role) => <span key={role} className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium">{role}</span>) : <span className="text-sm text-white/60">No active roles assigned</span>}</dd></div><div className="rounded-xl border border-white/10 bg-black/10 p-4 sm:col-span-2"><dt className="text-xs text-white/50">Email address</dt><dd className="mt-2 break-all text-sm font-medium">{profile.email}</dd><dd className="mt-1.5 text-xs leading-5 text-white/45">Contact an administrator if your email needs to change.</dd></div></dl></div>
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold">Session</h3><p className="mt-1 text-xs text-white/45">Sign out of this device.</p></div><button type="button" onClick={logout} className="min-h-11 rounded-lg border border-red-400/25 px-4 text-sm font-medium text-red-300 transition hover:bg-red-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300">Log out</button></div>
      </div>
    </article>}
  </section></AppShell>;
}
