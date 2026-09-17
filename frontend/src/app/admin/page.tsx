"use client";

import { type FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { apiRequest, type AuthSession } from "@/lib/auth";

type Permission = { id: string; key: string; description: string };
type Role = { id: string; name: string; description: string | null; isSystemRole: boolean; permissions: { permission: Permission }[]; _count: { users: number } };
type User = { id: string; firstName: string; lastName: string; email: string; isActive: boolean; isRegistered: boolean; roles: { role: Role }[] };

function AdminWorkspace({ session }: { session: AuthSession }) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [userData, roleData, permissionData] = await Promise.all([
        apiRequest<User[]>("/api/admin/users", session.token),
        apiRequest<Role[]>("/api/admin/roles", session.token),
        apiRequest<Permission[]>("/api/admin/permissions", session.token),
      ]);
      setUsers(userData); setRoles(roleData); setPermissions(permissionData);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load administration data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const provision = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!selectedRoleIds.length) { setMessage("Select at least one role before adding the user."); return; }
    const form = new FormData(formElement);
    try {
      await apiRequest("/api/admin/users", session.token, { method: "POST", body: JSON.stringify({ firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), roleIds: selectedRoleIds }) });
      formElement.reset(); setSelectedRoleIds([]); setMessage("User added. They can now choose Create account and set their password."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not add user."); }
  };

  const createRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await apiRequest("/api/admin/roles", session.token, { method: "POST", body: JSON.stringify({ name: form.get("name"), description: form.get("description") }) });
      formElement.reset(); setMessage("Role created. You can assign permissions below."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create role."); }
  };

  const savePermissions = async (roleId: string, form: HTMLFormElement) => {
    try {
      await apiRequest(`/api/admin/roles/${roleId}/permissions`, session.token, { method: "PUT", body: JSON.stringify({ permissionIds: new FormData(form).getAll("permissionIds").map(String) }) });
      setMessage("Role permissions saved."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update permissions."); }
  };

  const toggleUser = async (user: User) => {
    try {
      await apiRequest(`/api/admin/users/${user.id}/status`, session.token, { method: "PATCH", body: JSON.stringify({ isActive: !user.isActive }) });
      setMessage(`User ${user.isActive ? "deactivated" : "activated"}.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update user."); }
  };

  const toggleRole = (roleId: string) => setSelectedRoleIds((current) => current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]);

  return <AppShell session={session}><div className="mx-auto max-w-7xl space-y-4"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f4c20d]">System administration</p><h1 className="mt-1 text-2xl font-semibold">Users, roles & permissions</h1><p className="mt-1 text-sm text-white/55">Add staff access before they create their account.</p></header>{message && <p role="status" className="rounded-md border border-[#f4c20d]/30 bg-[#f4c20d]/10 px-3 py-2 text-sm text-[#ffe48a]">{message}</p>}<div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><section className="rounded-lg border border-white/15 bg-[#111414] p-4"><h2 className="font-semibold">Add user</h2><form onSubmit={provision} className="mt-4 grid gap-3 sm:grid-cols-2"><input required name="firstName" placeholder="First name" className="field" /><input required name="lastName" placeholder="Last name" className="field" /><input required type="email" name="email" placeholder="Work email" className="field sm:col-span-2" /><div className="sm:col-span-2"><p className="mb-2 text-xs text-white/55">Choose role{selectedRoleIds.length === 1 ? "" : "s"}</p><div className="flex flex-wrap gap-2">{roles.map((role) => { const selected = selectedRoleIds.includes(role.id); return <button key={role.id} type="button" onClick={() => toggleRole(role.id)} aria-pressed={selected} className={`rounded-md border px-3 py-2 text-xs font-medium transition ${selected ? "border-[#f4c20d] bg-[#f4c20d] text-[#0d0d0d] shadow-[0_3px_12px_rgba(244,194,13,.18)]" : "border-white/15 text-white/70 hover:border-[#f4c20d]/60 hover:text-white"}`}>{selected && <span className="mr-1">✓</span>}{role.name}</button>; })}</div></div><button className="rounded-md bg-[#f4c20d] px-4 py-2 text-sm font-semibold text-[#0d0d0d] transition hover:bg-[#ffd52c] sm:col-span-2">Add user</button></form></section><section className="rounded-lg border border-white/15 bg-[#111414] p-4"><h2 className="font-semibold">Create role</h2><form onSubmit={createRole} className="mt-4 space-y-3"><input required name="name" placeholder="e.g. Finance Officer" className="field w-full" /><input name="description" placeholder="Optional description" className="field w-full" /><button className="rounded border border-[#f4c20d]/70 px-4 py-2 text-sm font-semibold text-[#f4c20d] transition hover:bg-[#f4c20d]/10">Create role</button></form></section></div><section className="overflow-hidden rounded-lg border border-white/15 bg-[#111414]"><div className="border-b border-white/10 px-4 py-3"><h2 className="font-semibold">User access</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-white/[.03] text-xs uppercase text-white/45"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3">Account</th><th className="px-4 py-3" /></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-white/8"><td className="px-4 py-3"><p className="font-medium">{user.firstName} {user.lastName}</p><p className="text-xs text-white/50">{user.email}</p></td><td className="px-4 py-3 text-xs text-white/75">{user.roles.map(({ role }) => role.name).join(", ")}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${user.isActive ? "bg-lime-500/15 text-lime-300" : "bg-red-500/15 text-red-300"}`}>{user.isRegistered ? "Account created" : "Create account"}</span></td><td className="px-4 py-3"><button onClick={() => void toggleUser(user)} className="text-xs text-[#f4c20d]">{user.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}{!loading && users.length === 0 && <tr><td className="px-4 py-5 text-sm text-white/50" colSpan={4}>No user profiles yet.</td></tr>}</tbody></table></div></section><section className="space-y-3"><div><h2 className="font-semibold">Role permissions</h2><p className="text-sm text-white/55">Permissions apply immediately to every active user with this role.</p></div>{roles.map((role) => <form key={role.id} onSubmit={(event) => { event.preventDefault(); void savePermissions(role.id, event.currentTarget); }} className="rounded-lg border border-white/15 bg-[#111414] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-medium">{role.name} {role.isSystemRole && <span className="ml-1 text-xs text-[#f4c20d]">Protected</span>}</h3><p className="text-xs text-white/50">{role._count.users} assigned user(s)</p></div><button className="rounded border border-[#f4c20d]/70 px-3 py-1.5 text-xs font-semibold text-[#f4c20d]">Save permissions</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{permissions.map((permission) => <label key={permission.id} className="flex items-center gap-2 rounded border border-white/10 px-2 py-2 text-xs text-white/75"><input type="checkbox" name="permissionIds" value={permission.id} defaultChecked={role.permissions.some(({ permission: assigned }) => assigned.id === permission.id)} className="accent-[#f4c20d]" />{permission.key}</label>)}</div></form>)}</section></div></AppShell>;
}

export default function AdminPage() { return <ProtectedPage>{(session) => <AdminWorkspace session={session} />}</ProtectedPage>; }
