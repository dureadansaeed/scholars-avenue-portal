"use client";

import { MatchChip, RecordStatusChip, SampleTag } from "@/components/ui/chips";
import { Sheet } from "@/components/ui/overlays";
import { cx } from "@/lib/cx";
import { deadlineText, money, requirementRows } from "@/lib/program-format";
import type { BankRow } from "@/lib/program-search";
import { countryName } from "@/mocks/countries";
import type { MatchResult } from "@/types";

export interface CompareItem { row: BankRow; match?: MatchResult }

const CRIT_LABEL: Record<string, string> = {
  qualification: "Qualification", grade: "Grade", language_overall: "Language, overall", language_components: "Language, components",
  validity: "Test validity", other_tests: "Other tests", deadline: "Deadline", freshness: "Data verification", degree: "Degree", country: "Country",
};
const STATE_TEXT = { meets: "Meets", does_not_meet: "Does not meet", needs_review: "Needs review", unknown_student: "Unknown (student)", unknown_program: "Unknown (programme)", not_applicable: "n/a" } as const;
const STATE_CLASS = { meets: "text-ok-400", does_not_meet: "text-bad-400", needs_review: "text-warn-400", unknown_student: "text-n-500", unknown_program: "text-n-500", not_applicable: "text-n-500" } as const;

/** Side-by-side view of two to four programme intakes, for the same student when one is chosen. */
export function CompareSheet({ open, onClose, items, studentName }: { open: boolean; onClose: () => void; items: CompareItem[]; studentName?: string }) {
  const facts = (r: BankRow) => {
    const dl = deadlineText(r.intake);
    const rq = Object.fromEntries(requirementRows(r.program).map((x) => [x.label, x]));
    return [
      ["Where", `${r.city.name}, ${countryName(r.program.countryCode)}`, false],
      ["Intake", r.intake.name, false],
      ["Deadline", dl.value, !!dl.unknown],
      ["Route", r.intake.route ? (r.intake.route.portalName ?? r.intake.route.type.replace(/_/g, " ")) : "Not recorded", !r.intake.route],
      ["Application fee", money(r.intake.applicationFee) ?? "Not recorded", !r.intake.applicationFee],
      ["Tuition", r.intake.tuition ? `${money(r.intake.tuition)} / ${r.intake.tuition.per}` : "Not recorded", !r.intake.tuition],
      ["Duration", r.program.durationMonths ? `${r.program.durationMonths} months` : "Not recorded", !r.program.durationMonths],
      ["Language", r.program.languageOfInstruction.join(", "), false],
      ["Qualification", rq["Previous qualification"].value, !!rq["Previous qualification"].unknown],
      ["Minimum grade", rq["Minimum grade"].value, !!rq["Minimum grade"].unknown],
      ["Language test", rq["Language test"].value, !!rq["Language test"].unknown],
      ["Other tests", rq["Other tests"].value, !!rq["Other tests"].unknown],
    ] as [string, string, boolean][];
  };
  const matchKeys = items.some((i) => i.match) ? Object.keys(CRIT_LABEL).filter((k) => items.some((i) => i.match?.criteria.some((c) => c.key === k))) : [];

  return (
    <Sheet open={open} onClose={onClose} wide title="Compare programmes" description={studentName ? `Against ${studentName}'s record` : "Choose a student in the programme bank to add match results."}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] table-fixed border-collapse text-left text-tiny">
          <caption className="sr-only">Programme comparison</caption>
          <thead>
            <tr className="border-b border-line align-bottom">
              <th scope="col" className="w-32 py-2 pr-3" />
              {items.map(({ row }) => (
                <th key={row.key} scope="col" className="px-3 py-2 align-top">
                  <p className="text-sm font-semibold text-n-100">{row.program.degreeTitle} {row.program.name}</p>
                  <p className="font-normal text-n-400">{row.university.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1"><RecordStatusChip status={row.program.status} /><SampleTag /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matchKeys.length > 0 && (
              <>
                <tr className="border-b border-line bg-raised"><th scope="row" className="py-2 pr-3 text-micro font-medium tracking-wide text-n-500 uppercase">Match</th>
                  {items.map((i) => <td key={i.row.key} className="px-3 py-2">{i.match && <MatchChip overall={i.match.overall} />}</td>)}</tr>
                {matchKeys.map((k) => (
                  <tr key={k} className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 font-normal text-n-400">{CRIT_LABEL[k]}</th>
                    {items.map((i) => {
                      const c = i.match?.criteria.find((x) => x.key === k);
                      return <td key={i.row.key} className={cx("px-3 py-2 font-medium", c && STATE_CLASS[c.state])} title={c?.reason}>{c ? STATE_TEXT[c.state] : "n/a"}</td>;
                    })}
                  </tr>
                ))}
              </>
            )}
            {facts(items[0].row).map(([label], n) => (
              <tr key={label} className="border-b border-line align-top last:border-0">
                <th scope="row" className="py-2 pr-3 font-normal text-n-400">{label}</th>
                {items.map((i) => {
                  const [, value, unknown] = facts(i.row)[n];
                  return <td key={i.row.key} className={cx("px-3 py-2", unknown ? "text-warn-400" : "text-n-100")}>{value}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-tiny text-n-500">Match results are rule-based checks against the records held. They are not admission decisions. Hover a result for the reason.</p>
    </Sheet>
  );
}
