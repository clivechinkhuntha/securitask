"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, type AuthSession } from "@/lib/auth";
import { neonAuth } from "@/lib/neon-auth";

type IconName = "dashboard" | "clients" | "invoice" | "payment" | "bank" | "expense" | "payroll" | "advance" | "report" | "admin" | "audit" | "settings";

const navigation: { label: string; href: string; icon: IconName; permission?: string }[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" }, { label: "Clients", href: "/clients", icon: "clients", permission: "clients.view" }, { label: "Invoices", href: "/invoices", icon: "invoice", permission: "invoices.view" }, { label: "Payments", href: "/payments", icon: "payment", permission: "payments.view" }, { label: "Bank & Cash", href: "/accounts", icon: "bank", permission: "accounts.view" }, { label: "Expenses", href: "/expenses", icon: "expense", permission: "expenses.view" }, { label: "Payroll", href: "/payroll", icon: "payroll", permission: "payroll.view" }, { label: "Advances", href: "/advances", icon: "advance", permission: "advances.view" }, { label: "Reports", href: "/reports", icon: "report", permission: "reports.view" }, { label: "Users & Roles", href: "/admin", icon: "admin", permission: "users.view" }, { label: "Audit Logs", href: "/admin/audit", icon: "audit", permission: "audit.view" },
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    dashboard: <><path d="M3 11 12 3l9 8v9H3z" /><path d="M9 21v-6h6v6" /></>, clients: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 21c.5-4 3-6 6-6s5.5 2 6 6M14 16c3.5 0 5.5 2 6 5" /></>, invoice: <><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></>, payment: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></>, bank: <><path d="m2 9 10-6 10 6M4 10h16M5 10v8M9 10v8M15 10v8M19 10v8M2 21h20" /></>, expense: <><path d="M5 7h14l-1 14H6zM8 7a4 4 0 0 1 8 0M9 12h6" /></>, payroll: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="8" r="3" /><path d="M3 21c.5-4 3-6 6-6s5.5 2 6 6M14 15c3.5 0 6 2 7 6" /></>, advance: <><path d="M4 8h16v11H4z" /><circle cx="12" cy="13.5" r="2.5" /><path d="M7 11h.1M17 16h.1" /></>, report: <><path d="M6 3h10l3 3v15H6z" /><path d="M16 3v4h4M9 11h6M9 15h6" /></>, admin: <><circle cx="9" cy="8" r="3" /><path d="M3 21c.5-4 3-6 6-6s5.5 2 6 6M17 11v6M14 14h6" /></>, audit: <><path d="M5 3h11l3 3v15H5z" /><path d="M16 3v4h4M9 11h6M9 15h5" /></>, settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.1 2.1-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.65v.11h-3v-.11a1.8 1.8 0 0 0-1.1-1.65 1.8 1.8 0 0 0-2 .36l-.06.06-2.1-2.1.06-.06a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.65-1.1H5v-3h.11a1.8 1.8 0 0 0 1.65-1.1 1.8 1.8 0 0 0-.36-2l-.06-.06 2.1-2.1.06.06a1.8 1.8 0 0 0 2 .36 1.8 1.8 0 0 0 1.1-1.65V3.5h3v.11a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 2-.36l.06-.06 2.1 2.1-.06.06a1.8 1.8 0 0 0 1.65 1.1H21v3h-.11A1.8 1.8 0 0 0 19.4 15Z" /></>,
  };
  return <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] shrink-0 fill-none stroke-current stroke-[2]" aria-hidden="true">{paths[name]}</svg>;
}

function HeaderButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} aria-label={label} className="grid h-9 w-9 place-items-center rounded-md text-white/70 transition hover:bg-white/8 hover:text-[#f4c20d] focus:outline-none focus:ring-2 focus:ring-[#f4c20d]/60">{children}</button>;
}

export function AppShell({ session, children }: { session: AuthSession; children: ReactNode }) {
  const router = useRouter(); const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false); const [isProfileOpen, setIsProfileOpen] = useState(false); const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); const [isLightTheme, setIsLightTheme] = useState(false);
  const items = navigation.filter((item) => !item.permission || session.permissions.includes(item.permission));
  const displayName = `${session.user.firstName} ${session.user.lastName}`.trim();
  const signOut = async () => {
    try { if (!session.isDemo) await neonAuth.adapter.signOut(); }
    finally { clearSession(); router.replace("/login"); }
  };
  useEffect(() => { const savedTheme = localStorage.getItem("securitask.theme"); const light = savedTheme === "light"; setIsLightTheme(light); document.documentElement.dataset.theme = light ? "light" : "dark"; }, []);
  const toggleTheme = () => { const light = !isLightTheme; setIsLightTheme(light); localStorage.setItem("securitask.theme", light ? "light" : "dark"); document.documentElement.dataset.theme = light ? "light" : "dark"; };
  const toggleNavigation = () => { if (window.innerWidth >= 1024) setIsSidebarCollapsed((value) => !value); else setIsMenuOpen(true); };
  const sidebarWidth = isSidebarCollapsed ? "lg:w-16" : "lg:w-44";
  const contentOffset = isSidebarCollapsed ? "lg:pl-20" : "lg:pl-[192px]";
  const headerOffset = isSidebarCollapsed ? "lg:left-16" : "lg:left-44";

  return <main className="min-h-screen bg-[#050606] text-white">
    <header className={`fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#080a0a]/95 px-3 backdrop-blur transition-[left] duration-200 ${headerOffset} lg:px-5`}>
      <HeaderButton label={isSidebarCollapsed ? "Expand navigation" : "Minimize navigation"} onClick={toggleNavigation}><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg></HeaderButton>
      <div className="flex items-center gap-1 sm:gap-2"><HeaderButton label={isLightTheme ? "Use dark theme" : "Use light theme"} onClick={toggleTheme}>{isLightTheme ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M20.4 15.6A8.5 8.5 0 0 1 8.4 3.6 8.5 8.5 0 1 0 20.4 15.6Z" /></svg>}</HeaderButton><HeaderButton label="Notifications"><span className="relative"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#f4c20d] px-1 text-[9px] font-bold text-[#0d0d0d]">3</span></span></HeaderButton><div className="relative ml-1 sm:ml-2"><button type="button" onClick={() => setIsProfileOpen((value) => !value)} aria-label="Open account menu" aria-expanded={isProfileOpen} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/85 text-sm font-bold text-[#0d0d0d] transition hover:border-[#f4c20d]">{displayName.charAt(0).toUpperCase()}</button>{isProfileOpen && <div className="absolute right-0 top-11 w-56 overflow-hidden rounded-lg border border-white/10 bg-[#171919] py-1 shadow-2xl"><div className="border-b border-white/10 px-4 py-3"><p className="truncate text-sm font-semibold text-white">{displayName}</p><p className="truncate text-xs text-white/50">{session.user.email}</p></div><Link href="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/7 hover:text-[#f4c20d]">Profile</Link><button onClick={signOut} className="w-full px-4 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-400/10">Log out</button></div>}</div></div>
    </header>
    {isMenuOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setIsMenuOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-44 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#090b0b_0%,#050606_100%)] px-2 py-3 shadow-2xl transition-[transform,width] duration-200 ${sidebarWidth} lg:translate-x-0 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className={`flex items-center justify-between px-2 ${isSidebarCollapsed ? "lg:justify-center" : ""}`}><Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}><Image src="/securitask-logo.jpeg" alt="Securitask" width={34} height={34} className="h-8 w-8 rounded-md object-cover" /><span className={`text-[11px] font-bold uppercase tracking-tight text-[#f4c20d] ${isSidebarCollapsed ? "lg:hidden" : ""}`}>Securitask</span></Link><button onClick={() => setIsMenuOpen(false)} className="text-lg text-white/55 lg:hidden" aria-label="Close navigation">×</button></div>
      <nav className="mt-6 flex flex-col gap-1" aria-label="Primary navigation">{items.map((item) => <Link key={item.href} href={item.href} title={isSidebarCollapsed ? item.label : undefined} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[11px] font-medium transition ${isSidebarCollapsed ? "lg:justify-center lg:px-0" : ""} ${pathname === item.href ? "bg-[#f4c20d] text-[#0d0d0d] shadow-[0_4px_14px_rgba(244,194,13,0.24)]" : "text-white/70 hover:bg-white/[0.07] hover:text-white"}`}><Icon name={item.icon} /><span className={isSidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span></Link>)}</nav>
      <div className={`mt-auto border-t border-white/8 px-2 pt-4 ${isSidebarCollapsed ? "lg:hidden" : ""}`}><p className="truncate text-[10px] font-medium text-white/75">{displayName}</p><p className="truncate text-[9px] text-white/40">{session.user.email}</p><button onClick={signOut} className="mt-3 flex items-center gap-2 text-[11px] text-white/45 transition hover:text-[#f4c20d]"><Icon name="settings" /> Log out</button></div>
    </aside>
    <section className={`min-w-0 px-3 pb-4 pt-[70px] sm:px-4 sm:pb-5 ${contentOffset} lg:pr-4`}>{children}</section>
  </main>;
}
