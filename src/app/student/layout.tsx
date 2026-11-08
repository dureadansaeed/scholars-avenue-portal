import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoViewer } from "@/components/shell/demo-viewer";
import { studentNav } from "@/components/shell/nav";
import { StudentBadges } from "@/components/shell/student-badges";
import { PortalShell } from "@/components/shell/portal-shell";
import { Skeleton } from "@/components/ui/panels";

export const metadata: Metadata = { title: { default: "Student", template: "%s · Student · Scholars Avenue" } };

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return (
    <PortalShell portal="Student portal" groups={studentNav}
      sync={<Suspense fallback={null}><StudentBadges /></Suspense>}
      footer={<Suspense fallback={<Skeleton className="h-[74px]" />}><DemoViewer /></Suspense>}>
      {children}
    </PortalShell>
  );
}
