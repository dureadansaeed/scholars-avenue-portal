import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHead } from "@/components/ui/navigation";
import { Skeleton } from "@/components/ui/panels";
import { getAdmin, getCatalog } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { CatalogTabs } from "./catalog-tabs";
import { ProgramsList } from "./programs-list";

export const metadata = { title: "Programme catalog" };

export default async function CatalogPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await getCatalog();
  return (
    <>
      <PageHead title="Programme catalog" description="Programmes, their intakes and requirements, with where each fact came from and when it was last checked. Records are archived, never deleted." />
      <div className="mb-5"><CatalogTabs /></div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProgramsList key={admin.id} admin={admin} data={data} />
      </Suspense>
    </>
  );
}
