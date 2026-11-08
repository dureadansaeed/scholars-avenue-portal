"use client";

import type { ButtonHTMLAttributes } from "react";
import { usePress } from "@/lib/usePress";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-styles";
import { Icon } from "./icons";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  busy?: boolean;
}

export function Button({ variant = "secondary", size = "md", busy, disabled, className, children, type = "button", ...rest }: Props) {
  const isDisabled = disabled || busy;
  // usePress supplies the instant pointer-down feedback (data-pressed) with
  // drag-away cancel; the native click still commits the action, so forms and
  // keyboard activation behave normally.
  const { pressed, handlers } = usePress(undefined, isDisabled);
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={busy || undefined}
      data-pressed={pressed}
      className={buttonClass(variant, size, className)}
      {...handlers}
      {...rest}
    >
      {busy && <Icon.Spinner className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}
