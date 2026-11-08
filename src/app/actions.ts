"use server";

import { cookies } from "next/headers";
import { admins, counselors, students } from "@/mocks/users";
import { DEMO_ADMIN_COOKIE, DEMO_COUNSELOR_COOKIE, DEMO_STUDENT_COOKIE } from "@/lib/session";

// Demo stand-in: lets a reviewer switch which mock student they are viewing.
export async function switchDemoStudent(studentId: string) {
  if (!students.some((s) => s.id === studentId)) return;
  (await cookies()).set(DEMO_STUDENT_COOKIE, studentId, { path: "/", sameSite: "lax", httpOnly: true });
}

export async function switchDemoCounselor(counselorId: string) {
  if (!counselors.some((c) => c.id === counselorId && c.active)) return;
  (await cookies()).set(DEMO_COUNSELOR_COOKIE, counselorId, { path: "/", sameSite: "lax", httpOnly: true });
}

export async function switchDemoAdmin(adminId: string) {
  if (!admins.some((a) => a.id === adminId && a.active)) return;
  (await cookies()).set(DEMO_ADMIN_COOKIE, adminId, { path: "/", sameSite: "lax", httpOnly: true });
}
