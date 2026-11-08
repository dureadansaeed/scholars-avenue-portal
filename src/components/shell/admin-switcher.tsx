"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchDemoAdmin } from "@/app/actions";
import { Select } from "@/components/ui/form";

/** Demo stand-in for sign-in: choose which mock administrator you are acting as. */
export function AdminSwitcher({ current, admins }: { current: string; admins: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2.5">
      <label htmlFor="demo-admin" className="block text-micro font-medium tracking-wide text-n-500 uppercase">Demo: signed in as</label>
      <Select id="demo-admin" className="mt-1.5" value={current} disabled={pending}
        onChange={(e) => start(async () => { await switchDemoAdmin(e.target.value); router.refresh(); })}>
        {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
    </div>
  );
}
