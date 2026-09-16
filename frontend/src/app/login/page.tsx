"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearSession, demoSession, getSession, saveSession, type AuthSession } from "@/lib/auth";

type LocalAuthentication = { token: string; user: AuthSession["user"]; permissions: string[] };

export default function LoginPage() {
  const router = useRouter(); const [isCreatingAccount, setIsCreatingAccount] = useState(false); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (getSession()?.isDemo) router.replace("/dashboard"); }, [router]);
  const openDemo = () => { saveSession(demoSession); router.replace("/dashboard"); };
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
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0d0d0d] px-5 py-8 text-white sm:px-8"><div className="pointer-events-none absolute -top-28 right-[-8rem] h-80 w-80 rounded-full bg-[#f4c20d]/10 blur-3xl" /><section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#1f1f1f]/90 p-7 shadow-2xl backdrop-blur sm:p-10"><div className="mx-auto mb-6 flex justify-center"><Image src="/securitask-logo.jpeg" alt="Securitask" width={128} height={128} priority className="h-auto w-28 rounded-lg sm:w-32" /></div><p className="text-sm font-semibold uppercase tracking-[.22em] text-[#f4c20d]">Secure access</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{isCreatingAccount ? "Create account." : "Welcome back."}</h1><p className="mt-3 text-sm leading-6 text-white/55">{isCreatingAccount ? "Use the exact email your administrator added to Securitask." : "Sign in with your account."}</p><form className="mt-9 space-y-5" onSubmit={submit}>{isCreatingAccount && <label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Full name</span><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className={field} /></label>}<label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Email address</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@securitask.com" className={field} /></label><label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Password</span><input required type="password" minLength={isCreatingAccount ? 12 : undefined} autoComplete={isCreatingAccount ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isCreatingAccount ? "At least 12 characters" : "Enter your password"} className={field} /></label>{error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button disabled={isSubmitting} className="w-full rounded-lg bg-[#f4c20d] px-4 py-3.5 font-bold text-[#0d0d0d] transition hover:bg-[#ffd133] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Please wait..." : isCreatingAccount ? "Create account" : "Sign in securely"}</button></form><div className="mt-5 border-t border-white/10 pt-5 text-center"><button onClick={() => { setIsCreatingAccount((value) => !value); setError(""); }} className="text-sm font-medium text-white/70 transition hover:text-[#f4c20d]">{isCreatingAccount ? "Already have an account? Sign in" : "Create account"}</button><button onClick={openDemo} className="mt-4 block w-full text-sm font-medium text-white/45 transition hover:text-[#f4c20d]">Explore demo workspace</button></div></section></main>;
}
