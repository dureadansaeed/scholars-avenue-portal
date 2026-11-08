import { cx } from "@/lib/cx";

// Class strings live apart from the component so server components can style a
// <Link> as a button without importing client code.
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-n-950 font-medium hover:bg-brand-400 disabled:bg-n-700 disabled:text-n-500",
  secondary: "bg-surface text-n-100 border border-line-strong hover:bg-n-850 disabled:bg-n-850 disabled:text-n-500 disabled:border-line",
  ghost: "text-n-300 hover:bg-n-850 hover:text-n-100 disabled:text-n-500 disabled:hover:bg-transparent",
  danger: "bg-bad-400 text-n-950 font-medium hover:brightness-110 disabled:bg-n-700 disabled:text-n-500",
};
const SIZE: Record<ButtonSize, string> = {
  sm: "h-7 gap-1.5 px-3 text-tiny rounded-full",
  md: "h-9 gap-2 px-4 text-sm rounded-full",
};

export const buttonClass = (variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra?: string) =>
  cx(
    "press inline-flex shrink-0 items-center justify-center whitespace-nowrap disabled:cursor-not-allowed",
    VARIANT[variant], SIZE[size], extra,
  );
