// Two springs, and only two. Call springFor() at animation time, not at module
// load, so the reduced-motion preference is read when it matters.
export const SPRING_UI = { type: "spring", bounce: 0, duration: 0.35 } as const;
export const SPRING_MOMENTUM = { type: "spring", bounce: 0.2, duration: 0.3 } as const;
export const FADE = { duration: 0.18, ease: [0.33, 0, 0.67, 1] } as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export const springFor = (kind: "ui" | "momentum" = "ui") =>
  prefersReducedMotion() ? FADE : kind === "momentum" ? SPRING_MOMENTUM : SPRING_UI;
