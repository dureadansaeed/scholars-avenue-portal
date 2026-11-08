import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaseStatusChip, Tag } from "@/components/ui/chips";
import { Avatar } from "@/components/ui/domain";
import { Skeleton } from "@/components/ui/panels";
import { getStudentHeader } from "@/lib/data/counselor";
import { getCurrentCounselorId } from "@/lib/session";
import { countryName } from "@/mocks/countries";
import { WorkspaceTabs } from "./workspace-tabs";

async function Header({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await getStudentHeader(await getCurrentCounselorId(), id);
  // Another counselor's student and an unknown id are indistinguishable.
  if (!h) notFound();
  return (
    <header className="mb-6 border-b border-line">
      <div className="flex flex-wrap items-center gap-4 pb-4">
        <Avatar name={h.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold text-n-100">{h.name}</h1>
          <p className="truncate text-sm text-n-400">{h.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {h.access === "shared" && <Tag>Shared case · owner {h.ownerName}</Tag>}
          <Tag>{h.packageName}</Tag>
          {h.countries.map((c) => <Tag key={c}>{countryName(c)}</Tag>)}
          <CaseStatusChip status={h.caseStatus} />
        </div>
      </div>
      <WorkspaceTabs studentId={h.id} />
    </header>
  );
}

export default function StudentWorkspaceLayout({ children, params }: LayoutProps<"/counselor/students/[id]">) {
  return (
    <>
      <Suspense fallback={<Skeleton className="mb-6 h-28" />}><Header params={params} /></Suspense>
      {children}
    </>
  );
}
