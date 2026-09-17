"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const linkClass = "rounded-md px-3 py-2 text-sm font-medium text-white transition hover:bg-[#f4c20d]/10 hover:text-[#f4c20d]";

  return <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#0d0d0d]/92 text-white backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8"><Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={closeMenu}><Image src="/securitask-logo.jpeg" alt="Securitask" width={44} height={44} className="h-9 w-9 shrink-0 rounded-md object-cover sm:h-10 sm:w-10" /><span className="truncate text-sm font-extrabold uppercase tracking-[.08em] text-[#f4c20d] sm:text-base">Securitask</span></Link><nav className="hidden items-center gap-1 md:flex"><Link href="/" className={linkClass}>Home</Link><Link href="/about" className={linkClass}>About</Link><Link href="/contact" className={linkClass}>Contact</Link><Link href="/login" className="ml-3 rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] transition hover:bg-[#ffd52c]">Sign in</Link></nav><button onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} className="grid h-10 w-10 place-items-center rounded-md border border-white/20 transition hover:border-[#f4c20d] hover:text-[#f4c20d] md:hidden"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d={menuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg></button></div>{menuOpen && <><button aria-label="Close navigation" onClick={closeMenu} className="fixed inset-0 top-16 -z-10 bg-black/45 md:hidden" /><nav className="border-t border-white/10 bg-[#121212] px-4 py-3 shadow-2xl md:hidden"><div className="mx-auto grid max-w-6xl gap-1"><Link href="/" onClick={closeMenu} className={linkClass}>Home</Link><Link href="/about" onClick={closeMenu} className={linkClass}>About</Link><Link href="/contact" onClick={closeMenu} className={linkClass}>Contact</Link><Link href="/login" onClick={closeMenu} className="mt-2 rounded-md bg-[#f4c20d] px-4 py-3 text-center text-sm font-bold text-[#0d0d0d]">Sign in</Link></div></nav></>}</header>;
}
