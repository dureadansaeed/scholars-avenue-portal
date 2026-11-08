import { listDemoAdmins, getAdminBadges } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { AdminSwitcher } from "./admin-switcher";
import { StaticBadgeSync } from "./static-badge-sync";

// Both read the request cookie, so each renders inside a <Suspense> boundary.
export async function AdminViewer() {
  const [current, admins] = await Promise.all([getCurrentAdminId(), listDemoAdmins()]);
  return <AdminSwitcher current={current} admins={admins} />;
}

export async function AdminBadges() {
  const b = await getAdminBadges();
  return <StaticBadgeSync badges={{ "/admin/students": b.unassigned, "/admin/counselors": b.coverage, "/admin/catalog": b.stale }} />;
}
