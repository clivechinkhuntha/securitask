"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearSession, getSession, saveSession, type AuthSession } from "@/lib/auth";

type LocalAuthentication = { token: string; user: AuthSession["user"]; permissions: string[] };

export default function LoginPage() {
  const router = useRouter(); const [isCreatingAccount, setIsCreatingAccount] = useState(false); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(""); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (getSession()?.isDemo) router.replace("/dashboard"); }, [router]);
  const saveAuthenticatedSession = (authentication: LocalAuthentication) => {
    saveSession(authentication);
    router.replace("/dashboard");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      clearSession();
      const authentication = await apiRequest<LocalAuthentication>(isCreatingAccount ? "/api/auth/register" : "/api/auth/login", "", {
        method: "POST",
        body: JSON.stringify(isCreatingAccount ? { firstName: name.trim().split(/\s+/)[0], lastName: name.trim().split(/\s+/).slice(1).join(" ") || "User", email, password } : { email, password }),
      });
      saveAuthenticatedSession(authentication);
    } catch (caughtError) { clearSession(); setError(caughtError instanceof Error ? caughtError.message : "Unable to continue."); }
    finally { setIsSubmitting(false); }
  };
  const field = "w-full rounded-lg border border-white/15 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[#f4c20d] focus:ring-2 focus:ring-[#f4c20d]/20";
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0d0d0d] px-5 py-8 text-white sm:px-8"><div className="pointer-events-none absolute -top-28 right-[-8rem] h-80 w-80 rounded-full bg-[#f4c20d]/10 blur-3xl" /><section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1f1f1f]/90 p-7 shadow-2xl backdrop-blur sm:p-10"><div className="mx-auto mb-6 flex justify-center"><Image src="/securitask-logo.jpeg" alt="Securitask" width={128} height={128} priority className="h-auto w-28 rounded-lg sm:w-32" /></div><p className="text-sm font-semibold uppercase tracking-[.22em] text-[#f4c20d]">Secure access</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{isCreatingAccount ? "Create account." : "Welcome back."}</h1><p className="mt-3 text-sm leading-6 text-white/55">{isCreatingAccount ? "Use the exact email your administrator added to Securitask." : "Sign in with your account."}</p><form className="mt-9 space-y-5" onSubmit={submit}>{isCreatingAccount && <label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Full name</span><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className={field} /></label>}<label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Email address</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@securitask.com" className={field} /></label><label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Password</span><div className="relative"><input required type={showPassword ? "text" : "password"} minLength={isCreatingAccount ? 12 : undefined} autoComplete={isCreatingAccount ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isCreatingAccount ? "At least 12 characters" : "Enter your password"} className={`${field} pr-12`} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-white/55 transition hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-[#f4c20d]">{showPassword ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 5.1 9.7 7.1a1.9 1.9 0 0 1 0 1.8 17.7 17.7 0 0 1-3.1 4.1M6.2 6.2A17.5 17.5 0 0 0 2.3 11a1.9 1.9 0 0 0 0 1.8C3.3 14.9 7 20 12 20c1.2 0 2.3-.3 3.3-.8" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M2.3 11.1a1.9 1.9 0 0 0 0 1.8C3.3 14.9 7 20 12 20s8.7-5.1 9.7-7.1a1.9 1.9 0 0 0 0-1.8C20.7 9.1 17 4 12 4S3.3 9.1 2.3 11.1Z" /><circle cx="12" cy="12" r="3" /></svg>}</button></div></label>{error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button disabled={isSubmitting} className="w-full rounded-lg bg-[#f4c20d] px-4 py-3.5 font-bold text-[#0d0d0d] transition hover:bg-[#ffd133] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Please wait..." : isCreatingAccount ? "Create account" : "Sign in securely"}</button></form><div className="mt-5 border-t border-white/10 pt-5 text-center"><button onClick={() => { setIsCreatingAccount((value) => !value); setError(""); setShowPassword(false); }} className="text-sm font-medium text-white/70 transition hover:text-[#f4c20d]">{isCreatingAccount ? "Already have an account? Sign in" : "Create account"}</button></div></section></main>;
}
