"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApplicationStatusChip, SampleTag, Status } from "@/components/ui/chips";
import { Input } from "@/components/ui/form";
import { Segmented } from "@/components/ui/navigation";
import { Empty, Section } from "@/components/ui/panels";
import { Table, TD, TH, THead, TR } from "@/components/ui/table";
import { GROUP_LABEL, GROUPS, isActive, STATUS_LABEL, statusGroup, type StatusGroup } from "@/lib/application-rules";
import { formatDate, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { mergeById, useCounselorWork } from "@/lib/counselor-work";
import type { getApplicationsOverview } from "@/lib/data/counselor-work";
import { ROUTE_LABEL } from "@/lib/student-labels";
import type { Application } from "@/types";

type Data = Awaited<ReturnType<typeof getApplicationsOverview>>;

export function ApplicationsView({ counselorId, data }: { counselorId: string; data: Data }) {
  const w = useCounselorWork(counselorId);
  const [mode, setMode] = useState<"list" | "board">("list");
  const [group, setGroup] = useState<"all" | StatusGroup>("all");
  const [q, setQ] = useState("");

  const apps = useMemo(() => mergeById(data.applications, w.work.applications), [data.applications, w.work.applications]);
  const info = (a: Application) => {
    const program = data.programs.find((p) => p.id === a.programId)!;
    const intake = program.intakes.find((i) => i.id === a.intakeId)!;
    return {
      program, intake, university: data.universities.find((u) => u.id === program.universityId)!.name,
      student: data.students.find((s) => s.id === a.studentId)?.name ?? "Student",
      deadline: intake.deadline.kind === "fixed" ? intake.deadline.date : null,
    };
  };
  const rows = apps.map((a) => ({ a, ...info(a) }));
  const needle = q.trim().toLowerCase();
  const matches = rows.filter((r) => (!needle || `${r.student} ${r.program.name} ${r.university}`.toLowerCase().includes(needle)));
  const shown = matches.filter((r) => group === "all" || statusGroup(r.a.status) === group);
  const counts = Object.fromEntries(GROUPS.map((g) => [g, matches.filter((r) => statusGroup(r.a.status) === g).length])) as Record<StatusGroup, number>;
  const noAction = rows.filter((r) => isActive(r.a.status) && !r.a.nextAction?.trim()).length;

  const Card = ({ r }: { r: (typeof rows)[number] }) => (
    <Link href={`/counselor/applications/${r.a.id}`} className="press block rounded-sm border border-line bg-surface p-3 shadow-card transition-colors hover:border-line-strong">
      <p className="truncate text-sm font-medium text-n-100">{r.student}</p>
      <p className="truncate text-tiny text-n-400">{r.program.degreeTitle} {r.program.name}</p>
      <p className="truncate text-tiny text-n-500">{r.university}</p>
      <div className="mt-2"><ApplicationStatusChip status={r.a.status} label={STATUS_LABEL[r.a.status]} /></div>
      {r.deadline && <p className="mt-1.5 text-micro tabular-nums text-n-500">Deadline {formatDate(r.deadline)}</p>}
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Layout" size="sm" value={mode} onChange={setMode} options={[{ value: "list", label: "List" }, { value: "board", label: "Board" }]} />
        <div className="flex items-center gap-2">
          <Input type="search" aria-label="Search applications" className="w-56" placeholder="Student, programme, university" value={q} onChange={(e) => setQ(e.target.value)} />
          <SampleTag />
        </div>
      </div>

      {mode === "list" && (
        <Segmented label="Status group" size="sm" value={group} onChange={setGroup}
          options={[{ value: "all", label: "All", count: matches.length }, ...GROUPS.filter((g) => counts[g] > 0 || group === g).map((g) => ({ value: g, label: GROUP_LABEL[g], count: counts[g] }))]} />
      )}
      {noAction > 0 && <p role="status" className="text-tiny text-warn-400">{noAction} active application{noAction > 1 ? "s have" : " has"} no next action recorded.</p>}

      {rows.length === 0 ? (
        <Section><Empty title="No applications yet">Create one from a student&apos;s shortlist once they agree on a programme.</Empty></Section>
      ) : mode === "list" ? (
        <Section flush>
          {shown.length === 0 ? <Empty title="No applications match" action={<Button size="sm" onClick={() => { setQ(""); setGroup("all"); }}>Clear</Button>} /> : (
            <Table className="max-h-[36rem]">
              <colgroup><col className="w-[24%]" /><col className="w-[18%]" /><col className="w-[22%]" /><col className="w-[22%]" /><col className="w-[14%]" /></colgroup>
              <THead><TH>Student</TH><TH>Programme</TH><TH>Status</TH><TH>Next action</TH><TH>Deadline</TH></THead>
              <tbody>
                {shown.map((r) => (
                  <TR key={r.a.id}>
                    <TD><Link href={`/counselor/applications/${r.a.id}`} className="block truncate text-sm font-medium text-n-100 hover:underline">{r.student}</Link>
                      <p className="truncate text-n-500">{ROUTE_LABEL[r.a.route]}</p></TD>
                    <TD><p className="truncate text-n-200">{r.program.degreeTitle} {r.program.name}</p><p className="truncate text-n-500">{r.university}</p></TD>
                    <TD><ApplicationStatusChip status={r.a.status} label={STATUS_LABEL[r.a.status]} /><p className="mt-1 text-n-500">{GROUP_LABEL[statusGroup(r.a.status)]}</p></TD>
                    <TD>{isActive(r.a.status) && !r.a.nextAction?.trim() ? <Status tone="warn">None set</Status> : <span className="line-clamp-2 text-n-300">{r.a.nextAction ?? "None needed"}</span>}</TD>
                    <TD className="tabular-nums text-n-300">{r.deadline ? <>{formatDate(r.deadline)}<p className="text-n-500">{relativeDays(r.deadline)}</p></> : <span className="text-n-500">Not published</span>}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </Section>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[60rem] grid-cols-5 gap-3">
            {GROUPS.filter((g) => g !== "ended").map((g) => (
              <div key={g} className={cx("rounded-md border border-line bg-raised p-2")}>
                <p className="flex items-center justify-between px-1 pb-2 text-micro font-medium tracking-wide text-n-500 uppercase">{GROUP_LABEL[g]}<span className="tabular-nums">{counts[g]}</span></p>
                <div className="space-y-2">{matches.filter((r) => statusGroup(r.a.status) === g).map((r) => <Card key={r.a.id} r={r} />)}</div>
                {counts[g] === 0 && <p className="px-1 py-4 text-center text-tiny text-n-500">Empty</p>}
              </div>
            ))}
          </div>
          {counts.ended > 0 && <p className="mt-2 text-tiny text-n-500">{counts.ended} ended application{counts.ended > 1 ? "s" : ""} are hidden here. Use the list view to see them.</p>}
        </div>
      )}
    </div>
  );
}
