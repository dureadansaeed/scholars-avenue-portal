import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/button-styles";
import { ApplicationStatusChip, CaseStatusChip, Tag } from "@/components/ui/chips";
import { Avatar, TaskRow, Timeline } from "@/components/ui/domain";
import { Icon } from "@/components/ui/icons";
import { PageHead } from "@/components/ui/navigation";
import { Empty, Metric, Note, ScoreRing, Section } from "@/components/ui/panels";
import { formatDate, relativeDays } from "@/lib/clock";
import { cx } from "@/lib/cx";
import { getStudentHome } from "@/lib/data/student";
import { getCurrentStudentId } from "@/lib/session";

export const metadata = { title: "Home" };

const FIELD_LABEL: Record<string, string> = {
  fullName: "Full name", dateOfBirth: "Date of birth", passportNumber: "Passport number", nationality: "Nationality",
};
const taskHref = (type?: string) =>
  type === "document" ? "/student/documents" : type === "profile" ? "/student/profile" : undefined;

export default async function StudentHome() {
  const home = await getStudentHome(await getCurrentStudentId());
  if (!home) notFound();
  const { profile, studentCase, counselor, sections, completion, openTasks, corrections, applications } = home;

  const firstName = profile.preferredName ?? profile.fullName.split(" ")[0];
  const pendingActivation = !studentCase || studentCase.status === "invited" || studentCase.status === "registration_pending";
  const deadlines = [
    ...openTasks.map((t) => ({ label: t.title, date: t.dueDate })),
    ...applications.filter((a) => a.deadline).map((a) => ({ label: `${a.programName} application closes`, date: a.deadline! })),
  ].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const next = deadlines[0];
  const actionCount = corrections.length + openTasks.length;

  return (
    <>
      <PageHead
        title={`Welcome, ${firstName}`}
        description={studentCase?.overview ?? "Here is where your application journey stands today."}
        actions={studentCase && <CaseStatusChip status={studentCase.status} />}
      />

      <div className="space-y-4">
        {pendingActivation && (
          <Note title="Your account is being set up">
            Your package is not active yet. You can start filling in your profile now; your counselor will be assigned once it is activated.
          </Note>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-line bg-surface p-5 md:grid-cols-4">
          <Metric label="Needs your action" value={actionCount} hint={actionCount ? "See the list below" : "You are up to date"} />
          <Metric label="Documents to sort" value={home.documentsNeedingAction} hint="Requested or to replace" />
          <Metric label="Programmes to review" value={home.awaitingDecision} hint={`${home.sharedProgrammeCount} shared with you`} />
          <Metric label="Next date" value={next ? formatDate(next.date) : "None"} hint={next ? `${relativeDays(next.date)} · ${next.label}` : "No upcoming deadlines"} />
        </dl>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Section title="Needs your action" description="Things only you can do. Everything else is being handled by your counselor." flush>
              {actionCount === 0 ? (
                <Empty title="Nothing needs your action right now">We will notify you when your counselor asks for something.</Empty>
              ) : (
                <div className="divide-y divide-line">
                  {corrections.map((c) => (
                    <Link key={c.field} href="/student/profile" className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-n-850/70">
                      <Icon.Alert className="mt-0.5 size-5 shrink-0 text-bad-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-n-100">Correct your {(FIELD_LABEL[c.field] ?? c.field).toLowerCase()}</span>
                        <span className="block text-tiny text-n-400">{c.note || "Your counselor asked for a correction."}</span>
                      </span>
                      <Icon.Chevron className="mt-0.5 size-4 shrink-0 text-n-500" />
                    </Link>
                  ))}
                  {openTasks.map((t) => (
                    <TaskRow key={t.id} title={t.title} dueDate={t.dueDate} status={t.status} overdue={t.overdue} href={taskHref(t.related?.type)} />
                  ))}
                </div>
              )}
            </Section>

            {applications.length > 0 && (
              <Section title="Your applications" description="Updated by your counselor as each one progresses." flush>
                <ul className="divide-y divide-line">
                  {applications.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-n-100">{a.programName}</p>
                        <p className="truncate text-tiny text-n-400">{a.universityName}, {a.cityName} · {a.intakeName}</p>
                      </div>
                      <ApplicationStatusChip status={a.status} label={a.studentStatusLabel} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Recent activity">
              {home.recentTimeline.length ? <Timeline events={home.recentTimeline} /> : (
                <Empty title="No activity yet">Updates about your case will appear here.</Empty>
              )}
            </Section>
          </div>

          <div className="space-y-4">
            <Section title="Profile progress" description={completion === 100 ? "Everything we need is in." : "Finish each section so your counselor can start."}>
              <div className="flex items-center gap-4">
                <ScoreRing value={completion} size={88} stroke={6} label={`Profile ${completion}% complete`} />
                <p className="text-tiny leading-relaxed text-n-400">You can save a section and come back later. Nothing is lost.</p>
              </div>
              <ul className="mt-4 space-y-1">
                {sections.map((s) => {
                  const done = s.done >= s.total && s.missing.length === 0;
                  return (
                    <li key={s.key}>
                      <Link href={s.href} className="press flex items-center gap-3 rounded-sm px-2 py-2 hover:bg-n-850">
                        <span className={cx("grid size-5 shrink-0 place-items-center rounded-full border", done ? "border-ok-400 bg-ok-400 text-n-950" : "border-line-strong text-transparent")}>
                          <Icon.Check className="size-3" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-n-100">{s.label}</span>
                          {!done && <span className="block truncate text-tiny text-n-500">Missing: {s.missing.slice(0, 2).join(", ")}{s.missing.length > 2 ? ` +${s.missing.length - 2}` : ""}</span>}
                        </span>
                        <span className="text-tiny tabular-nums text-n-500">{s.done}/{s.total}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <Section title="Your counselor">
              {counselor ? (
                <div className="flex items-center gap-3">
                  <Avatar name={counselor.name} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-n-100">{counselor.name}</p>
                    <p className="truncate text-tiny text-n-400">{counselor.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">{counselor.languages.map((l) => <Tag key={l}>{l}</Tag>)}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-n-400">A counselor will be assigned once your package is active. We will let you know.</p>
              )}
              <Link href="/student/profile" className={buttonClass("secondary", "sm", "mt-4")}>Review my profile</Link>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
