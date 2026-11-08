"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchDemoStudent } from "@/app/actions";
import { Select } from "@/components/ui/form";

/** Demo stand-in for sign-in: choose which mock student to view as. */
export function StudentSwitcher({ current, students }: { current: string; students: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2.5">
      <label htmlFor="demo-student" className="block text-micro font-medium tracking-wide text-n-500 uppercase">Demo: viewing as</label>
      <Select id="demo-student" className="mt-1.5" value={current} disabled={pending}
        onChange={(e) => start(async () => { await switchDemoStudent(e.target.value); router.refresh(); })}>
        {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
    </div>
  );
}
