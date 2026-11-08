"use client";

import { Icon } from "@/components/ui/icons";
import { useAdminWork } from "@/lib/admin-work";
import type { AdminPermission } from "@/types";

export interface AdminIdentity { id: string; name: string; permissions: AdminPermission[] }

export const PERMISSION_LABEL: Record<AdminPermission, string> = {
  "users.manage": "Manage users and accounts",
  "assignments.manage": "Assign and reassign students",
  "catalog.manage": "Edit the programme catalog",
  "settings.manage": "Change organisation settings",
  "reports.export": "Export reports",
  "audit.view": "View the audit log",
};
export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABEL) as AdminPermission[];

/**
 * Effective permissions for the signed-in admin, including changes another
 * admin made in this browser. In production this check is the server's job
 * (PRD 4.4); the UI only mirrors it so nobody is offered an action that would fail.
 */
export function usePermissions(admin: AdminIdentity) {
  const { work } = useAdminWork(admin.id);
  const permissions = work.users[admin.id]?.permissions ?? admin.permissions;
  return {
    permissions,
    can: (p: AdminPermission) => permissions.includes(p),
    why: (p: AdminPermission) => `Needs the “${PERMISSION_LABEL[p]}” permission.`,
  };
}

/** Shown where a whole area is read-only for this admin. */
export function ReadOnlyNote({ perm }: { perm: AdminPermission }) {
  return (
    <p className="flex items-center gap-2 rounded-sm border border-line bg-raised px-3 py-2 text-tiny text-n-300">
      <Icon.Lock className="size-3.5 shrink-0" />
      Read-only for you. Changes here need the “{PERMISSION_LABEL[perm]}” permission; ask an administrator who has it.
    </p>
  );
}
