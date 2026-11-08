import type { Admin, Counselor, User } from "@/types";

// SAMPLE DATA. Names and addresses are invented. One organisation, but every
// record carries orgId so scoping can be added later (PRD 4.4).
export const ORG_ID = "org-1";

export const admins: Admin[] = [
  { id: "adm-1", orgId: ORG_ID, role: "admin", name: "Imran Qureshi", email: "imran@example.test", active: true,
    permissions: ["users.manage", "assignments.manage", "catalog.manage", "settings.manage", "reports.export", "audit.view"] },
  // Limited administrator: shows permission-gated controls disabled (Admin panel C2).
  { id: "adm-2", orgId: ORG_ID, role: "admin", name: "Zara Hussain", email: "zara@example.test", active: true,
    permissions: ["assignments.manage", "audit.view"] },
];

export const counselors: Counselor[] = [
  { id: "cns-1", orgId: ORG_ID, role: "counselor", name: "Sana Malik", email: "sana@example.test", active: true,
    languages: ["English", "Urdu", "German"], countryExpertise: ["DE", "NL", "SE"], absent: false, workloadThreshold: 25 },
  { id: "cns-2", orgId: ORG_ID, role: "counselor", name: "Daniel Weber", email: "daniel@example.test", active: true,
    languages: ["English", "German"], countryExpertise: ["DE", "CZ", "HU"], absent: false, workloadThreshold: 25 },
  { id: "cns-3", orgId: ORG_ID, role: "counselor", name: "Priya Nair", email: "priya@example.test", active: true,
    languages: ["English", "Hindi"], countryExpertise: ["GB", "AU", "US"], absent: true, workloadThreshold: 20 },
  { id: "cns-4", orgId: ORG_ID, role: "counselor", name: "Marco Bellini", email: "marco@example.test", active: false,
    languages: ["English", "Italian"], countryExpertise: ["IT", "FR"], absent: false, workloadThreshold: 20 },
];

export const students: User[] = [
  { id: "stu-001", orgId: ORG_ID, role: "student", name: "Ayesha Khan", email: "ayesha.khan@example.test", active: true },
  { id: "stu-002", orgId: ORG_ID, role: "student", name: "Omar Siddiqui", email: "omar.s@example.test", active: true },
  { id: "stu-003", orgId: ORG_ID, role: "student", name: "Maria Costa", email: "maria.costa@example.test", active: true },
  { id: "stu-004", orgId: ORG_ID, role: "student", name: "Tariq Ahmed", email: "tariq.a@example.test", active: true },
  { id: "stu-005", orgId: ORG_ID, role: "student", name: "Hina Raza", email: "hina.raza@example.test", active: true },
  { id: "stu-006", orgId: ORG_ID, role: "student", name: "Yusuf Demir", email: "yusuf.d@example.test", active: true },
];
