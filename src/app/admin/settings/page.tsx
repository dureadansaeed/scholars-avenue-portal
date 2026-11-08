import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, getSettingsDefaults } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { SettingsView } from "./settings-view";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const defaults = await getSettingsDefaults();
  return (
    <>
      <PageHead title="Settings" description="Labels, packages, categories, templates and limits the organisation runs on. Every change is recorded in the audit log." />
      <SettingsView key={admin.id} admin={admin} defaults={defaults} />
    </>
  );
}
