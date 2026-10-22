"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";
import { notificationRefreshEvent, type NotificationResponse } from "@/lib/notifications";

function Notifications({ session }: { session: AuthSession }) {
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    const result = await apiRequest<NotificationResponse>("/api/notifications", session.token);
    setData(result);
    setError("");
  };
  useEffect(() => { void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load notifications.")); }, [session.token]);
  const markRead = async (keys: string[]) => {
    if (!keys.length) return;
    setSaving(true);
    try {
      await apiRequest("/api/notifications/read", session.token, { method: "POST", body: JSON.stringify({ keys }) });
      await load();
      window.dispatchEvent(new Event(notificationRefreshEvent));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update notifications."); }
    finally { setSaving(false); }
  };
  const visible = data?.notifications.filter((notification) => filter === "all" || !notification.isRead) ?? [];
  const unreadKeys = data?.notifications.filter((notification) => !notification.isRead).map((notification) => notification.key) ?? [];
  return <AppShell session={session}><section className="page-polished mx-auto max-w-4xl space-y-6 pb-6">
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Your workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Notifications</h1><p className="mt-2 text-sm text-white/55">Everything that needs your attention, in one place.</p></div>
      <button type="button" disabled={!unreadKeys.length || saving} onClick={() => void markRead(unreadKeys)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[.04] px-4 text-sm font-medium transition hover:border-[#f4c20d]/50 hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Updating..." : "Mark all as read"}</button>
    </header>
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-300"><span>{error}</span><button type="button" onClick={() => void load().catch(() => setError("Could not load notifications."))} className="font-semibold underline underline-offset-4">Retry</button></div>}
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111414] shadow-[0_16px_45px_rgba(0,0,0,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="inline-flex rounded-lg border border-white/10 bg-black/20 p-1" aria-label="Notification filters">{(["all", "unread"] as const).map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)} className={`min-h-9 rounded-md px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[#f4c20d] ${filter === option ? "bg-[#f4c20d] text-[#0d0d0d]" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>{option === "all" ? "All" : "Unread"}{option === "unread" && data && <span className="ml-1.5 opacity-70">{data.unreadCount}</span>}</button>)}</div>
        {data && <p className="text-xs text-white/45">{data.unreadCount === 1 ? "1 unread update" : `${data.unreadCount} unread updates`}</p>}
      </div>
      {!data && !error ? <div className="space-y-4 p-5" role="status" aria-label="Loading notifications">{[1, 2, 3].map((item) => <div key={item} className="flex gap-4 animate-pulse motion-reduce:animate-none"><div className="h-11 w-11 shrink-0 rounded-xl bg-white/10" /><div className="flex-1 space-y-2 py-1"><div className="h-3 w-36 rounded bg-white/10" /><div className="h-3 w-3/4 rounded bg-white/5" /></div></div>)}</div> : data && !visible.length ? <div className="flex flex-col items-center px-6 py-14 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#f4c20d]/20 bg-[#f4c20d]/10 text-[#f4c20d]"><svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.7" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></div><h2 className="mt-4 font-semibold">{filter === "unread" ? "No unread notifications" : "You’re all caught up"}</h2><p className="mt-1 text-sm text-white/50">New updates will appear here when there’s something to review.</p></div> : <div className="divide-y divide-white/10">{visible.map((notification) => <article key={notification.key} className={`flex flex-col gap-4 px-4 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6 ${notification.isRead ? "" : "bg-[#f4c20d]/[.035]"}`}><div className="flex min-w-0 gap-3"><span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${notification.isRead ? "bg-white/5 text-white/45" : "bg-[#f4c20d]/10 text-[#f4c20d]"}`} aria-hidden="true"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M12 3 2.5 20h19L12 3ZM12 9v4M12 16h.01" /></svg></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{notification.title}</h2>{!notification.isRead && <span className="rounded-full bg-[#f4c20d]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#f4c20d]">Unread</span>}</div><p className="mt-1 break-words text-sm text-white/65">{notification.description}</p><p className="mt-1.5 text-xs text-white/45">{new Date(notification.date).toLocaleDateString()}</p></div></div><div className="flex shrink-0 items-center gap-4 pl-[52px] text-sm sm:pl-0"><Link href={notification.href} className="font-medium text-[#f4c20d] transition hover:text-[#ffe078] focus-visible:outline-2 focus-visible:outline-[#f4c20d]">View <span aria-hidden="true">→</span></Link>{!notification.isRead && <button type="button" disabled={saving} onClick={() => void markRead([notification.key])} className="text-white/60 transition hover:text-white disabled:opacity-40">Mark as read</button>}</div></article>)}</div>}
    </section>
    <p className="text-xs leading-5 text-white/45">Shows current overdue invoices and payroll awaiting approval that you have permission to view, up to 100 of each.</p>
  </section></AppShell>;
}
export default function NotificationsPage() { return <ProtectedPage>{(session) => <Notifications session={session} />}</ProtectedPage>; }
