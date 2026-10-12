"use client";

import Link from "next/link";
import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Site = { id: string; name: string; code: string; client: { name: string } };
type Employee = {
  id: string; employeeNumber: string; firstName: string; lastName: string; phone: string;
  email: string | null; nationalId: string | null; jobTitle: string; employeeType: string;
  basicSalary: string; status: string; dateJoined: string; assignedSiteId: string | null;
  assignedSite: Site | null; notes: string | null;
};
type Menu = { employee: Employee; top: number; right: number } | null;

const field = "field w-full";
const types = ["GUARD", "SUPERVISOR", "MANAGER", "OFFICE_STAFF", "DRIVER", "OTHER"] as const;
const statuses = ["ACTIVE", "SUSPENDED", "TERMINATED", "INACTIVE"] as const;

function Badge({ status }: { status: string }) {
  const style = status === "ACTIVE" ? "bg-[#f4c20d]/15 text-[#f4c20d]" : status === "SUSPENDED" || status === "TERMINATED" ? "bg-red-400/15 text-red-200" : "bg-white/10 text-white/55";
  return <span className={`rounded-full px-2 py-1 text-xs ${style}`}>{status.replaceAll("_", " ")}</span>;
}

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="block w-full px-3 py-2.5 text-left text-xs text-white/80 transition hover:bg-white/8 hover:text-[#f4c20d]">{children}</button>;
}

function EmployeeWorkspace({ session }: { session: AuthSession }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [message, setMessage] = useState("");
  const canCreate = session.permissions.includes("employees.create");
  const canUpdate = session.permissions.includes("employees.update");

  const load = async () => {
    try {
      const [people, activeSites] = await Promise.all([
        apiRequest<Employee[]>("/api/employees", session.token),
        apiRequest<Site[]>("/api/employees/sites", session.token),
      ]);
      setEmployees(people);
      setSites(activeSites);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load employee records.");
    }
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => employees.filter((employee) =>
    (type === "ALL" || employee.employeeType === type) &&
    (status === "ALL" || employee.status === status) &&
    `${employee.firstName} ${employee.lastName} ${employee.employeeNumber} ${employee.jobTitle} ${employee.phone} ${employee.email ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  ), [employees, search, status, type]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await apiRequest("/api/employees", session.token, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      form.reset();
      setCreateOpen(false);
      setMessage("Employee added. Salary is available for payroll; no payment was made.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add employee.");
    }
  };

  const saveEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await apiRequest(`/api/employees/${editing.id}`, session.token, { method: "PATCH", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      setEditing(null);
      setMessage("Employee details saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save employee details.");
    }
  };

  const openMenu = (employee: Employee, target: HTMLButtonElement) => {
    const rect = target.getBoundingClientRect();
    setMenu(menu?.employee.id === employee.id ? null : {
      employee,
      top: Math.min(window.innerHeight - 145, rect.bottom + 8),
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  const active = employees.filter((employee) => employee.status === "ACTIVE").length;
  const guards = employees.filter((employee) => employee.employeeType === "GUARD").length;

  return <AppShell session={session}><section className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Workforce</p><h1 className="mt-1 text-2xl font-semibold">Employees & Guards</h1><p className="mt-1 text-sm text-white/55">Keep staff records and payroll base salaries up to date.</p></div>
      {canCreate && <button onClick={() => setCreateOpen((value) => !value)} className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d]">{createOpen ? "Close form" : "Add employee"}</button>}
    </header>

    {message && <p role="status" className="rounded-md border border-[#f4c20d]/30 bg-[#f4c20d]/10 px-3 py-2 text-sm text-[#ffe48a]">{message}</p>}

    {createOpen && <form onSubmit={submit} className="grid gap-3 rounded-lg border border-white/15 bg-[#111414] p-4 sm:grid-cols-2 lg:grid-cols-3">
      <input name="employeeNumber" placeholder="Employee number (optional)" className={field} />
      <input required name="firstName" placeholder="First name" className={field} />
      <input required name="lastName" placeholder="Last name" className={field} />
      <input name="phone" type="tel" placeholder="Phone (optional)" className={field} />
      <input name="email" type="email" placeholder="Email (optional)" className={field} />
      <input name="jobTitle" placeholder="Job title (optional)" className={field} />
      <select required name="employeeType" className={field}>{types.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
      <input required name="basicSalary" inputMode="decimal" placeholder="Basic salary (MWK)" className={field} />
      <label className="space-y-1.5 text-sm text-white/70"><span>Hire date</span><input required type="date" name="dateJoined" className={field} /></label>
      <select name="assignedSiteId" className={field}><option value="">Assign site (optional)</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.client.name} — {site.name}</option>)}</select>
      <select name="status" className={field}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="INACTIVE">Inactive</option></select>
      <textarea name="notes" placeholder="Notes (optional)" className="field min-h-20 sm:col-span-2 lg:col-span-3" />
      <button className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-semibold text-[#0d0d0d] sm:col-span-2 lg:col-span-3">Add employee</button>
    </form>}

    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-lg border border-white/15 bg-[#111414] p-4"><p className="text-sm text-white/55">Total employees</p><p className="mt-2 text-3xl font-semibold">{employees.length}</p></article>
      <article className="rounded-lg border border-white/15 bg-[#111414] p-4"><p className="text-sm text-white/55">Active employees</p><p className="mt-2 text-3xl font-semibold text-[#f4c20d]">{active}</p></article>
      <article className="rounded-lg border border-white/15 bg-[#111414] p-4"><p className="text-sm text-white/55">Security guards</p><p className="mt-2 text-3xl font-semibold">{guards}</p></article>
    </div>

    <section className="rounded-lg border border-white/15 bg-[#111414]">
      <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-[1fr_auto_auto]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names, numbers, or contacts" className="field min-w-0" />
        <select value={type} onChange={(event) => setType(event.target.value)} className="field"><option value="ALL">All types</option>{types.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="field"><option value="ALL">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      </div>
      <div className="overflow-x-auto"><table className="min-w-[870px] w-full text-left text-sm">
        <thead className="bg-white/[.03] text-xs uppercase text-white/45"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Position</th><th className="px-4 py-3">Salary</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Hire date</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
        <tbody>{visible.map((employee) => {
          const phone = employee.phone.replace(/\D/g, "");
          const hasPhone = employee.phone !== "Not provided" && phone.length >= 5;
          return <tr key={employee.id} className="border-t border-white/8">
            <td className="px-4 py-3"><Link href={`/employees/${employee.id}`} className="font-medium hover:text-[#f4c20d]">{employee.firstName} {employee.lastName}</Link><p className="text-xs text-white/50">{employee.employeeNumber}{hasPhone ? ` · ${employee.phone}` : ""}</p></td>
            <td className="px-4 py-3">{employee.jobTitle}<p className="text-xs text-white/50">{employee.employeeType.replaceAll("_", " ")}</p></td>
            <td className="px-4 py-3">MWK {Number(employee.basicSalary).toLocaleString()}</td>
            <td className="px-4 py-3"><Badge status={employee.status} /></td>
            <td className="px-4 py-3 text-white/55">{new Date(employee.dateJoined).toLocaleDateString()}</td>
            <td className="px-4 py-3"><div className="flex items-center justify-end gap-1.5">
              {hasPhone && <a href={`tel:${phone}`} aria-label={`Call ${employee.firstName} ${employee.lastName}`} className="grid h-8 w-8 place-items-center rounded-md border border-white/15 text-white/65 hover:border-[#f4c20d] hover:text-[#f4c20d]">☎</a>}
              {hasPhone && <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${employee.firstName} ${employee.lastName}`} className="grid h-8 w-8 place-items-center rounded-md border border-white/15 text-white/65 hover:border-[#f4c20d] hover:text-[#f4c20d]">◌</a>}
              {employee.email && <a href={`mailto:${employee.email}`} aria-label={`Email ${employee.firstName} ${employee.lastName}`} className="grid h-8 w-8 place-items-center rounded-md border border-white/15 text-white/65 hover:border-[#f4c20d] hover:text-[#f4c20d]">✉</a>}
              <Link href={`/employees/${employee.id}`} className="ml-1 rounded-md border border-white/20 px-3 py-2 text-xs font-bold hover:border-[#f4c20d] hover:text-[#f4c20d]">View</Link>
              <button onClick={(event) => openMenu(employee, event.currentTarget)} aria-label={`Open actions for ${employee.firstName} ${employee.lastName}`} aria-expanded={menu?.employee.id === employee.id} className="grid h-8 w-8 place-items-center rounded-md border border-white/20 text-lg leading-none hover:border-[#f4c20d] hover:text-[#f4c20d]">⋮</button>
            </div></td>
          </tr>;
        })}{!visible.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/50">No employees match the current filters.</td></tr>}</tbody>
      </table></div>
    </section>

    {menu && <><button onClick={() => setMenu(null)} aria-label="Close employee actions" className="fixed inset-0 z-[90] cursor-default bg-transparent" /><div style={{ top: menu.top, right: menu.right }} className="fixed z-[100] w-44 overflow-hidden rounded-lg border border-white/15 bg-[#171919] py-1 shadow-2xl"><Link href={`/employees/${menu.employee.id}`} onClick={() => setMenu(null)} className="block px-3 py-2.5 text-xs text-white/80 hover:bg-white/8 hover:text-[#f4c20d]">View details</Link>{canUpdate && <ActionButton onClick={() => { setEditing(menu.employee); setMenu(null); }}>Edit employee</ActionButton>}</div></>}

    {editing && <section className="rounded-xl border border-[#f4c20d]/30 bg-[#111414] p-5">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">Employee record</p><h2 className="mt-1 text-xl font-semibold">Edit {editing.firstName} {editing.lastName}</h2></div><button onClick={() => setEditing(null)} className="rounded-md border border-white/20 px-3 py-2 text-sm">Close</button></div>
      <form onSubmit={saveEmployee} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input name="employeeNumber" defaultValue={editing.employeeNumber} placeholder="Employee number (optional)" className={field} />
        <input required name="firstName" defaultValue={editing.firstName} className={field} />
        <input required name="lastName" defaultValue={editing.lastName} className={field} />
        <input name="phone" type="tel" defaultValue={editing.phone === "Not provided" ? "" : editing.phone} placeholder="Phone (optional)" className={field} />
        <input name="email" type="email" defaultValue={editing.email ?? ""} placeholder="Email (optional)" className={field} />
        <input name="jobTitle" defaultValue={editing.jobTitle === "Not specified" ? "" : editing.jobTitle} placeholder="Job title (optional)" className={field} />
        <select name="employeeType" defaultValue={editing.employeeType} className={field}>{types.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
        <input required name="basicSalary" inputMode="decimal" defaultValue={editing.basicSalary} className={field} />
        <label className="space-y-1.5 text-sm text-white/70"><span>Hire date</span><input required type="date" name="dateJoined" defaultValue={editing.dateJoined.slice(0, 10)} className={field} /></label>
        <select name="assignedSiteId" defaultValue={editing.assignedSiteId ?? ""} className={field}><option value="">Assign site (optional)</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.client.name} — {site.name}</option>)}</select>
        <select name="status" defaultValue={editing.status} className={field}>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <textarea name="notes" defaultValue={editing.notes ?? ""} placeholder="Notes (optional)" className="field min-h-20 sm:col-span-2 lg:col-span-3" />
        <button className="rounded-md bg-[#f4c20d] px-4 py-2.5 text-sm font-bold text-[#0d0d0d] sm:col-span-2 lg:col-span-3">Save employee changes</button>
      </form>
    </section>}
  </section></AppShell>;
}

export default function EmployeesPage() {
  return <ProtectedPage>{(session) => <EmployeeWorkspace session={session} />}</ProtectedPage>;
}
