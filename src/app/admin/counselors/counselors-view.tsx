"use client";

import Link from "next/link";
import { usePermissions, type AdminIdentity } from "@/components/admin/permissions";
import { buttonClass } from "@/components/ui/button-styles";
import { CaseStatusChip, Status, Tag } from "@/components/ui/chips";
import { Avatar } from "@/components/ui/domain";
import { Switch } from "@/components/ui/form";
import { Meter, Note, Section } from "@/components/ui/panels";
import { cx } from "@/lib/cx";
import { countryName } from "@/mocks/countries";
import type { CasesData } from "../students/use-cases";
import { CLOSED, useCases } from "../students/use-cases";

export function CounselorsView({ admin, data }: { admin: AdminIdentity; data: CasesData }) {
  const { w, cases, counselors } = useCases(admin.id, data);
  const perm = usePermissions(admin);
  const canManage = perm.can("users.manage");
  const unassigned = cases.filter((c) => !c.counselorId && !CLOSED.includes(c.status)).length;
  const needCover = counselors.filter((c) => (!c.active || c.absent) && c.activeCases > 0);

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-4">
        <div><dt className="text-micro font-medium tracking-wide text-n-500 uppercase">Available</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-n-100">{counselors.filter((c) => c.active && !c.absent).length}</dd></div>
        <div><dt className="text-micro font-medium tracking-wide text-n-500 uppercase">Away or inactive</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-n-100">{counselors.filter((c) => !c.active || c.absent).length}</dd></div>
        <div><dt className="text-micro font-medium tracking-wide text-n-500 uppercase">Unassigned cases</dt><dd className={cx("mt-1 text-lg font-semibold tabular-nums", unassigned ? "text-warn-400" : "text-n-100")}>{unassigned}</dd></div>
        <div><dt className="text-micro font-medium tracking-wide text-n-500 uppercase">Cases needing cover</dt><dd className={cx("mt-1 text-lg font-semibold tabular-nums", needCover.length ? "text-warn-400" : "text-n-100")}>{needCover.reduce((n, c) => n + c.activeCases, 0)}</dd></div>
      </dl>
      {unassigned > 0 && <Note tone="warn" title={`${unassigned} case${unassigned > 1 ? "s" : ""} without a counselor`} action={<Link href="/admin/students?view=unassigned" className={buttonClass("secondary", "sm")}>Assign</Link>}>Students wait until someone is assigned.</Note>}

      <ul className="space-y-4">
        {counselors.map((c) => {
          const flagged = (!c.active || c.absent) && c.activeCases > 0;
          const mine = cases.filter((x) => c.caseIds.includes(x.id));
          return (
            <li key={c.id} id={c.id} className="scroll-mt-20">
              <Section title={<span className="flex items-center gap-3"><Avatar name={c.name} size="sm" />{c.name}</span>}
                description={c.email}
                actions={<>
                  {!c.active ? <Status tone="neutral">Inactive</Status> : c.absent ? <Status tone="warn">Away</Status> : <Status tone="ok">Available</Status>}
                  <Link href={`/admin/users/${c.id}`} className="text-tiny font-medium text-link hover:underline">Account</Link>
                </>}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Meter label="Active cases" value={c.activeCases} max={c.threshold} tone="load" />
                    {c.activeCases > c.threshold && <p className="mt-1.5 text-tiny text-bad-400">Over the limit by {c.activeCases - c.threshold}.</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">{c.languages.map((l) => <Tag key={l}>{l}</Tag>)}{c.expertise.map((x) => <Tag key={x}>{countryName(x)}</Tag>)}</div>
                  </div>
                  {c.active && (
                    <label className="flex items-center gap-3 self-start text-sm text-n-200" title={canManage ? undefined : perm.why("users.manage")}>
                      <Switch label={`${c.name} away`} checked={c.absent} disabled={!canManage} onChange={(v) => w.setCounselor(c.id, { absent: v }, { absent: c.absent })} />
                      {c.absent ? "Away: gets no new students" : "Available for new students"}
                    </label>
                  )}
                </div>
                {flagged && (
                  <div className="mt-4 rounded-md border border-warn-400/25 bg-warn-tint p-3">
                    <p className="text-sm font-medium text-n-100">{mine.length} case{mine.length > 1 ? "s" : ""} need{mine.length === 1 ? "s" : ""} reassignment</p>
                    <ul className="mt-2 divide-y divide-warn-400/15">
                      {mine.map((x) => (
                        <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                          <span className="text-sm text-n-200">{x.studentName}</span>
                          <span className="flex items-center gap-2"><CaseStatusChip status={x.status} /><Link href={`/admin/students?case=${x.id}`} className={buttonClass("secondary", "sm")}>Reassign</Link></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
