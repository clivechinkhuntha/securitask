"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

function ThemeIcon({ light }: { light: boolean }) {
  return light ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M20.4 15.6A8.5 8.5 0 0 1 8.4 3.6 8.5 8.5 0 1 0 20.4 15.6Z" /></svg>;
}

export default function HomePage() {
  const router = useRouter();
  const [light, setLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { if (getSession()) router.replace("/dashboard"); }, [router]);

  const pageTheme = light ? "bg-[#f6f6f3] text-[#151515]" : "bg-[#0d0d0d] text-white";
  const borderTheme = light ? "border-black/10" : "border-white/10";
  const headerTheme = light ? "bg-white/92" : "bg-[#0d0d0d]/92";
  const muted = light ? "text-black/60" : "text-white/60";
  const navItem = `rounded-md px-3 py-2 text-sm font-medium transition hover:bg-[#f4c20d]/10 hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]`;
  const closeMenu = () => setMenuOpen(false);

  return <main className={`min-h-[100dvh] overflow-x-hidden transition-colors duration-300 ${pageTheme}`}>
    <header className={`fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl ${borderTheme} ${headerTheme}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]" onClick={closeMenu}>
          <Image src="/securitask-logo.jpeg" alt="Securitask" width={44} height={44} priority className="h-9 w-9 shrink-0 rounded-md object-cover sm:h-10 sm:w-10" />
          <span className="truncate text-sm font-extrabold uppercase tracking-[.08em] text-[#f4c20d] sm:text-base">Securitask</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <Link href="/" aria-current="page" className={navItem}>Home</Link>
          <Link href="/about" className={navItem}>About</Link>
          <Link href="/contact" className={navItem}>Contact</Link>
          <button onClick={() => setLight((value) => !value)} aria-label={light ? "Use dark theme" : "Use light theme"} className={`ml-2 grid h-10 w-10 place-items-center rounded-md border transition hover:border-[#f4c20d] hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] ${light ? "border-black/15" : "border-white/20"}`}><ThemeIcon light={light} /></button>
          <Link href="/login" className="ml-3 rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] transition hover:bg-[#ffd52c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]">Sign in</Link>
        </nav>
        <button onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} className={`grid h-10 w-10 place-items-center rounded-md border transition hover:border-[#f4c20d] hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] md:hidden ${light ? "border-black/15" : "border-white/20"}`}><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d={menuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg></button>
      </div>
      {menuOpen && <><button aria-label="Close navigation" className="fixed inset-0 top-16 -z-10 bg-black/45 md:hidden" onClick={closeMenu} /><nav className={`border-t px-4 py-3 shadow-2xl md:hidden ${borderTheme} ${light ? "bg-white" : "bg-[#121212]"}`} aria-label="Mobile navigation"><div className="mx-auto grid max-w-6xl gap-1"><Link href="/" onClick={closeMenu} className={navItem}>Home</Link><Link href="/about" onClick={closeMenu} className={navItem}>About</Link><Link href="/contact" onClick={closeMenu} className={navItem}>Contact</Link><button onClick={() => setLight((value) => !value)} className={`${navItem} flex items-center gap-2 text-left`}><ThemeIcon light={light} />{light ? "Use dark theme" : "Use light theme"}</button><Link href="/login" onClick={closeMenu} className="mt-2 rounded-md bg-[#f4c20d] px-4 py-3 text-center text-sm font-bold text-[#0d0d0d] transition hover:bg-[#ffd52c]">Sign in</Link></div></nav></>}
    </header>
    <section className="relative mx-auto grid min-h-[100dvh] max-w-6xl place-items-center px-5 pb-12 pt-24 text-center sm:px-8 sm:pb-16 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-80 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(244,194,13,.12),transparent_62%)]" />
      <div className="relative z-10 w-full max-w-xl animate-[fade-in_.45s_ease-out]">
        <Image src="/securitask-logo.jpeg" alt="Securitask logo" width={160} height={160} priority className="mx-auto h-24 w-24 rounded-xl object-cover shadow-[0_0_50px_rgba(244,194,13,.2)] sm:h-32 sm:w-32" />
        <div className="mt-7 sm:mt-9"><p className="text-xs font-bold uppercase tracking-[.32em] text-[#f4c20d] sm:tracking-[.42em]">Securitask</p><div className="mx-auto mt-4 h-px w-12 bg-[#f4c20d]" /></div>
        <p className={`mx-auto mt-5 max-w-md text-[15px] font-medium leading-7 sm:mt-6 sm:max-w-lg sm:text-lg sm:leading-8 ${muted}`}>A secure workspace for managing your people, clients, and financial records.</p>
        <div className="mt-8 sm:mt-10"><Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#f4c20d] px-6 py-3 text-sm font-bold text-[#0d0d0d] shadow-[0_8px_24px_rgba(244,194,13,.18)] transition hover:-translate-y-0.5 hover:bg-[#ffd52c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4c20d]">Get started</Link></div>
      </div>
    </section>
  </main>;
}
