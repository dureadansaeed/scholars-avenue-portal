"use client";

import { cloneElement, isValidElement, useId } from "react";
import type { InputHTMLAttributes, ReactElement, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

// Every control shares one class string so they cannot drift. Fields stay
// rounded rectangles: a pill input reads as a button.
const control =
  "rounded-sm border border-line-strong bg-surface px-3 py-1.5 text-sm text-n-100 " +
  "transition-[border-color,box-shadow] outline-none placeholder:text-n-500 " +
  "hover:border-n-500 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/18 " +
  "disabled:bg-n-850 disabled:text-n-500 aria-[invalid=true]:border-bad-400 aria-[invalid=true]:focus:ring-bad-400/20";

// Full width unless the caller sets its own width, so `w-auto` and `max-w-64` actually apply.
const width = (className?: string) => (className && /(^|\s)(w|max-w|min-w)-/.test(className) ? "" : "w-full");

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(control, width(className), className)} {...rest} />;
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(control, "h-8 py-0", width(className), className)} {...rest}>{children}</select>;
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(control, "resize-y", width(className), className)} {...rest} />;
}

/**
 * Label + control + hint + error, auto-wired with htmlFor / aria-describedby.
 * Required and optional are both stated, never implied by an asterisk alone.
 */
export function Field({ label, hint, error, required, optional, children, className }: {
  label: string; hint?: React.ReactNode; error?: string; required?: boolean; optional?: boolean;
  children: ReactElement<Record<string, unknown>>; className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const described = [hint && hintId, error && errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 flex items-baseline gap-1.5 text-micro font-medium tracking-wide text-n-400 uppercase">
        {label}
        {required && <span className="text-n-500 normal-case tracking-normal">Required</span>}
        {optional && <span className="text-n-500 normal-case tracking-normal">Optional</span>}
      </label>
      {isValidElement(children)
        ? cloneElement(children, { id, "aria-describedby": described, "aria-invalid": error ? true : undefined })
        : children}
      {hint && <p id={hintId} className="mt-1 text-tiny leading-relaxed text-n-500">{hint}</p>}
      {error && <p id={errId} role="alert" className="mt-1 text-tiny leading-relaxed text-bad-400">{error}</p>}
    </div>
  );
}

export function Checkbox({ label, hint, className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className={cx("flex items-start gap-2.5", rest.disabled && "opacity-50", className)}>
      <input id={id} type="checkbox" className="mt-0.5 size-4 accent-blue-500" {...rest} />
      <label htmlFor={id} className="text-sm leading-snug text-n-200">
        {label}
        {hint && <span className="block text-tiny text-n-500">{hint}</span>}
      </label>
    </div>
  );
}

/** iOS switch: for settings that apply immediately. Use Checkbox when a Save follows. */
export function Switch({ checked, onChange, label, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx("press relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[2px] transition-colors duration-200 disabled:opacity-50",
        checked ? "bg-ok-400" : "bg-n-700")}>
      <span className={cx("size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out", checked && "translate-x-4")} />
    </button>
  );
}
