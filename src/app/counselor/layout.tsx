import type { Metadata } from "next";
import { Suspense } from "react";
import { CounselorBadges } from "@/components/shell/counselor-badges";
import { CounselorViewer } from "@/components/shell/counselor-viewer";
import { counselorNav } from "@/components/shell/nav";
import { PortalShell } from "@/components/shell/portal-shell";
import { Skeleton } from "@/components/ui/panels";

export const metadata: Metadata = { title: { default: "Counselor", template: "%s · Counselor · Scholars Avenue" } };

export default function CounselorLayout({ children }: LayoutProps<"/counselor">) {
  return (
    <PortalShell portal="Counselor portal" groups={counselorNav}
      sync={<Suspense fallback={null}><CounselorBadges /></Suspense>}
      footer={<Suspense fallback={<Skeleton className="h-[74px]" />}><CounselorViewer /></Suspense>}>
      {children}
    </PortalShell>
  );
}
