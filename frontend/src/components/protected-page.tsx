"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearSession, getSession, type AuthSession } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";

export function ProtectedPage({ children }: { children: (session: AuthSession) => ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getSession();
    if (!existing) {
      router.replace("/login");
      return;
    }
    if (existing.isDemo) {
      void Promise.resolve().then(() => setSession(existing));
      return;
    }

    apiRequest<{ user: AuthSession["user"]; permissions: string[] }>("/api/auth/me", existing.token)
      .then(({ user, permissions }) => setSession({ ...existing, user, permissions }))
      .catch((error: unknown) => {
        clearSession();
        setVerificationError(error instanceof Error ? error.message : "Unable to verify your secure session.");
      });
  }, [router]);

  if (session) return <>{children(session)}</>;
  if (verificationError) {
    return <main className="grid min-h-screen place-items-center bg-[#0d0d0d] px-5 text-white"><section className="w-full max-w-md rounded-2xl border border-red-400/25 bg-[#1f1f1f] p-7 shadow-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f4c20d]">Sign-in verification failed</p><p className="mt-4 text-sm leading-6 text-white/70">{verificationError}</p><button onClick={() => router.replace("/login")} className="mt-7 rounded-lg bg-[#f4c20d] px-4 py-3 text-sm font-bold text-[#0d0d0d] transition hover:bg-[#ffd133]">Return to sign in</button></section></main>;
  }
  return <DashboardSkeleton />;
}
