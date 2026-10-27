"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearSession, getSession, saveSession, type AuthSession } from "@/lib/auth";
import { getFreshNeonAuthToken, neonAuth } from "@/lib/neon-auth";

type WorkspaceProfile = { user: AuthSession["user"]; permissions: string[] };
type NeonResult = { error?: { message?: string } | null };

function ThemeIcon({ isLight }: { isLight: boolean }) {
  return isLight ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d="M20.4 15.6A8.5 8.5 0 0 1 8.4 3.6 8.5 8.5 0 1 0 20.4 15.6Z" /></svg>;
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d="m3 3 18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 5.1 9.7 7.1a1.9 1.9 0 0 1 0 1.8 17.7 17.7 0 0 1-3.1 4.1M6.2 6.2A17.5 17.5 0 0 0 2.3 11a1.9 1.9 0 0 0 0 1.8C3.3 14.9 7 20 12 20c1.2 0 2.3-.3 3.3-.8" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d="M2.3 11.1a1.9 1.9 0 0 0 0 1.8C3.3 14.9 7 20 12 20s8.7-5.1 9.7-7.1a1.9 1.9 0 0 0 0-1.8C20.7 9.1 17 4 12 4S3.3 9.1 2.3 11.1Z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function messageFrom(result: unknown, fallback: string) {
  return (result as NeonResult | null)?.error?.message || fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getSession()?.isDemo) router.replace("/dashboard");
    setIsLight(localStorage.getItem("securitask.public-theme") === "light");
  }, [router]);

  const toggleTheme = () => setIsLight((value) => {
    const next = !value;
    localStorage.setItem("securitask.public-theme", next ? "light" : "dark");
    return next;
  });

  async function openWorkspace() {
    const token = await getFreshNeonAuthToken();
    if (!token) throw new Error("Neon Auth did not create a secure session. Please try again.");
    const workspace = await apiRequest<WorkspaceProfile>("/api/auth/me", token);
    saveSession({ token, ...workspace });
    router.replace("/dashboard");
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      clearSession();
      const result = isCreatingAccount
        ? await neonAuth.adapter.signUp.email({ name: name.trim(), email: email.trim().toLowerCase(), password })
        : await neonAuth.adapter.signIn.email({ email: email.trim().toLowerCase(), password });
      if ((result as NeonResult).error) {
        const message = messageFrom(result, "Unable to sign in.");
        if (!isCreatingAccount && /credential|email or password|invalid/i.test(message)) throw new Error("Neon Auth does not recognise this password yet. If this is your first sign-in after the security update, choose Create account and use the email your administrator added. Otherwise, use Forgot password.");
        throw new Error(message);
      }
      await openWorkspace();
    } catch (caughtError) {
      clearSession(); setError(caughtError instanceof Error ? caughtError.message : "Unable to continue.");
    } finally { setIsSubmitting(false); }
  };

  const theme = isLight
    ? { page: "bg-[#f7f7f4] text-[#171717]", header: "border-black/10 bg-white/90", panel: "border-black/10 bg-white", side: "border-black/10 bg-[#eeece5]", field: "border-black/15 bg-white text-[#171717] placeholder:text-black/40", label: "text-black/75", muted: "text-black/60", helper: "text-black/50", control: "border-black/15 text-[#171717]", line: "border-black/10" }
    : { page: "bg-[#0d0d0d] text-white", header: "border-white/10 bg-[#0d0d0d]/90", panel: "border-white/10 bg-[#171919]", side: "border-white/10 bg-[linear-gradient(145deg,#171919,#090a0a)]", field: "border-white/15 bg-[#0d0d0d] text-white placeholder:text-white/30", label: "text-white/80", muted: "text-white/65", helper: "text-white/50", control: "border-white/20 text-white", line: "border-white/10" };
  const field = `w-full rounded-lg border px-4 py-3.5 text-sm outline-none transition focus:border-[#f4c20d] focus:ring-2 focus:ring-[#f4c20d]/20 ${theme.field}`;

  return <main className={`min-h-[100dvh] transition-colors duration-300 ${theme.page}`}>
    <header className={`fixed inset-x-0 top-0 z-30 border-b backdrop-blur-xl ${theme.header}`}><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8"><Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d]"><Image src="/securitask-logo.jpeg" alt="Securitask" width={44} height={44} priority className="h-9 w-9 shrink-0 rounded-md object-cover sm:h-10 sm:w-10" /><span className="truncate text-sm font-extrabold uppercase tracking-[.08em] text-[#c99e00] sm:text-base">Securitask</span></Link><div className="flex items-center gap-2"><Link href="/" className={`hidden rounded-lg px-3 py-2 text-sm font-medium transition hover:text-[#b78d00] sm:inline-flex ${theme.muted}`}>Home</Link><button type="button" onClick={toggleTheme} aria-label={isLight ? "Use dark theme" : "Use light theme"} className={`grid h-10 w-10 place-items-center rounded-lg border transition hover:border-[#f4c20d] hover:text-[#b78d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] ${theme.control}`}><ThemeIcon isLight={isLight} /></button></div></div></header>

    <section className="mx-auto grid min-h-[100dvh] max-w-6xl items-center px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:grid-cols-2 lg:px-8">
      <aside className={`relative hidden min-h-[540px] overflow-hidden rounded-l-2xl border border-r-0 p-10 lg:flex lg:flex-col lg:justify-between ${theme.side}`}>
        <div className="pointer-events-none absolute right-[-10rem] top-[-8rem] h-96 w-96 rounded-full bg-[#f4c20d]/12 blur-3xl" />
        <div className="relative"><Image src="/securitask-logo.jpeg" alt="Securitask" width={112} height={112} priority className="h-24 w-24 rounded-2xl object-cover shadow-[0_0_42px_rgba(244,194,13,.17)]" /><p className="mt-10 text-xs font-bold uppercase tracking-[.32em] text-[#c99e00]">Securitask</p><h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-tight">Secure access for authorised staff.</h1><p className={`mt-5 max-w-sm text-sm leading-7 ${theme.muted}`}>Sign in to access the Securitask internal workspace.</p></div>
        <p className={`relative text-xs ${theme.helper}`}>Protected company access</p>
      </aside>

      <section className={`w-full rounded-2xl border p-6 shadow-[0_20px_55px_rgba(0,0,0,.14)] sm:p-9 lg:min-h-[540px] lg:rounded-l-none lg:p-12 ${theme.panel}`}>
        <div className="mx-auto w-full max-w-md"><div className="mb-8 lg:hidden"><Image src="/securitask-logo.jpeg" alt="Securitask" width={80} height={80} priority className="h-16 w-16 rounded-xl object-cover" /></div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#c99e00]">Secure access</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{isCreatingAccount ? "Create your account." : "Welcome back."}</h2><p className={`mt-3 text-sm leading-6 ${theme.muted}`}>{isCreatingAccount ? "Use the exact email address your administrator added to Securitask." : "Sign in using your authorised Securitask account."}</p>
          <form className="mt-8 space-y-5" onSubmit={submit}>{isCreatingAccount && <label className={`block text-sm font-medium ${theme.label}`}><span className="mb-2 block">Full name</span><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className={field} /></label>}<label className={`block text-sm font-medium ${theme.label}`}><span className="mb-2 block">Email address</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@securitask.com" className={field} /></label><label className={`block text-sm font-medium ${theme.label}`}><span className="mb-2 block">Password</span><div className="relative"><input required type={showPassword ? "text" : "password"} minLength={isCreatingAccount ? 8 : undefined} autoComplete={isCreatingAccount ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isCreatingAccount ? "At least 8 characters" : "Enter your password"} className={`${field} pr-12`} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className={`absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg transition hover:text-[#c99e00] focus-visible:outline-2 focus-visible:outline-[#f4c20d] ${theme.helper}`}><EyeIcon visible={showPassword} /></button></div></label>{!isCreatingAccount && <div className="flex justify-end"><Link href="/reset-password" className="text-sm font-medium text-[#b78d00] transition hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-[#f4c20d]">Forgot password?</Link></div>}{error && <p role="alert" className={`rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-6 ${isLight ? "text-red-700" : "text-red-200"}`}>{error}</p>}<button disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f4c20d] px-4 py-3 font-bold text-[#0d0d0d] shadow-[0_8px_22px_rgba(244,194,13,.16)] transition hover:-translate-y-px hover:bg-[#ffd52c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4c20d] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d0d0d]/30 border-t-[#0d0d0d]" />}{isSubmitting ? "Please wait..." : isCreatingAccount ? "Create account" : "Sign in"}</button></form><div className={`mt-6 border-t pt-5 text-center ${theme.line}`}><button type="button" onClick={() => { setIsCreatingAccount((value) => !value); setError(""); setShowPassword(false); }} className={`text-sm font-medium transition hover:text-[#b78d00] focus-visible:outline-2 focus-visible:outline-[#f4c20d] ${theme.muted}`}>{isCreatingAccount ? "Already have an account? Sign in" : "First time here? Create account"}</button></div></div>
      </section>
    </section>
  </main>;
}
