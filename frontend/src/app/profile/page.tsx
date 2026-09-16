"use client";

import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";

export default function ProfilePage() {
  return <ProtectedPage>{(session) => <AppShell session={session}><section className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Account</p><h1 className="mt-1 text-2xl font-semibold">Profile</h1><p className="mt-1 text-sm text-white/55">Your Securitask account and current access details.</p><article className="mt-6 rounded-xl border border-white/10 bg-[#1f1f1f] p-5 sm:p-6"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#f4c20d] text-xl font-bold text-[#0d0d0d]">{session.user.firstName.charAt(0).toUpperCase()}</span><div><h2 className="font-semibold">{session.user.firstName} {session.user.lastName}</h2><p className="mt-1 text-sm text-white/55">{session.user.email}</p></div></div><dl className="mt-7 grid gap-5 border-t border-white/10 pt-5 sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wide text-white/45">Account status</dt><dd className="mt-1 text-sm font-medium text-[#f4c20d]">Active</dd></div><div><dt className="text-xs uppercase tracking-wide text-white/45">Granted permissions</dt><dd className="mt-1 text-sm font-medium">{session.permissions.length}</dd></div></dl></article></section></AppShell>}</ProtectedPage>;
}
