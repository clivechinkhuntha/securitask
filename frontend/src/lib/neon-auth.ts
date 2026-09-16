"use client";

import { createInternalNeonAuth } from "@neondatabase/auth";

const configuredAuthUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL;

if (!configuredAuthUrl) {
  throw new Error("NEXT_PUBLIC_NEON_AUTH_URL is required to use Neon Auth.");
}

const authUrl = configuredAuthUrl;

export const neonAuth = createInternalNeonAuth(authUrl);

export async function getFreshNeonAuthToken() {
  const session = await neonAuth.adapter.getSession({
    query: { disableCookieCache: "true" },
  });

  return session.data?.session?.token ?? null;
}
