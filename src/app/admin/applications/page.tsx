import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getOperationalData } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { AdminApplications } from "./admin-applications";

export const metadata = { title: "Applications" };

export default async function AdminApplicationsPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await getOperationalData();
  return (
    <>
      <PageHead title="Applications" description="Every application across counselors and students. Read-only here: counselors move applications forward from their own portal." />
      <AdminApplications key={admin.id} admin={admin} data={data} />
    </>
  );
}
