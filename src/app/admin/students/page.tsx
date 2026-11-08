import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHead } from "@/components/ui/navigation";
import { Skeleton } from "@/components/ui/panels";
import { getAdmin, listCasesForAdmin } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { CasesView } from "./cases-view";

export const metadata = { title: "Students and cases" };

export default async function StudentsPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await listCasesForAdmin();
  return (
    <>
      <PageHead title="Students and cases" description="Every student case in the organisation. Assign counselors, change a case's status with a reason, and confirm payment." />
      {/* ?view= and ?case= are read with useSearchParams, which streams behind Suspense */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <CasesView key={admin.id} admin={admin} data={data} />
      </Suspense>
    </>
  );
}
