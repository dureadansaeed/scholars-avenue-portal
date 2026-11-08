"use client";

import { motion as m } from "motion/react";
import { springFor } from "@/lib/motion";

// Used from template.tsx, which React remounts on every navigation, so the
// entrance plays per page without reading the pathname.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={springFor()}>
      {children}
    </m.div>
  );
}
