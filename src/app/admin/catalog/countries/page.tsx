import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getCatalog } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { CatalogTabs } from "../catalog-tabs";
import { CountriesView } from "./countries-view";

export const metadata = { title: "Countries" };

export default async function CountriesPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await getCatalog();
  return (
    <>
      <PageHead title="Countries" description="Country-wide guidance: grading, language rules, intakes, routes, documents and fees. Universities and programmes can override any of it." />
      <div className="mb-5"><CatalogTabs /></div>
      <CountriesView key={admin.id} admin={admin} data={data} />
    </>
  );
}
