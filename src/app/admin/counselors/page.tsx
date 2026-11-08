import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, listCasesForAdmin } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { CounselorsView } from "./counselors-view";

export const metadata = { title: "Counselors" };

export default async function CounselorsPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await listCasesForAdmin();
  return (
    <>
      <PageHead title="Counselors" description="Workload against each counselor's limit, and cases that need cover because their counselor is away or inactive." />
      <CounselorsView key={admin.id} admin={admin} data={data} />
    </>
  );
}
