import { AppShell } from "@/components/app-shell";
import type { AuthSession } from "@/lib/auth";

export function ComingSoonPage({ session, section, title }: { session: AuthSession; section: string; title: string }) {
  return <AppShell session={session}><section className="mx-auto grid min-h-[calc(100dvh-6rem)] max-w-5xl place-items-center py-8"><article className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111414] p-7 text-center shadow-[0_18px_48px_rgba(0,0,0,.14)] sm:p-10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#f4c20d]/25 bg-[#f4c20d]/10 text-2xl text-[#f4c20d]" aria-hidden="true">•</span><p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#f4c20d]">{section}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><p className="mt-5 text-lg font-semibold text-[#f4c20d]">Coming soon!</p><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">This area is being prepared and will be available in a future update.</p></article></section></AppShell>;
}
