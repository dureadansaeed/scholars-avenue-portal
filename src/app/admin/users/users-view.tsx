"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ALL_PERMISSIONS, PERMISSION_LABEL, ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { CaseStatusChip, HueChip, Status } from "@/components/ui/chips";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Note, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { useAdminWork } from "@/lib/admin-work";
import type { UserRow } from "@/lib/data/admin";
import type { AdminPermission, Role } from "@/types";

const PAGE = 15;
const ROLE: Record<Role, [React.ComponentProps<typeof HueChip>["hue"], string]> = {
  admin: ["violet", "Admin"], counselor: ["teal", "Counselor"], student: ["blue", "Student"],
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Row = UserRow & { invited?: boolean };

export function UsersView({ admin, rows, packages, countries }: {
  admin: AdminIdentity; rows: UserRow[]; packages: { id: string; name: string }[]; countries: { code: string; name: string }[];
}) {
  const w = useAdminWork(admin.id);
  const perm = usePermissions(admin);
  const canManage = perm.can("users.manage");
  const [role, setRole] = useState<"all" | Role>("all");
  const [state, setState] = useState<"all" | "active" | "inactive">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<Row | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [inviting, setInviting] = useState<null | "staff" | "student">(null);
  const [toast, setToast] = useState<string | null>(null);

  const all: Row[] = useMemo(() => [
    ...rows.map((r) => ({ ...r, active: w.work.users[r.id]?.active ?? r.active, absent: w.work.users[r.id]?.absent ?? r.absent })),
    ...w.work.invited.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: true, invited: true, detail: "Invitation sent" })),
  ], [rows, w.work.users, w.work.invited]);

  const needle = q.trim().toLowerCase();
  const filtered = all.filter((r) => (role === "all" || r.role === role) && (state === "all" || (state === "active") === r.active)
    && (!needle || `${r.name} ${r.email}`.toLowerCase().includes(needle)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE, current * PAGE);
  const count = (r: Role) => all.filter((x) => x.role === r).length;
  const reset = (fn: () => void) => { fn(); setPage(1); };

  const confirmToggle = () => {
    if (!toggling) return;
    if (reason.trim().length < 5) { setReasonError("Record why. It is kept in the audit history."); return; }
    w.setUserActive(toggling.id, toggling.name, !toggling.active, reason.trim());
    setToast(`${toggling.name} was ${toggling.active ? "deactivated. They can no longer sign in; their records and history are kept." : "reactivated and can sign in again."}`);
    setToggling(null);
  };

  return (
    <div className="space-y-4">
      {!canManage && <ReadOnlyNote perm="users.manage" />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Role" size="sm" value={role} onChange={(v) => reset(() => setRole(v))}
          options={[{ value: "all", label: "Everyone", count: all.length }, { value: "student", label: "Students", count: count("student") },
            { value: "counselor", label: "Counselors", count: count("counselor") }, { value: "admin", label: "Admins", count: count("admin") }]} />
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={!canManage} title={canManage ? undefined : perm.why("users.manage")} onClick={() => setInviting("staff")}><Icon.Plus className="size-4" />Invite staff</Button>
          <Button variant="primary" disabled={!canManage} title={canManage ? undefined : perm.why("users.manage")} onClick={() => setInviting("student")}><Icon.Plus className="size-4" />Create student</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="search">
        <Input type="search" aria-label="Search users" placeholder="Search name or email" className="max-w-64" value={q} onChange={(e) => reset(() => setQ(e.target.value))} />
        <Select aria-label="Account state" className="w-auto" value={state} onChange={(e) => reset(() => setState(e.target.value as typeof state))}>
          <option value="all">Active and inactive</option><option value="active">Active only</option><option value="inactive">Inactive only</option>
        </Select>
      </div>
      {toast && <Note tone="ok" action={<button type="button" className="text-tiny opacity-60 hover:opacity-100" onClick={() => setToast(null)}>Dismiss</button>}>{toast}</Note>}

      <Section flush>
        {filtered.length === 0 ? <Empty title="No accounts match">Try another role or clear the search.</Empty> : (
          <Table className="max-h-none">
            <colgroup><col className="w-[30%]" /><col className="w-[13%]" /><col className="w-[17%]" /><col className="w-[24%]" /><col className="w-[16%]" /></colgroup>
            <THead><TH>Name</TH><TH>Role</TH><TH>Account</TH><TH>Details</TH><TH><span className="sr-only">Actions</span></TH></THead>
            <tbody>
              {shown.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/admin/users/${r.id}`} className="block truncate text-sm font-medium text-n-100 hover:underline">{r.name}</Link>
                    <p className="truncate text-n-500">{r.email}</p>
                  </TD>
                  <TD><HueChip hue={ROLE[r.role][0]}>{ROLE[r.role][1]}</HueChip></TD>
                  <TD>
                    {r.invited ? <Status tone="info">Invited</Status> : r.active ? <Status tone="ok">Active</Status> : <Status tone="neutral">Deactivated</Status>}
                    {r.absent && r.active && <p className="mt-1"><Status tone="warn">Away</Status></p>}
                  </TD>
                  <TD>
                    {r.role === "student" && r.caseStatus ? <><CaseStatusChip status={r.caseStatus} /><p className="mt-1 truncate text-n-500">{r.counselorName ?? "No counselor"} · {r.detail}</p></> : <span className="text-n-400">{r.detail}</span>}
                  </TD>
                  <TD className="text-right">
                    {r.id === admin.id ? <span className="text-n-500">You</span> : !r.invited && (
                      <Button size="sm" variant={r.active ? "ghost" : "secondary"} disabled={!canManage} title={canManage ? undefined : perm.why("users.manage")}
                        onClick={() => { setToggling(r); setReason(""); setReasonError(undefined); }}>{r.active ? "Deactivate" : "Reactivate"}</Button>
                    )}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
        {filtered.length > PAGE && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-tiny text-n-400">
            <span className="tabular-nums">{(current - 1) * PAGE + 1} to {Math.min(current * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2"><Button size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button><Button size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button></div>
          </div>
        )}
      </Section>

      <Sheet open={!!toggling} onClose={() => setToggling(null)} title={toggling?.active ? `Deactivate ${toggling?.name}` : `Reactivate ${toggling?.name}`}
        description={toggling?.active ? "They lose access immediately. Their records, documents and history are kept and stay visible to staff." : "They can sign in again with their existing account."}
        footer={<><Button variant="ghost" onClick={() => setToggling(null)}>Cancel</Button><Button variant={toggling?.active ? "danger" : "primary"} onClick={confirmToggle}>{toggling?.active ? "Deactivate" : "Reactivate"}</Button></>}>
        <div className="space-y-4">
          {toggling?.role === "counselor" && toggling.active && <Note tone="warn" title="Check their cases">Their active cases stay assigned to them until you reassign them from Counselors.</Note>}
          <Field label="Reason" required error={reasonError}><Textarea data-autofocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        </div>
      </Sheet>

      {inviting && (
        <InviteSheet kind={inviting} existingEmails={all.map((r) => r.email.toLowerCase())} packages={packages} countries={countries} onClose={() => setInviting(null)}
          onDone={(name, kind) => { setInviting(null); setToast(kind === "student" ? `${name} was created with an invited case. They appear under Students and cases, waiting for activation and a counselor.` : `An invitation was sent to ${name}.`); }}
          onSubmit={(u, extra, perms) => { const id = w.invite(u, extra); if (u.role === "admin" && perms.length) w.setPermissions(id, [], perms, "Set at invitation"); }} />
      )}
    </div>
  );
}

function InviteSheet({ kind, existingEmails, packages, countries, onClose, onSubmit, onDone }: {
  kind: "staff" | "student"; existingEmails: string[]; packages: { id: string; name: string }[]; countries: { code: string; name: string }[];
  onClose: () => void; onDone: (name: string, kind: "staff" | "student") => void;
  onSubmit: (u: { name: string; email: string; role: Role }, extra: { packageId: string; countries: string[] } | undefined, perms: AdminPermission[]) => void;
}) {
  const [f, setF] = useState({ name: "", email: "", role: "counselor" as Role, packageId: packages[0]?.id ?? "", countries: [] as string[] });
  const [perms, setPerms] = useState<AdminPermission[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Enter their full name.";
    if (!EMAIL.test(f.email.trim())) e.email = "Enter a valid email address.";
    else if (existingEmails.includes(f.email.trim().toLowerCase())) e.email = "An account with this email already exists. Each person has one account.";
    if (kind === "student" && !f.packageId) e.packageId = "Choose the package they bought.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ name: f.name.trim(), email: f.email.trim(), role: kind === "student" ? "student" : f.role }, kind === "student" ? { packageId: f.packageId, countries: f.countries } : undefined, perms);
    onDone(f.name.trim(), kind);
  };

  return (
    <Sheet open onClose={onClose} title={kind === "student" ? "Create a student" : "Invite staff"}
      description={kind === "student" ? "Creates the account and an invited case. Activate it once the package is paid." : "They get an email to set their password. Nothing is sent in this demo."}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>{kind === "student" ? "Create student" : "Send invitation"}</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name}><Input data-autofocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email" required error={errors.email} hint="Used to sign in. Must be unique."><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
        {kind === "staff" ? (
          <>
            <Field label="Role" required>
              <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}><option value="counselor">Counselor</option><option value="admin">Administrator</option></Select>
            </Field>
            {f.role === "admin" && (
              <fieldset className="space-y-2 rounded-md border border-line bg-raised p-4">
                <legend className="px-1 text-micro font-medium tracking-wide text-n-400 uppercase">Permissions</legend>
                <p className="text-tiny text-n-500">Give only what they need. A new administrator starts with none.</p>
                {ALL_PERMISSIONS.map((p) => (
                  <Checkbox key={p} label={PERMISSION_LABEL[p]} checked={perms.includes(p)} onChange={(e) => setPerms((x) => (e.target.checked ? [...x, p] : x.filter((y) => y !== p)))} />
                ))}
              </fieldset>
            )}
          </>
        ) : (
          <>
            <Field label="Package" required error={errors.packageId}>
              <Select value={f.packageId} onChange={(e) => setF({ ...f, packageId: e.target.value })}>{packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            </Field>
            <fieldset>
              <legend className="mb-2 text-micro font-medium tracking-wide text-n-400 uppercase">Target countries <span className="normal-case tracking-normal text-n-500">Optional; the student can set these</span></legend>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {countries.map((c) => (
                  <Checkbox key={c.code} label={c.name} checked={f.countries.includes(c.code)}
                    onChange={(e) => setF({ ...f, countries: e.target.checked ? [...f.countries, c.code] : f.countries.filter((x) => x !== c.code) })} />
                ))}
              </div>
            </fieldset>
          </>
        )}
      </div>
    </Sheet>
  );
}
