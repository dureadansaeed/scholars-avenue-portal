import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getAuditTrail } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { AuditView } from "./audit-view";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const trail = await getAuditTrail();
  return (
    <>
      <PageHead title="Audit log" description="Who changed what, when, and why. Entries are permanent: they cannot be edited or deleted from here." />
      <AuditView key={admin.id} admin={admin} trail={trail} />
    </>
  );
}
