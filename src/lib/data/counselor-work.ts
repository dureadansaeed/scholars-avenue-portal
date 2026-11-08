import "server-only";
import { defaultChecklist } from "@/lib/application-rules";
import type { StudentFacts } from "@/lib/eligibility";
import { applicationRequirements, packages, shortlist } from "@/mocks/cases";
import { cities, programs, universities } from "@/mocks/catalog";
import { counselors } from "@/mocks/users";
import { world } from "@/mocks/world";
import type { Application, ApplicationRequirement, ShortlistEntry } from "@/types";
import { getStudentHeader } from "./counselor";

/**
 * Counselor-scoped catalog, shortlist and application reads. Access is by
 * assigned or shared case, exactly as in counselor.ts; anything else is null.
 */
const tick = <T,>(v: T) => Promise.resolve(v);

const accessibleCases = (counselorId: string) =>
  world.cases.filter((c) => c.counselorId === counselorId || c.sharedCounselorIds?.includes(counselorId));
const nameOf = (id: string) => world.students.find((s) => s.id === id)?.name ?? "Unknown";

export function programBank() {
  return {
    programs,
    universities: universities.map((u) => ({ id: u.id, name: u.name, type: u.type, countryCode: u.countryCode })),
    cities: cities.map((c) => ({ id: c.id, name: c.name, countryCode: c.countryCode })),
  };
}

function factsOf(studentId: string): StudentFacts {
  return {
    preference: world.preferences.find((p) => p.studentId === studentId) ?? null,
    academics: world.academics.filter((a) => a.studentId === studentId),
    languageTests: world.languageTests.filter((t) => t.studentId === studentId),
    otherTests: world.otherTests.filter((t) => t.studentId === studentId),
  };
}

const pkgOf = (packageId: string) => {
  const p = packages.find((x) => x.id === packageId);
  return { name: p?.name ?? "", maxApplications: p?.maxApplications ?? null };
};

/** Students the counselor can act for, with what the matching engine needs. */
export async function getMatchableStudents(counselorId: string) {
  return tick(accessibleCases(counselorId).map((c) => ({
    id: c.studentId, name: nameOf(c.studentId), caseId: c.id, facts: factsOf(c.studentId), package: pkgOf(c.packageId),
    shortlistedKeys: shortlist.filter((s) => s.studentId === c.studentId && s.status !== "removed").map((s) => `${s.programId}|${s.intakeId}`),
  })).sort((a, b) => a.name.localeCompare(b.name)));
}

function baseChecklist(a: Application): ApplicationRequirement[] {
  const have = applicationRequirements.filter((r) => r.applicationId === a.id);
  if (have.length) return have;
  const program = programs.find((p) => p.id === a.programId)!;
  return defaultChecklist(a.id, program, program.intakes.find((i) => i.id === a.intakeId), a.portalName);
}

export async function getStudentWorkBundle(counselorId: string, studentId: string) {
  const header = await getStudentHeader(counselorId, studentId);
  if (!header) return null;
  const c = world.cases.find((x) => x.studentId === studentId)!;
  const apps = world.applications.filter((a) => a.studentId === studentId);
  return {
    student: { id: studentId, name: header.name, caseId: c.id },
    facts: factsOf(studentId),
    package: pkgOf(c.packageId),
    entries: shortlist.filter((s) => s.studentId === studentId) as ShortlistEntry[],
    applications: apps,
    checklists: Object.fromEntries(apps.map((a) => [a.id, baseChecklist(a)])),
    ...programBank(),
  };
}

export async function getApplicationsOverview(counselorId: string) {
  const ids = new Set(accessibleCases(counselorId).map((c) => c.studentId));
  const apps = world.applications.filter((a) => ids.has(a.studentId));
  return tick({
    applications: apps,
    checklists: Object.fromEntries(apps.map((a) => [a.id, baseChecklist(a)])),
    students: [...ids].map((id) => ({ id, name: nameOf(id) })),
    counselorNames: Object.fromEntries(counselors.map((c) => [c.id, c.name])),
    ...programBank(),
  });
}

/**
 * Application context for the detail page. New applications exist only in the
 * counselor's browser, so their id encodes `appn~student~program~intake~x`; the
 * server re-checks access to that student and that the programme exists.
 */
export async function getApplicationBundle(counselorId: string, id: string) {
  const base = world.applications.find((a) => a.id === id) ?? null;
  const [tag, sid, pid, iid] = id.split("~");
  const studentId = base?.studentId ?? (tag === "appn" ? sid : null);
  const programId = base?.programId ?? pid;
  const intakeId = base?.intakeId ?? iid;
  if (!studentId) return null;
  const header = await getStudentHeader(counselorId, studentId);
  const program = programs.find((p) => p.id === programId);
  if (!header || !program || !program.intakes.some((i) => i.id === intakeId)) return null;
  const c = world.cases.find((x) => x.studentId === studentId)!;
  return {
    id, base, baseChecklist: base ? baseChecklist(base) : null,
    student: { id: studentId, name: header.name },
    package: pkgOf(c.packageId), program, intakeId,
    university: universities.find((u) => u.id === program.universityId)!.name,
    city: cities.find((x) => x.id === program.cityId)!.name,
    counselorNames: Object.fromEntries(counselors.map((x) => [x.id, x.name])),
  };
}
