"use client";

import { ComingSoonPage } from "@/components/coming-soon-page";
import { ProtectedPage } from "@/components/protected-page";

export default function AdvancesPage() {
  return <ProtectedPage>{(session) => <ComingSoonPage session={session} section="Workforce finance" title="Employee advances" />}</ProtectedPage>;
}
