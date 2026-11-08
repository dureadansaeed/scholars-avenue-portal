import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getCatalog } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { CatalogTabs } from "../catalog-tabs";
import { UniversitiesView } from "./universities-view";

export const metadata = { title: "Universities" };

export default async function UniversitiesPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await getCatalog();
  return (
    <>
      <PageHead title="Universities" description="Institutions, their campuses and official sites. A ranking is only ever stored with who published it and the year." />
      <div className="mb-5"><CatalogTabs /></div>
      <UniversitiesView key={admin.id} admin={admin} data={data} />
    </>
  );
}
