import "server-only";
import { cookies } from "next/headers";

// DEMO STAND-IN for authentication. Real sign-in replaces this file; pages only
// ever ask "who is the current student?", so nothing else changes.
export const DEMO_STUDENT_COOKIE = "sa_demo_student";
export const DEFAULT_DEMO_STUDENT = "stu-001";

export async function getCurrentStudentId(): Promise<string> {
  const store = await cookies();
  return store.get(DEMO_STUDENT_COOKIE)?.value ?? DEFAULT_DEMO_STUDENT;
}

export const DEMO_ADMIN_COOKIE = "sa_demo_admin";
export const DEFAULT_DEMO_ADMIN = "adm-1";

export async function getCurrentAdminId(): Promise<string> {
  const store = await cookies();
  return store.get(DEMO_ADMIN_COOKIE)?.value ?? DEFAULT_DEMO_ADMIN;
}

export const DEMO_COUNSELOR_COOKIE = "sa_demo_counselor";
export const DEFAULT_DEMO_COUNSELOR = "cns-1";

export async function getCurrentCounselorId(): Promise<string> {
  const store = await cookies();
  return store.get(DEMO_COUNSELOR_COOKIE)?.value ?? DEFAULT_DEMO_COUNSELOR;
}
