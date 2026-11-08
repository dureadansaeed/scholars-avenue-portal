import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getCatalog } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { CatalogTabs } from "../catalog-tabs";
import { CitiesView } from "./cities-view";

export const metadata = { title: "Cities" };

export default async function CitiesPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await getCatalog();
  return (
    <>
      <PageHead title="Cities and locations" description="Where campuses are, with general living information for students. City notes are guidance, never a programme requirement or a guaranteed cost." />
      <div className="mb-5"><CatalogTabs /></div>
      <CitiesView key={admin.id} admin={admin} data={data} />
    </>
  );
}
