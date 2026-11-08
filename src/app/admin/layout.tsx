import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBadges, AdminViewer } from "@/components/shell/admin-viewer";
import { adminNav } from "@/components/shell/nav";
import { PortalShell } from "@/components/shell/portal-shell";
import { Skeleton } from "@/components/ui/panels";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Scholars Avenue" } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <PortalShell portal="Admin portal" groups={adminNav}
      sync={<Suspense fallback={null}><AdminBadges /></Suspense>}
      footer={<Suspense fallback={<Skeleton className="h-[74px]" />}><AdminViewer /></Suspense>}>
      {children}
    </PortalShell>
  );
}
