"use client";

import { ProtectedPage } from "@/components/protected-page";
import { ProfileContent } from "@/components/profile-content";

export default function ProfilePage() {
  return <ProtectedPage>{(session) => <ProfileContent session={session} />}</ProtectedPage>;
}
