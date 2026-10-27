"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearSession, getSession, saveSession, type AuthSession } from "@/lib/auth";
import { getFreshNeonAuthToken, neonAuth } from "@/lib/neon-auth";

type WorkspaceProfile = { user: AuthSession["user"]; permissions: string[] };
type NeonResult = { error?: { message?: string } | null };

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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (getSession()?.isDemo) router.replace("/dashboard"); }, [router]);

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
        if (!isCreatingAccount && /credential|email or password|invalid/i.test(message)) {
          throw new Error("Neon Auth does not recognise this password yet. If this is your first sign-in after the security update, choose Create account and use the email your administrator added. Otherwise, use Forgot password.");
        }
        throw new Error(message);
      }
      await openWorkspace();
    } catch (caughtError) {
      clearSession(); setError(caughtError instanceof Error ? caughtError.message : "Unable to continue.");
    } finally { setIsSubmitting(false); }
  };

  const field = "w-full rounded-lg border border-white/15 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#f4c20d] focus:ring-2 focus:ring-[#f4c20d]/20";
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0d0d0d] px-5 py-8 text-white sm:px-8"><div className="pointer-events-none absolute -top-28 right-[-8rem] h-80 w-80 rounded-full bg-[#f4c20d]/10 blur-3xl" /><section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1f1f1f]/90 p-7 shadow-2xl backdrop-blur sm:p-10"><div className="mx-auto mb-6 flex justify-center"><Image src="/securitask-logo.jpeg" alt="Securitask" width={128} height={128} priority className="h-auto w-28 rounded-lg sm:w-32" /></div><p className="text-sm font-semibold uppercase tracking-[.22em] text-[#f4c20d]">Secure access</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{isCreatingAccount ? "Create account." : "Welcome back."}</h1><p className="mt-3 text-sm leading-6 text-white/55">{isCreatingAccount ? "Use the exact email your administrator added to Securitask." : "Sign in with your account."}</p><form className="mt-9 space-y-5" onSubmit={submit}>{isCreatingAccount && <label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Full name</span><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className={field} /></label>}<label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Email address</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@securitask.com" className={field} /></label><label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Password</span><div className="relative"><input required type={showPassword ? "text" : "password"} minLength={isCreatingAccount ? 8 : undefined} autoComplete={isCreatingAccount ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isCreatingAccount ? "At least 8 characters" : "Enter your password"} className={`${field} pr-14`} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 grid w-14 place-items-center rounded-r-lg text-xs font-semibold text-white/55 transition hover:text-[#f4c20d]">{showPassword ? "Hide" : "Show"}</button></div></label>{!isCreatingAccount && <div className="text-right"><Link href="/reset-password" className="text-sm font-medium text-white/60 transition hover:text-[#f4c20d]">Forgot password?</Link></div>}{error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button disabled={isSubmitting} className="w-full rounded-lg bg-[#f4c20d] px-4 py-3.5 font-bold text-[#0d0d0d] transition hover:bg-[#ffd133] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Please wait..." : isCreatingAccount ? "Create account" : "Sign in securely"}</button></form><div className="mt-5 border-t border-white/10 pt-5 text-center"><button onClick={() => { setIsCreatingAccount((value) => !value); setError(""); setShowPassword(false); }} className="text-sm font-medium text-white/70 transition hover:text-[#f4c20d]">{isCreatingAccount ? "Already have an account? Sign in" : "Create account"}</button></div></section></main>;
}
