import { notFound } from "next/navigation";
import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { getAdmin, getUserDetail } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { UserDetail } from "./user-detail";

export const metadata = { title: "User" };

async function UserPageContent({ params }: Pick<PageProps<"/admin/users/[id]">, "params">) {
  const { id } = await params;
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  // Accounts invited in this browser exist only on the client, so a missing base record is resolved there.
  const data = await getUserDetail(id);
  return <UserDetail admin={admin} id={id} data={data} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary.
export default function UserPage(props: Pick<PageProps<"/admin/users/[id]">, "params">) {
  return <Suspense fallback={<PortalLoading />}><UserPageContent {...props} /></Suspense>;
}
