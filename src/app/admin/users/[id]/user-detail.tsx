"use client";

import Link from "next/link";
import { useState } from "react";
import { ALL_PERMISSIONS, PERMISSION_LABEL, ReadOnlyNote, usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-styles";
import { CaseStatusChip, HueChip, Status, Tag } from "@/components/ui/chips";
import { Avatar } from "@/components/ui/domain";
import { Field, Input, Switch, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/overlays";
import { Empty, Meter, Metric, Note, Section, Skeleton } from "@/components/ui/panels";
import { useAdminWork } from "@/lib/admin-work";
import { formatDate } from "@/lib/clock";
import type { getUserDetail } from "@/lib/data/admin";
import { countryName } from "@/mocks/countries";
import type { AdminPermission } from "@/types";

type Data = Awaited<ReturnType<typeof getUserDetail>>;
const ROLE = { admin: ["violet", "Admin"], counselor: ["teal", "Counselor"], student: ["blue", "Student"] } as const;

export function UserDetail({ admin, id, data }: { admin: AdminIdentity; id: string; data: Data }) {
  const w = useAdminWork(admin.id);
  const perm = usePermissions(admin);
  const canManage = perm.can("users.manage");
  const [toggling, setToggling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [threshold, setThreshold] = useState<string | null>(null);

  if (!w.ready) return <Skeleton className="h-96" />;
  const invited = w.work.invited.find((u) => u.id === id);
  const user = data?.user ?? (invited ? { id, name: invited.name, email: invited.email, role: invited.role, active: true, detail: "Invitation sent" } : null);
  if (!user) {
    return <Section><Empty title="No such account" action={<Link href="/admin/users" className={buttonClass("secondary", "sm")}>Back to users</Link>}>
      It may have been created in another browser. In this demo, new accounts live in the browser that created them.</Empty></Section>;
  }

  const patch = w.work.users[id] ?? {};
  const active = patch.active ?? user.active;
  const self = id === admin.id;
  const basePerms = (data?.admin?.permissions ?? []) as AdminPermission[];
  const perms = patch.permissions ?? basePerms;
  const absent = patch.absent ?? data?.counselor?.absent ?? false;
  const limit = patch.threshold ?? data?.counselor?.threshold ?? 20;
  const localActivity = w.work.audit.filter((e) => e.recordId === id || e.actorId === id || (data?.student && e.recordId === data.student.caseId)).map((e) => ({
    id: e.id, at: e.at, text: `${e.actorId === admin.id ? "You" : e.actorId}: ${e.action.replace(/[._]/g, " ")}`, reason: e.reason, local: true,
  }));
  const activity = [...localActivity, ...(data?.activity ?? []).map((a) => ({ ...a, local: false }))].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  const confirm = () => {
    if (reason.trim().length < 5) { setError("Record why. It is kept in the audit history."); return; }
    w.setUserActive(id, user.name, !active, reason.trim());
    setToggling(false);
  };
  const togglePerm = (p: AdminPermission, on: boolean) => w.setPermissions(id, perms, on ? [...perms, p] : perms.filter((x) => x !== p));

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-tiny text-n-500"><Link href="/admin/users" className="hover:text-n-100">Users and access</Link> <span aria-hidden>/</span> {user.name}</nav>
      <header className="flex flex-wrap items-center gap-4 border-b border-line pb-5">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold text-n-100">{user.name}</h1>
          <p className="truncate text-sm text-n-400">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HueChip hue={ROLE[user.role][0]}>{ROLE[user.role][1]}</HueChip>
          {invited ? <Status tone="info">Invited</Status> : active ? <Status tone="ok">Active</Status> : <Status tone="neutral">Deactivated</Status>}
          {!self && !invited && (
            <Button variant={active ? "secondary" : "primary"} disabled={!canManage} title={canManage ? undefined : perm.why("users.manage")}
              onClick={() => { setToggling(true); setReason(""); setError(undefined); }}>{active ? "Deactivate" : "Reactivate"}</Button>
          )}
        </div>
      </header>
      {!canManage && <ReadOnlyNote perm="users.manage" />}
      {!active && <Note title="This account is deactivated">They cannot sign in. Everything they did and everything about them is still on record.</Note>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {data?.student && (
            <Section title="Case" actions={<Link href={`/admin/students?case=${data.student.caseId}`} className="text-tiny font-medium text-link hover:underline">Open case</Link>}>
              <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Metric label="Status" value={<CaseStatusChip status={w.work.cases[data.student.caseId]?.status ?? data.student.status} />} />
                <Metric label="Package" value={<span className="text-base">{data.student.packageName}</span>} />
                <Metric label="Counselor" value={<span className="text-base">{data.student.counselorName ?? "Unassigned"}</span>} />
                <Metric label="Profile" value={data.student.completion != null ? `${data.student.completion}%` : "n/a"} />
              </dl>
              <p className="mt-3 text-tiny tabular-nums text-n-500">Opened {formatDate(data.student.createdAt)} · {data.student.activatedAt ? `activated ${formatDate(data.student.activatedAt)}` : "not activated"} · payment {data.student.paymentConfirmed ? "confirmed" : "not confirmed"}</p>
            </Section>
          )}

          {data?.counselor && (
            <Section title="Workload and availability" description="Mark a counselor away so they get no new students and their cases are flagged for cover.">
              <Meter label="Active cases" value={data.counselor.activeCases} max={limit} tone="load" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm text-n-200">
                  <Switch label="Away" checked={absent} disabled={!canManage} onChange={(v) => w.setCounselor(id, { absent: v }, { absent })} />
                  {absent ? "Away: no new assignments" : "Available for new students"}
                </label>
                {threshold === null ? (
                  <Button size="sm" disabled={!canManage} onClick={() => setThreshold(String(limit))}>Change limit ({limit})</Button>
                ) : (
                  <form className="flex items-end gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    const n = Number(threshold);
                    if (!Number.isInteger(n) || n < 1 || n > 200) return;
                    w.setCounselor(id, { threshold: n }, { threshold: limit }); setThreshold(null);
                  }}>
                    <Field label="Workload limit" hint="Whole number, 1 to 200"><Input data-autofocus inputMode="numeric" className="w-24" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></Field>
                    <Button type="submit" size="sm" variant="primary">Save</Button><Button size="sm" variant="ghost" onClick={() => setThreshold(null)}>Cancel</Button>
                  </form>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.counselor.languages.map((l) => <Tag key={l}>{l}</Tag>)}
                {data.counselor.expertise.map((c) => <Tag key={c}>{countryName(c)}</Tag>)}
              </div>
            </Section>
          )}

          {user.role === "admin" && (
            <Section title="Permissions" description="Each permission is granted on its own. A limited administrator does not get everything.">
              {self && <Note className="mb-3">You cannot change your own permissions. Ask another administrator.</Note>}
              <ul className="divide-y divide-line">
                {ALL_PERMISSIONS.map((p) => (
                  <li key={p} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm text-n-200">{PERMISSION_LABEL[p]}</span>
                    <Switch label={PERMISSION_LABEL[p]} checked={perms.includes(p)} disabled={!canManage || self} onChange={(v) => togglePerm(p, v)} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <Section title="Activity" description="Account and case history. Changes you make here are added at the top." flush>
          {activity.length === 0 ? <Empty title="No recorded activity yet" /> : (
            <ul className="divide-y divide-line">
              {activity.slice(0, 25).map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <p className="text-sm text-n-100">{a.text}</p>
                  {a.reason && <p className="text-tiny text-n-400">“{a.reason}”</p>}
                  <p className="text-tiny tabular-nums text-n-500">{formatDate(a.at)}{a.local && " · this browser"}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Sheet open={toggling} onClose={() => setToggling(false)} title={active ? `Deactivate ${user.name}` : `Reactivate ${user.name}`}
        description={active ? "They lose access immediately. Their records and history are kept." : "They can sign in again."}
        footer={<><Button variant="ghost" onClick={() => setToggling(false)}>Cancel</Button><Button variant={active ? "danger" : "primary"} onClick={confirm}>{active ? "Deactivate" : "Reactivate"}</Button></>}>
        <Field label="Reason" required error={error}><Textarea data-autofocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Sheet>
    </div>
  );
}
