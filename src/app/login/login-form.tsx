"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Segmented } from "@/components/ui/navigation";
import { Note } from "@/components/ui/panels";
import type { Role } from "@/types";

// UI only: accepts any mock credential and routes to the chosen portal. Real
// authentication replaces the submit handler and nothing else.
export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <form
      noValidate
      className="w-full max-w-sm space-y-5 rounded-lg border border-line bg-surface p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) { setError("Enter an email address like name@example.com."); return; }
        setError(undefined); setBusy(true);
        router.push(`/${role}`);
      }}
    >
      <div>
        <span className="grid size-9 place-items-center rounded-md bg-accent text-n-950"><Icon.Logo className="size-5" /></span>
        <h1 className="mt-4 text-xl font-semibold text-n-100">Sign in</h1>
        <p className="mt-1 text-sm text-n-400">Welcome back to Scholars Avenue.</p>
      </div>
      <Segmented label="Portal" value={role} onChange={setRole} size="sm"
        options={[{ value: "student", label: "Student" }, { value: "counselor", label: "Counselor" }, { value: "admin", label: "Admin" }]} />
      <Field label="Email" required error={error}>
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
      </Field>
      <Field label="Password" required>
        <Input type="password" autoComplete="current-password" placeholder="Any value in this demo" />
      </Field>
      <Button type="submit" variant="primary" busy={busy} className="w-full">Continue</Button>
      <Note>Demo only. No password is checked and nothing is stored.</Note>
    </form>
  );
}
