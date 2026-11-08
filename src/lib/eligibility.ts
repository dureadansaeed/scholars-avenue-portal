import { DEMO_NOW } from "@/lib/clock";
import type {
  AcademicRecord, CriterionResult, CriterionState, LanguageRequirement, LanguageTest,
  MatchResult, OtherTest, Program, QualificationLevel, StudentPreference,
} from "@/types";

/**
 * Transparent, rule-based comparison of a student's record against one program
 * intake (PRD 7.7.1). It reports; it never decides.
 *
 * Hard rules this file holds to:
 *  - Missing or unverified data is "unknown", never a pass and never an
 *    automatic rejection.
 *  - Grades on different scales are never compared (no conversion rule exists).
 *  - Different language tests are never treated as equivalent.
 *  - A missing or unpublished deadline is "unknown", not "open".
 *  - "confirmed" means every checked criterion is met on the records held, and
 *    is not an admission outcome.
 */

export interface StudentFacts {
  preference: StudentPreference | null;
  academics: AcademicRecord[];
  languageTests: LanguageTest[];
  otherTests: OtherTest[];
}

export interface MatchOptions {
  now?: string;
  /** Verified records older than this are treated as stale (PRD 7.6.6). */
  reviewIntervalDays?: number;
}

const RANK: Record<QualificationLevel, number> = { higher_secondary: 1, bachelor: 2, master: 3, phd: 4 };
const QUAL_LABEL: Record<QualificationLevel, string> = {
  higher_secondary: "Higher secondary", bachelor: "Bachelor's", master: "Master's", phd: "PhD",
};
const COMPONENTS = ["listening", "reading", "writing", "speaking"] as const;

const day = 86_400_000;
const crit = (
  key: string, label: string, state: CriterionState, reason: string, hard: boolean,
): CriterionResult => ({ key, label, state, reason, hard });

export function matchProgram(
  facts: StudentFacts, program: Program, intakeId: string, opts: MatchOptions = {},
): MatchResult {
  const now = Date.parse(opts.now ?? DEMO_NOW);
  const interval = opts.reviewIntervalDays ?? 180;
  const intake = program.intakes.find((i) => i.id === intakeId);
  const criteria: CriterionResult[] = [];
  const req = program.requirements;

  // --- degree level and country (preferences, so soft) ---
  const pref = facts.preference;
  if (!pref || pref.degreeLevels.length === 0) {
    criteria.push(crit("degree", "Degree level", "unknown_student", "The student has not stated a preferred degree level.", false));
  } else if (pref.degreeLevels.includes(program.degreeLevel)) {
    criteria.push(crit("degree", "Degree level", "meets", `Student is looking for a ${program.degreeLevel}'s-level programme.`, false));
  } else {
    criteria.push(crit("degree", "Degree level", "needs_review", `Programme is ${program.degreeLevel}; the student's preference is ${pref.degreeLevels.join(", ")}.`, false));
  }
  if (!pref || pref.countries.length === 0) {
    criteria.push(crit("country", "Country", "unknown_student", "The student has not stated preferred countries.", false));
  } else if (pref.countries.includes(program.countryCode)) {
    criteria.push(crit("country", "Country", "meets", "Programme is in a preferred country.", false));
  } else {
    criteria.push(crit("country", "Country", "needs_review", "Programme is outside the student's preferred countries.", false));
  }

  // --- previous qualification ---
  const required = req.previousQualification;
  let basis: AcademicRecord | undefined;
  if (required.status === "unknown") {
    criteria.push(crit("qualification", "Previous qualification", "unknown_program", "The required previous qualification is not recorded for this programme.", true));
  } else if (required.status === "not_required") {
    criteria.push(crit("qualification", "Previous qualification", "not_applicable", "No previous qualification is stated as required.", true));
  } else {
    const needed = required.value;
    const atOrAbove = facts.academics.filter((a) => RANK[a.level] >= RANK[needed]);
    basis = atOrAbove.find((a) => a.level === needed) ?? atOrAbove[0];
    const awarded = atOrAbove.find((a) => a.awardStatus === "awarded");
    if (facts.academics.length === 0) {
      criteria.push(crit("qualification", "Previous qualification", "unknown_student", "No academic records on file.", true));
    } else if (awarded) {
      basis = awarded.level === needed ? awarded : (atOrAbove.find((a) => a.level === needed) ?? awarded);
      criteria.push(crit("qualification", "Previous qualification", "meets", `${QUAL_LABEL[needed]} awarded (${awarded.title}).`, true));
    } else if (atOrAbove.length > 0) {
      criteria.push(crit("qualification", "Previous qualification", "needs_review", `${QUAL_LABEL[needed]} is not yet awarded; the result is ${atOrAbove[0].awardStatus.replace(/_/g, " ")}.`, true));
    } else {
      criteria.push(crit("qualification", "Previous qualification", "does_not_meet", `Requires ${QUAL_LABEL[needed]}; highest on file is ${QUAL_LABEL[[...facts.academics].sort((a, b) => RANK[b.level] - RANK[a.level])[0].level]}.`, true));
    }
  }

  // --- grade, only ever compared on the same scale ---
  if (req.minGrade.status === "unknown") {
    criteria.push(crit("grade", "Minimum grade", "unknown_program", "The minimum grade is not recorded for this programme.", true));
  } else if (req.minGrade.status === "not_required") {
    criteria.push(crit("grade", "Minimum grade", "not_applicable", "No minimum grade is stated.", true));
  } else if (!basis) {
    criteria.push(crit("grade", "Minimum grade", "unknown_student", "No qualifying academic record to take a grade from.", true));
  } else if (basis.gradeObtained == null || basis.gradeScale == null) {
    criteria.push(crit("grade", "Minimum grade", "unknown_student", "The grade or its scale is missing; a scale is never assumed.", true));
  } else {
    const min = req.minGrade.value;
    if (basis.gradeScale !== min.scale) {
      criteria.push(crit("grade", "Minimum grade", "needs_review",
        `Student has ${basis.gradeObtained}/${basis.gradeScale}; the programme asks ${min.value}/${min.scale}. Different scales are not compared without a conversion rule.`, true));
    } else if (basis.gradeObtained >= min.value) {
      criteria.push(crit("grade", "Minimum grade", "meets", `${basis.gradeObtained}/${basis.gradeScale} against a minimum of ${min.value}/${min.scale}.`, true));
    } else {
      criteria.push(crit("grade", "Minimum grade", "does_not_meet", `${basis.gradeObtained}/${basis.gradeScale} is below the minimum of ${min.value}/${min.scale}.`, true));
    }
  }

  // --- language: same test type only, overall and components separately ---
  let chosen: { test: LanguageTest; reqd: LanguageRequirement } | undefined;
  const lang = req.languageTests;
  if (lang.status === "unknown") {
    criteria.push(crit("language_overall", "Language, overall", "unknown_program", "Accepted language tests are not recorded. This is incomplete, not language-unrestricted.", true));
    criteria.push(crit("language_components", "Language, components", "unknown_program", "Component minimums are not recorded for this programme.", true));
  } else if (lang.status === "not_required") {
    criteria.push(crit("language_overall", "Language, overall", "not_applicable", "No language test is stated as required.", true));
    criteria.push(crit("language_components", "Language, components", "not_applicable", "No language test is stated as required.", true));
  } else {
    const pairs = lang.value.flatMap((reqd) =>
      facts.languageTests.filter((t) => t.type === reqd.testType).map((test) => ({ test, reqd })),
    );
    const passes = (p: { test: LanguageTest; reqd: LanguageRequirement }) =>
      p.reqd.overall != null && p.test.overall != null && p.test.overall >= p.reqd.overall;
    chosen = pairs.find(passes) ?? pairs[0];
    const accepted = lang.value.map((r) => r.testType.replace(/_/g, " ")).join(" / ");
    if (!chosen) {
      const reason = facts.languageTests.length
        ? `Accepted: ${accepted}. The student's tests are of other types; tests are not treated as equivalent.`
        : `Accepted: ${accepted}. No language test on file.`;
      criteria.push(crit("language_overall", "Language, overall", "unknown_student", reason, true));
      criteria.push(crit("language_components", "Language, components", "unknown_student", reason, true));
    } else {
      const { test, reqd } = chosen;
      if (reqd.overall == null) {
        criteria.push(crit("language_overall", "Language, overall", "unknown_program", `Minimum overall for ${reqd.testType.replace(/_/g, " ")} is not recorded.`, true));
      } else if (test.overall == null) {
        criteria.push(crit("language_overall", "Language, overall", "unknown_student", "Test is on file without an overall score.", true));
      } else if (test.overall >= reqd.overall) {
        criteria.push(crit("language_overall", "Language, overall", "meets", `${test.overall} against a minimum of ${reqd.overall}.`, true));
      } else {
        criteria.push(crit("language_overall", "Language, overall", "does_not_meet", `${test.overall} is below the minimum of ${reqd.overall}.`, true));
      }
      const wanted = COMPONENTS.filter((c) => reqd.components[c] != null);
      if (wanted.length === 0) {
        criteria.push(crit("language_components", "Language, components", reqd.overall == null ? "unknown_program" : "not_applicable",
          reqd.overall == null ? "Component minimums are not recorded." : "No component minimums are stated.", true));
      } else {
        const missing = wanted.filter((c) => test.components[c] == null);
        const below = wanted.filter((c) => test.components[c] != null && test.components[c]! < reqd.components[c]!);
        if (below.length) {
          criteria.push(crit("language_components", "Language, components", "does_not_meet",
            below.map((c) => `${c} ${test.components[c]} < ${reqd.components[c]}`).join("; "), true));
        } else if (missing.length) {
          criteria.push(crit("language_components", "Language, components", "unknown_student", `Missing component score(s): ${missing.join(", ")}.`, true));
        } else {
          criteria.push(crit("language_components", "Language, components", "meets", `All ${wanted.length} component minimums are met.`, true));
        }
      }
    }
  }

  // --- test validity at the application date ---
  const deadline = intake?.deadline;
  if (!chosen?.test.expiresOn) {
    criteria.push(crit("validity", "Test validity", "not_applicable", chosen ? "The test has no recorded expiry." : "No language test to check.", false));
  } else if (deadline?.kind !== "fixed") {
    criteria.push(crit("validity", "Test validity", "unknown_program", "The test expires, but the application date is not fixed, so validity cannot be checked.", false));
  } else if (Date.parse(chosen.test.expiresOn) < Date.parse(deadline.date)) {
    criteria.push(crit("validity", "Test validity", "does_not_meet", `Test expires ${chosen.test.expiresOn}, before the ${deadline.date} deadline.`, true));
  } else {
    criteria.push(crit("validity", "Test validity", "meets", `Test is valid until ${chosen.test.expiresOn}, past the ${deadline.date} deadline.`, false));
  }

  // --- other tests ---
  if (req.otherTests.status === "unknown") {
    criteria.push(crit("other_tests", "Other tests", "unknown_program", "Additional test requirements are not recorded.", true));
  } else if (req.otherTests.status === "not_required") {
    criteria.push(crit("other_tests", "Other tests", "not_applicable", "No additional tests are stated.", true));
  } else {
    const absent = req.otherTests.value.filter((t) => !facts.otherTests.some((o) => o.type === t));
    criteria.push(absent.length
      ? crit("other_tests", "Other tests", "unknown_student", `Required but not on file: ${absent.join(", ")}.`, true)
      : crit("other_tests", "Other tests", "meets", "Required tests are on file.", true));
  }

  // --- intake and deadline ---
  if (!intake) {
    criteria.push(crit("deadline", "Deadline", "unknown_program", "Intake not found for this programme.", true));
  } else if (intake.deadline.kind === "not_published") {
    criteria.push(crit("deadline", "Deadline", "unknown_program", "Deadline is not published. It is not treated as open.", true));
  } else if (intake.deadline.kind === "rolling") {
    criteria.push(crit("deadline", "Deadline", "meets", "Rolling admissions; confirm current availability with the university.", true));
  } else if (Date.parse(intake.deadline.date) < now) {
    criteria.push(crit("deadline", "Deadline", "does_not_meet", `Deadline ${intake.deadline.date} has passed.`, true));
  } else {
    const left = Math.ceil((Date.parse(intake.deadline.date) - now) / day);
    criteria.push(crit("deadline", "Deadline", "meets", `Closes ${intake.deadline.date} (${left} day${left === 1 ? "" : "s"} left).`, true));
  }

  // --- record freshness ---
  const { verification, lastCheckedAt } = program.source;
  if (verification !== "verified" || !lastCheckedAt) {
    criteria.push(crit("freshness", "Data verification", "unknown_program", `Programme record is ${verification.replace(/_/g, " ")}; requirements are not confirmed.`, false));
  } else if ((now - Date.parse(lastCheckedAt)) / day > interval) {
    criteria.push(crit("freshness", "Data verification", "needs_review", `Last verified ${lastCheckedAt}, more than ${interval} days ago.`, false));
  } else {
    criteria.push(crit("freshness", "Data verification", "meets", `Verified ${lastCheckedAt} against the official source.`, false));
  }

  const overall = criteria.some((c) => c.hard && c.state === "does_not_meet")
    ? "mismatch"
    : criteria.every((c) => c.state === "meets" || c.state === "not_applicable")
      ? "confirmed"
      : "possible";

  return { programId: program.id, intakeId, overall, criteria };
}
