"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Note, ScoreRing } from "@/components/ui/panels";
import { Icon } from "@/components/ui/icons";
import { DEMO_NOW } from "@/lib/clock";
import { overallCompletion, sectionCompletion } from "@/lib/completion";
import { cx } from "@/lib/cx";
import type { AcademicRecord, LanguageTest, OtherTest, StudentDocument, StudentPreference, StudentProfile } from "@/types";
import { AcademicSection } from "./academic-section";
import { PersonalSection } from "./personal-section";
import { PreferencesSection } from "./preferences-section";
import { LanguageSection, OtherTestsSection } from "./tests-section";

export interface ProfileBundle {
  profile: StudentProfile; academics: AcademicRecord[]; languageTests: LanguageTest[]; otherTests: OtherTest[];
  preference: StudentPreference; documents: StudentDocument[]; reviewerNames: Record<string, string>; counselorName: string | null;
}
type Draft = Pick<ProfileBundle, "profile" | "academics" | "languageTests" | "otherTests" | "preference">;

/**
 * Frontend-only persistence: edits are kept in this browser so a student can
 * stop and continue later (STU-002). A real backend replaces `localStorage` here
 * and nothing else in the editor changes.
 */
export function ProfileEditor({ bundle }: { bundle: ProfileBundle }) {
  const storageKey = `sa:profile:${bundle.profile.studentId}`;
  const [state, setState] = useState<Draft>({
    profile: bundle.profile, academics: bundle.academics, languageTests: bundle.languageTests,
    otherTests: bundle.otherTests, preference: bundle.preference,
  });
  const [version, setVersion] = useState(0); // remounts forms after a stored draft loads
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [restored, setRestored] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved draft after hydration
        setState(JSON.parse(raw) as Draft); setVersion((v) => v + 1); setRestored(true);
      }
    } catch { /* a corrupt draft is ignored; the server copy remains */ }
    ready.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (ready.current) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const sections = useMemo(
    () => sectionCompletion({ ...state, preference: state.preference, documents: bundle.documents }),
    [state, bundle.documents],
  );
  const completion = overallCompletion(sections);
  const mark = (k: string) => setSaved((s) => ({ ...s, [k]: DEMO_NOW }));
  const update = <K extends keyof Draft>(key: K, value: Draft[K], section: string) => { setState((s) => ({ ...s, [key]: value })); mark(section); };

  const reset = () => { localStorage.removeItem(storageKey); setState({ profile: bundle.profile, academics: bundle.academics, languageTests: bundle.languageTests, otherTests: bundle.otherTests, preference: bundle.preference }); setVersion((v) => v + 1); setRestored(false); setSaved({}); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <ScoreRing value={completion} label={`Profile ${completion}% complete`} />
            <div>
              <p className="text-sm font-medium text-n-100">{completion}% complete</p>
              <p className="text-tiny text-n-500">Saves as you go</p>
            </div>
          </div>
          <nav aria-label="Profile sections" className="mt-4 space-y-0.5">
            {sections.filter((s) => s.key !== "documents").map((s) => {
              const done = s.missing.length === 0;
              return (
                <a key={s.key} href={s.href.replace("/student/profile", "")} className="press flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-n-300 hover:bg-n-850 hover:text-n-100">
                  <span className={cx("grid size-4 place-items-center rounded-full border", done ? "border-ok-400 bg-ok-400 text-n-950" : "border-line-strong text-transparent")}><Icon.Check className="size-2.5" /></span>
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className="text-tiny tabular-nums text-n-500">{s.done}/{s.total}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        {restored && (
          <Note title="Your saved changes were restored" action={<button type="button" onClick={reset} className="text-tiny font-medium text-link hover:underline">Discard and start over</button>}>
            This browser kept what you entered last time. In this demo nothing is sent to a server.
          </Note>
        )}
        <PersonalSection key={`p${version}`} profile={state.profile} reviewerNames={bundle.reviewerNames} savedAt={saved.personal}
          onSave={(p) => update("profile", p, "personal")} />
        <AcademicSection studentId={bundle.profile.studentId} records={state.academics} reviewerNames={bundle.reviewerNames} savedAt={saved.academic}
          onChange={(r) => update("academics", r, "academic")} />
        <LanguageSection studentId={bundle.profile.studentId} tests={state.languageTests} reviewerNames={bundle.reviewerNames}
          onChange={(t) => update("languageTests", t, "language")} />
        <OtherTestsSection studentId={bundle.profile.studentId} tests={state.otherTests} reviewerNames={bundle.reviewerNames}
          onChange={(t) => update("otherTests", t, "other")} />
        <PreferencesSection key={`pref${version}`} preference={state.preference} savedAt={saved.preferences}
          onSave={(p) => update("preference", p, "preferences")} />
      </div>
    </div>
  );
}
