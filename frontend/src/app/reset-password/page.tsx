"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { neonAuth } from "@/lib/neon-auth";

type NeonResult = { error?: { message?: string } | null };

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setToken(new URLSearchParams(window.location.search).get("token") ?? ""); }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      const result = await neonAuth.adapter.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      const message = (result as NeonResult).error?.message;
      if (message) throw new Error(message);
      setSent(true);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Unable to send the reset email."); }
    finally { setIsSubmitting(false); }
  };

  const completeReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    try {
      const result = await neonAuth.adapter.resetPassword({ token, newPassword });
      const message = (result as NeonResult).error?.message;
      if (message) throw new Error(message);
      setSent(true);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Unable to reset your password."); }
    finally { setIsSubmitting(false); }
  };

  const field = "w-full rounded-lg border border-white/15 bg-[#0d0d0d] px-4 py-3.5 text-white outline-none focus:border-[#f4c20d]";
  const notice = token ? "Choose a new password for your account." : "Enter your account email and we will send a secure reset link.";
  return <main className="grid min-h-screen place-items-center bg-[#0d0d0d] px-5 py-8 text-white"><section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1f1f1f] p-7 shadow-2xl sm:p-10"><div className="mb-6 flex justify-center"><Image src="/securitask-logo.jpeg" alt="Securitask" width={112} height={112} className="h-auto w-24 rounded-lg" /></div><p className="text-sm font-semibold uppercase tracking-[.22em] text-[#f4c20d]">Password reset</p><h1 className="mt-4 text-3xl font-bold">{sent && token ? "Password updated." : "Reset your password."}</h1>{sent ? <div className="mt-6 rounded-lg border border-[#f4c20d]/30 bg-[#f4c20d]/10 p-4 text-sm leading-6 text-white/80">{token ? "Your password has been changed. You can now sign in." : "If this email has a Securitask account, Neon Auth has sent reset instructions. Check your inbox and spam folder."}</div> : <><p className="mt-3 text-sm leading-6 text-white/55">{notice}</p><form className="mt-8 space-y-5" onSubmit={token ? completeReset : submit}>{token ? <label className="block text-sm font-medium text-white/80"><span className="mb-2 block">New password</span><div className="relative"><input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={`${field} pr-14`} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 grid w-14 place-items-center rounded-r-lg text-white/60 transition hover:text-[#f4c20d] focus-visible:outline-2 focus-visible:outline-[#f4c20d]"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true">{showPassword ? <><path d="m3 3 18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 5.1 9.7 7.1a1.9 1.9 0 0 1 0 1.8 17.7 17.7 0 0 1-3.1 4.1M6.2 6.2A17.5 17.5 0 0 0 2.3 11a1.9 1.9 0 0 0 0 1.8C3.3 14.9 7 20 12 20c1.2 0 2.3-.3 3.3-.8" /></> : <><path d="M2.3 11.1a1.9 1.9 0 0 0 0 1.8C3.3 14.9 7 20 12 20s8.7-5.1 9.7-7.1a1.9 1.9 0 0 0 0-1.8C20.7 9.1 17 4 12 4S3.3 9.1 2.3 11.1Z" /><circle cx="12" cy="12" r="3" /></>}</svg></button></div></label> : <label className="block text-sm font-medium text-white/80"><span className="mb-2 block">Email address</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} placeholder="you@securitask.com" /></label>}{error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button disabled={isSubmitting} className="w-full rounded-lg bg-[#f4c20d] px-4 py-3.5 font-bold text-[#0d0d0d] disabled:opacity-60">{isSubmitting ? "Please wait..." : token ? "Set new password" : "Send reset link"}</button></form></>}<Link href="/login" className="mt-6 block text-center text-sm font-medium text-white/65 transition hover:text-[#f4c20d]">Back to sign in</Link></section></main>;
}
