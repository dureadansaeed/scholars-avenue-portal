"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchDemoCounselor } from "@/app/actions";
import { Select } from "@/components/ui/form";

/** Demo stand-in for sign-in: choose which mock counselor you are acting as. */
export function CounselorSwitcher({ current, counselors }: { current: string; counselors: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2.5">
      <label htmlFor="demo-counselor" className="block text-micro font-medium tracking-wide text-n-500 uppercase">Demo: signed in as</label>
      <Select id="demo-counselor" className="mt-1.5" value={current} disabled={pending}
        onChange={(e) => start(async () => { await switchDemoCounselor(e.target.value); router.refresh(); })}>
        {counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
    </div>
  );
}
