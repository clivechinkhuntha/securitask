import Image from "next/image";
import Link from "next/link";

export function PublicHeader() {
  return <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#0d0d0d]/90 text-white backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8"><Link href="/" className="flex items-center gap-2"><Image src="/securitask-logo.jpeg" alt="Securitask" width={38} height={38} className="h-9 w-9 rounded-md object-cover" /><span className="text-sm font-bold uppercase tracking-wide text-[#f4c20d]">Securitask</span></Link><nav className="flex items-center gap-4 text-sm"><Link href="/">Home</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/login" className="rounded-md bg-[#f4c20d] px-3 py-2 font-semibold text-[#0d0d0d]">Sign in</Link></nav></div></header>;
}
