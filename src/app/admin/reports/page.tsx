import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getOperationalData } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { ReportsView } from "./reports-view";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await getOperationalData();
  return (
    <>
      <PageHead title="Reports" description="Operational counts with their date range, filters and definitions shown. They describe workload and progress, not counselor performance or admission success." />
      <ReportsView key={admin.id} admin={admin} data={data} />
    </>
  );
}
