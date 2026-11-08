import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getAdmin, listUsers } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { packages } from "@/mocks/cases";
import { countries } from "@/mocks/countries";
import { UsersView } from "./users-view";

export const metadata = { title: "Users and access" };

export default async function UsersPage() {
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const rows = await listUsers();
  return (
    <>
      <PageHead title="Users and access" description="Every account in the organisation. Deactivating removes access straight away and keeps all of the person's history." />
      <UsersView key={admin.id} admin={admin} rows={rows}
        packages={packages.map((p) => ({ id: p.id, name: p.name }))} countries={countries.filter((c) => c.active).map((c) => ({ code: c.code, name: c.name }))} />
    </>
  );
}
