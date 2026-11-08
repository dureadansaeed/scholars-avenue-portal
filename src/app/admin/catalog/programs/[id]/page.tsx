import { notFound } from "next/navigation";
import { Suspense } from "react";
import PortalLoading from "@/components/shell/portal-loading";
import { getAdmin, getCatalog } from "@/lib/data/admin";
import { getCurrentAdminId } from "@/lib/session";
import { ProgramEditor } from "./program-editor";

export const metadata = { title: "Programme" };

async function ProgramPageContent({ params }: Pick<PageProps<"/admin/catalog/programs/[id]">, "params">) {
  const { id } = await params;
  const admin = await getAdmin(await getCurrentAdminId());
  if (!admin) notFound();
  const data = await getCatalog();
  // "new", and programmes created in this browser, are resolved on the client.
  return <ProgramEditor key={id} admin={admin} id={id} data={data} />;
}

// `params` is request-time data, so it is awaited inside a Suspense boundary.
export default function ProgramPage(props: Pick<PageProps<"/admin/catalog/programs/[id]">, "params">) {
  return <Suspense fallback={<PortalLoading />}><ProgramPageContent {...props} /></Suspense>;
}
