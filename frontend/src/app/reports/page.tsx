"use client";

import { ComingSoonPage } from "@/components/coming-soon-page";
import { ProtectedPage } from "@/components/protected-page";

export default function ReportsPage() {
  return <ProtectedPage>{(session) => <ComingSoonPage session={session} section="Reporting" title="Reports" />}</ProtectedPage>;
}
