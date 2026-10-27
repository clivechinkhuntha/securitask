"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

function ThemeIcon({ isLight }: { isLight: boolean }) {
  return isLight ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d="M20.4 15.6A8.5 8.5 0 0 1 8.4 3.6 8.5 8.5 0 1 0 20.4 15.6Z" /></svg>;
}

function StaggeredWords({ text, playing, startDelay = 0, gap = 105 }: { text: string; playing: boolean; startDelay?: number; gap?: number }) {
  return <><span className="sr-only">{text}</span><span aria-hidden="true" className="flex flex-wrap justify-center gap-x-[.28em] gap-y-1">{text.split(" ").map((word, index) => <span key={`${word}-${index}`} className={`word-reveal inline-block ${playing ? "word-reveal-active" : ""}`} style={{ animationDelay: `${startDelay + index * gap}ms` }}>{word}</span>)}</span></>;
}

export default function HomePage() {
  const router = useRouter();
  const [isLight, setIsLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playTextAnimation, setPlayTextAnimation] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
    setIsLight(localStorage.getItem("securitask.public-theme") === "light");
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPlayTextAnimation(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = () => setIsLight((value) => {
    const next = !value;
    localStorage.setItem("securitask.public-theme", next ? "light" : "dark");
    return next;
  });

  const theme = isLight
    ? { page: "bg-[#f7f7f4] text-[#151515]", surface: "border-black/10 bg-white/90", border: "border-black/10", muted: "text-black/60", soft: "text-black/45", panel: "border-black/10 bg-white/75", icon: "border-black/15 text-[#151515]" }
    : { page: "bg-[#0d0d0d] text-white", surface: "border-white/10 bg-[#0d0d0d]/90", border: "border-white/10", muted: "text-white/65", soft: "text-white/45", panel: "border-white/10 bg-white/[0.035]", icon: "border-white/20 text-white" };
  const navItem = "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#f4c20d]/12 hover:text-[#b78d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]";
  const closeMenu = () => setMenuOpen(false);

  return <main className={`min-h-[100dvh] overflow-x-hidden transition-colors duration-300 ${theme.page}`}>
    <header className={`fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl ${theme.surface} ${theme.border}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link href="/" onClick={closeMenu} className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]">
          <Image src="/securitask-logo.jpeg" alt="Securitask" width={44} height={44} priority className="h-9 w-9 shrink-0 rounded-md object-cover sm:h-10 sm:w-10" />
          <span className="truncate text-sm font-extrabold uppercase tracking-[.08em] text-[#d9aa00] sm:text-base">Securitask</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <Link href="/" aria-current="page" className={navItem}>Home</Link>
          <Link href="/about" className={navItem}>About</Link>
          <Link href="/contact" className={navItem}>Contact</Link>
          <button type="button" onClick={toggleTheme} aria-label={isLight ? "Use dark theme" : "Use light theme"} className={`ml-2 grid h-10 w-10 place-items-center rounded-lg border transition hover:border-[#f4c20d] hover:text-[#b78d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] ${theme.icon}`}><ThemeIcon isLight={isLight} /></button>
          <Link href="/login" className="ml-3 rounded-lg bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] shadow-[0_8px_22px_rgba(244,194,13,.18)] transition hover:-translate-y-px hover:bg-[#ffd52c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]">Sign in</Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden"><button type="button" onClick={toggleTheme} aria-label={isLight ? "Use dark theme" : "Use light theme"} className={`grid h-10 w-10 place-items-center rounded-lg border transition hover:border-[#f4c20d] hover:text-[#b78d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] ${theme.icon}`}><ThemeIcon isLight={isLight} /></button><button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} className={`grid h-10 w-10 place-items-center rounded-lg border transition hover:border-[#f4c20d] hover:text-[#b78d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] ${theme.icon}`}><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d={menuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg></button></div>
      </div>
      {menuOpen && <><button type="button" aria-label="Close navigation" className="fixed inset-0 top-16 -z-10 bg-black/40 md:hidden" onClick={closeMenu} /><nav className={`border-t px-4 py-3 shadow-2xl md:hidden ${theme.surface} ${theme.border}`} aria-label="Mobile navigation"><div className="mx-auto grid max-w-6xl gap-1"><Link href="/" onClick={closeMenu} className={navItem}>Home</Link><Link href="/about" onClick={closeMenu} className={navItem}>About</Link><Link href="/contact" onClick={closeMenu} className={navItem}>Contact</Link><Link href="/login" onClick={closeMenu} className="mt-2 rounded-lg bg-[#f4c20d] px-4 py-3 text-center text-sm font-bold text-[#0d0d0d] transition hover:bg-[#ffd52c]">Sign in</Link></div></nav></>}
    </header>

    <section className="relative mx-auto flex min-h-[100dvh] max-w-6xl items-center justify-center px-5 pb-16 pt-28 text-center sm:px-8 sm:pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-[32rem] -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(244,194,13,.14),transparent_64%)]" />
      <div className={`relative z-10 w-full max-w-xl rounded-2xl border px-6 py-10 shadow-[0_20px_70px_rgba(0,0,0,.14)] sm:px-12 sm:py-14 ${theme.panel}`}>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl border border-[#f4c20d]/30 bg-[#f4c20d]/10 p-2 shadow-[0_0_38px_rgba(244,194,13,.14)] sm:h-24 sm:w-24">
          <Image src="/securitask-logo.jpeg" alt="Securitask logo" width={84} height={84} priority className="h-full w-full rounded-xl object-cover" />
        </div>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.34em] text-[#c99e00] sm:tracking-[.45em]">Securitask</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl"><StaggeredWords text="Secure Workspace." playing={playTextAnimation} startDelay={120} gap={150} /></h1>
        <p className={`mx-auto mt-4 max-w-md text-sm leading-6 sm:text-base sm:leading-7 ${theme.muted}`}><StaggeredWords text="A secure workspace for managing employees, clients, and financial records." playing={playTextAnimation} startDelay={530} gap={92} /></p>
        <div className="mt-8 sm:mt-10"><Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#f4c20d] px-7 py-3 text-sm font-bold text-[#0d0d0d] shadow-[0_8px_24px_rgba(244,194,13,.2)] transition hover:-translate-y-px hover:bg-[#ffd52c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4c20d]">Sign in</Link></div>
      </div>
    </section>

    <footer className={`absolute inset-x-0 bottom-0 border-t px-5 py-4 text-center text-xs sm:px-8 ${theme.border} ${theme.soft}`}>© {new Date().getFullYear()} Securitask. Internal access only.</footer>
  </main>;
}
