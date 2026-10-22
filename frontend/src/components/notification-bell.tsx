"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, type AuthSession } from "@/lib/auth";
import { notificationRefreshEvent, type NotificationResponse } from "@/lib/notifications";

export function NotificationBell({ session }: { session: AuthSession }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (session.isDemo) { setCount(0); return; }
      void apiRequest<NotificationResponse>("/api/notifications", session.token).then((result) => { if (active) setCount(result.unreadCount); }).catch(() => { if (active) setCount(null); });
    };
    refresh();
    window.addEventListener(notificationRefreshEvent, refresh);
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { active = false; window.removeEventListener(notificationRefreshEvent, refresh); window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [session.token, session.isDemo]);
  return <Link href="/notifications" aria-label={count === null ? "Notifications" : `Notifications, ${count} unread`} className="grid h-9 w-9 place-items-center rounded-md text-white/70 transition hover:bg-white/8 hover:text-[#f4c20d] focus:outline-none focus:ring-2 focus:ring-[#f4c20d]/60"><span className="relative"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>{count !== null && count > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#f4c20d] px-1 text-[9px] font-bold text-[#0d0d0d]">{count > 99 ? "99+" : count}</span>}</span></Link>;
}
