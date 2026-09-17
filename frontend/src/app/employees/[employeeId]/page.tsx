"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Site = { id: string; name: string; code: string; client: { name: string } };
type Employee = { id: string; employeeNumber: string; firstName: string; lastName: string; phone: string; email: string | null; nationalId: string | null; jobTitle: string; employeeType: string; basicSalary: string; status: string; dateJoined: string; assignedSiteId: string | null; assignedSite: Site | null; notes: string | null };
type History = { payrollItems: Array<{ id: string; netPay: string; payrollRun: { name: string; status: string; periodEnd: string } }>; advances: Array<{ id: string; advanceNumber: string; amount: string; status: string; advanceDate: string; recoveries: Array<{ amount: string }> }> };

const field = "field w-full";
const money = (value: string | number) => `MWK ${Number(value).toLocaleString()}`;

function Badge({ status }: { status: string }) {
  const color = status === "ACTIVE" || status === "PAID" || status === "RECOVERED" ? "bg-[#f4c20d]/15 text-[#f4c20d]" : status === "SUSPENDED" || status === "TERMINATED" ? "bg-red-400/15 text-red-200" : "bg-white/10 text-white/60";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>{status.replaceAll("_", " ")}</span>;
}

function EmployeeDetail({ session }: { session: AuthSession }) {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [history, setHistory] = useState<History | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const canUpdate = session.permissions.includes("employees.update");
  const canArchive = session.permissions.includes("employees.archive");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [record, activeSites, financialHistory] = await Promise.all([
        apiRequest<Employee>(`/api/employees/${employeeId}`, session.token),
        apiRequest<Site[]>("/api/employees/sites", session.token),
        apiRequest<History>(`/api/employees/${employeeId}/financial-history`, session.token),
      ]);
      setEmployee(record); setSites(activeSites); setHistory(financialHistory);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load this employee."); }
    finally { setLoading(false); }
  }, [employeeId, session.token]);

  useEffect(() => { void load(); }, [load]);

  const updateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await apiRequest(`/api/employees/${employeeId}`, session.token, { method: "PATCH", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      setEditing(false); setMessage("Employee record updated."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update the employee."); }
  };

  const archiveEmployee = async () => {
    if (!window.confirm("Archive this employee? Their payroll and advance history will remain available.")) return;
    try {
      await apiRequest(`/api/employees/${employeeId}/archive`, session.token, { method: "POST" });
      setMessage("Employee archived. Financial history has been preserved."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not archive the employee."); }
  };

  if (loading) return <AppShell session={session}><section className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-5 w-36 rounded bg-white/10" /><div className="h-28 rounded-xl bg-white/8" /><div className="grid gap-4 sm:grid-cols-2"><div className="h-56 rounded-xl bg-white/8" /><div className="h-56 rounded-xl bg-white/8" /></div></section></AppShell>;
  if (!employee) return <AppShell session={session}><section className="mx-auto max-w-6xl rounded-lg border border-red-400/25 bg-red-400/10 p-5 text-sm text-red-100">{message || "Employee not found."}</section></AppShell>;

  return <AppShell session={session}><section className="mx-auto max-w-6xl space-y-5">
    <Link href="/employees" className="inline-flex text-sm text-white/55 transition hover:text-[#f4c20d]">← Back to employees</Link>
    <header className="flex flex-col justify-between gap-4 rounded-xl border border-white/15 bg-[#111414] p-5 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">{employee.employeeNumber}</p><h1 className="mt-1 text-2xl font-semibold">{employee.firstName} {employee.lastName}</h1><p className="mt-1 text-sm text-white/55">{employee.jobTitle} · {employee.employeeType.replaceAll("_", " ")}</p></div><div className="flex flex-wrap gap-2"><Badge status={employee.status} />{canUpdate && <button onClick={() => setEditing((current) => !current)} className="rounded-md border border-white/20 px-3 py-2 text-sm font-medium transition hover:border-[#f4c20d] hover:text-[#f4c20d]">{editing ? "Cancel" : "Edit employee"}</button>}{canArchive && employee.status === "ACTIVE" && <button onClick={archiveEmployee} className="rounded-md bg-red-500/85 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500">Archive</button>}</div></header>
    {message && <p className="rounded-md border border-[#f4c20d]/30 bg-[#f4c20d]/10 px-3 py-2 text-sm text-[#ffe48a]">{message}</p>}
    {editing && <form onSubmit={updateEmployee} className="grid gap-3 rounded-xl border border-[#f4c20d]/30 bg-[#111414] p-5 sm:grid-cols-2 lg:grid-cols-3"><input required name="employeeNumber" defaultValue={employee.employeeNumber} className={field} /><input required name="firstName" defaultValue={employee.firstName} className={field} /><input required name="lastName" defaultValue={employee.lastName} className={field} /><input required name="phone" defaultValue={employee.phone} className={field} /><input name="email" type="email" defaultValue={employee.email ?? ""} placeholder="Email (optional)" className={field} /><input name="nationalId" defaultValue={employee.nationalId ?? ""} placeholder="National ID (optional)" className={field} /><input required name="jobTitle" defaultValue={employee.jobTitle} className={field} /><select name="employeeType" defaultValue={employee.employeeType} className={field}>{["GUARD", "SUPERVISOR", "MANAGER", "OFFICE_STAFF", "DRIVER", "OTHER"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select><input required name="basicSalary" inputMode="decimal" defaultValue={employee.basicSalary} className={field} /><input required name="dateJoined" type="date" defaultValue={employee.dateJoined.slice(0, 10)} className={field} /><select name="assignedSiteId" defaultValue={employee.assignedSiteId ?? ""} className={field}><option value="">No site assignment</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.client.name} — {site.name}</option>)}</select><select name="status" defaultValue={employee.status} className={field}>{["ACTIVE", "SUSPENDED", "TERMINATED", "INACTIVE"].map((status) => <option key={status} value={status}>{status}</option>)}</select><textarea name="notes" defaultValue={employee.notes ?? ""} placeholder="Notes (optional)" className={`${field} min-h-24 sm:col-span-2 lg:col-span-3`} /><button className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] sm:col-span-2 lg:col-span-3">Save employee changes</button></form>}
    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-white/15 bg-[#111414] p-5"><h2 className="font-semibold">Employment & deployment</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-white/45">Basic salary</dt><dd className="mt-1 font-semibold text-[#f4c20d]">{money(employee.basicSalary)}</dd></div><div><dt className="text-white/45">Date joined</dt><dd className="mt-1">{new Date(employee.dateJoined).toLocaleDateString()}</dd></div><div><dt className="text-white/45">Current site</dt><dd className="mt-1">{employee.assignedSite ? `${employee.assignedSite.client.name} — ${employee.assignedSite.name}` : "Not assigned"}</dd></div><div><dt className="text-white/45">Employee status</dt><dd className="mt-1"><Badge status={employee.status} /></dd></div></dl></section><section className="rounded-xl border border-white/15 bg-[#111414] p-5"><h2 className="font-semibold">Contact details</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-white/45">Phone</dt><dd className="mt-1">{employee.phone}</dd></div><div><dt className="text-white/45">Email</dt><dd className="mt-1 break-all">{employee.email ?? "Not recorded"}</dd></div><div className="sm:col-span-2"><dt className="text-white/45">Notes</dt><dd className="mt-1 whitespace-pre-wrap">{employee.notes || "No notes recorded."}</dd></div></dl></section></div>
    <div className="grid gap-4 lg:grid-cols-2"><section className="overflow-hidden rounded-xl border border-white/15 bg-[#111414]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Payroll history</h2><p className="mt-1 text-sm text-white/55">Recorded payroll only; this system does not send salary payments.</p></div><div className="divide-y divide-white/8">{history?.payrollItems.length ? history.payrollItems.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 p-4 text-sm"><div><p className="font-medium">{item.payrollRun.name}</p><p className="mt-1 text-xs text-white/50">Ending {new Date(item.payrollRun.periodEnd).toLocaleDateString()} · {item.payrollRun.status}</p></div><p className="font-semibold text-[#f4c20d]">{money(item.netPay)}</p></article>) : <p className="p-5 text-sm text-white/50">No payroll lines recorded yet.</p>}</div></section><section className="overflow-hidden rounded-xl border border-white/15 bg-[#111414]"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Advance history</h2><p className="mt-1 text-sm text-white/55">Advances and recoveries remain part of financial history.</p></div><div className="divide-y divide-white/8">{history?.advances.length ? history.advances.map((advance) => { const recovered = advance.recoveries.reduce((total, recovery) => total + Number(recovery.amount), 0); return <article key={advance.id} className="flex items-center justify-between gap-3 p-4 text-sm"><div><p className="font-medium">{advance.advanceNumber}</p><p className="mt-1 text-xs text-white/50">{new Date(advance.advanceDate).toLocaleDateString()} · {advance.status.replaceAll("_", " ")} · Recovered {money(recovered)}</p></div><p className="font-semibold text-[#f4c20d]">{money(advance.amount)}</p></article>; }) : <p className="p-5 text-sm text-white/50">No advances recorded yet.</p>}</div></section></div>
  </section></AppShell>;
}

export default function EmployeeDetailPage() { return <ProtectedPage>{(session) => <EmployeeDetail session={session} />}</ProtectedPage>; }
