import type { Icon } from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof Icon;
  /** Planned in FrontendProgress.md but not built yet: rendered disabled. */
  soon?: boolean;
  exact?: boolean;
}
export interface NavGroup { label: string; items: NavItem[] }

export const studentNav: NavGroup[] = [
  { label: "Overview", items: [
    { href: "/student", label: "Home", icon: "Home", exact: true },
    { href: "/student/profile", label: "Profile", icon: "User" },
    { href: "/student/documents", label: "Documents", icon: "File" },
  ] },
  { label: "Applying", items: [
    { href: "/student/programs", label: "Programmes", icon: "Book" },
    { href: "/student/applications", label: "Applications", icon: "Send" },
    { href: "/student/tasks", label: "Tasks", icon: "CheckCircle" },
  ] },
  { label: "Stay in touch", items: [
    { href: "/student/timeline", label: "Timeline", icon: "Clock" },
    { href: "/student/notifications", label: "Notifications", icon: "Bell" },
  ] },
];

export const counselorNav: NavGroup[] = [
  { label: "Workspace", items: [
    { href: "/counselor", label: "Dashboard", icon: "Home", exact: true },
    { href: "/counselor/students", label: "My students", icon: "Users" },
    { href: "/counselor/programs", label: "Program bank", icon: "Book" },
    { href: "/counselor/applications", label: "Applications", icon: "Send" },
    { href: "/counselor/tasks", label: "Tasks", icon: "CheckCircle" },
    { href: "/counselor/agenda", label: "Agenda", icon: "Clock" },
    { href: "/counselor/notifications", label: "Notifications", icon: "Bell" },
  ] },
];

export const adminNav: NavGroup[] = [
  { label: "Operations", items: [
    { href: "/admin", label: "Overview", icon: "Home", exact: true },
    { href: "/admin/students", label: "Students and cases", icon: "Users" },
    { href: "/admin/counselors", label: "Counselors", icon: "User" },
    { href: "/admin/users", label: "Users and access", icon: "Lock" },
  ] },
  { label: "Catalog", items: [
    { href: "/admin/catalog", label: "Programme catalog", icon: "Book" },
    { href: "/admin/import", label: "Import / export", icon: "Upload" },
  ] },
  { label: "Oversight", items: [
    { href: "/admin/applications", label: "Applications", icon: "Send" },
    { href: "/admin/reports", label: "Reports", icon: "List" },
    { href: "/admin/audit", label: "Audit log", icon: "Eye" },
    { href: "/admin/settings", label: "Settings", icon: "Globe" },
  ] },
];
