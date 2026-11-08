import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getCatalog, getImportHistory } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { ImportView } from "./import-view";

export const metadata = { title: "Import and export" };

export default async function ImportPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const [catalog, history] = await Promise.all([getCatalog(), getImportHistory()]);
  return (
    <>
      <PageHead title="Import and export" description="Bring programmes in from a spreadsheet, checked row by row before anything is applied. Imported records start as pending review, never verified." />
      <ImportView key={admin.id} admin={admin} catalog={catalog} history={history} />
    </>
  );
}
