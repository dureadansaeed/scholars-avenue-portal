"use client";

import { Button } from "@/components/ui/button";
import { Empty, Section } from "@/components/ui/panels";

// Production errors must not expose stack traces or student data (PRD 10.18),
// so nothing from the error object is rendered.
export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Section>
      <Empty title="Something went wrong" action={<Button variant="primary" onClick={reset}>Try again</Button>}>
        We could not load this page. Your saved information is safe. If it keeps happening, contact your counselor.
      </Empty>
    </Section>
  );
}
