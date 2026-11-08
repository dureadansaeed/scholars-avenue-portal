"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Note, Section } from "@/components/ui/panels";
import type { StudentProfile } from "@/types";
import { applyPersonal, maskSensitive, toDraft, validatePersonal, type PersonalDraft } from "./profile-utils";
import { ReviewLine } from "./review-line";

export function PersonalSection({ profile, reviewerNames, savedAt, onSave }: {
  profile: StudentProfile; reviewerNames: Record<string, string>; savedAt?: string; onSave: (p: StudentProfile) => void;
}) {
  const [draft, setDraft] = useState<PersonalDraft>(() => toDraft(profile));
  const [errors, setErrors] = useState<ReturnType<typeof validatePersonal>>({});
  const [reveal, setReveal] = useState(false);
  const original = toDraft(profile);

  const set = (k: keyof PersonalDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  // A verified field that has been edited will go back to review on save.
  const reverify = (["fullName", "dateOfBirth", "passportNumber", "nationality"] as const).filter(
    (k) => profile.review[k]?.status === "verified" && draft[k].trim() !== original[k].trim(),
  );

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validatePersonal(draft);
    setErrors(found);
    if (Object.keys(found).length === 0) onSave(applyPersonal(profile, draft));
  };

  return (
    <Section id="personal" title="Personal details" description="As they appear on your passport. Your counselor reviews these.">
      <form onSubmit={save} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Field label="Full legal name" required error={errors.fullName}>
              <Input value={draft.fullName} onChange={set("fullName")} autoComplete="name" />
            </Field>
            <ReviewLine review={profile.review.fullName} reviewerNames={reviewerNames} />
          </div>
          <Field label="Preferred name" optional><Input value={draft.preferredName} onChange={set("preferredName")} /></Field>
          <div>
            <Field label="Date of birth" required error={errors.dateOfBirth}>
              <Input type="date" value={draft.dateOfBirth} onChange={set("dateOfBirth")} />
            </Field>
            <ReviewLine review={profile.review.dateOfBirth} reviewerNames={reviewerNames} />
          </div>
          <Field label="Nationality" required><Input value={draft.nationality} onChange={set("nationality")} /></Field>
          <Field label="Country of residence" required><Input value={draft.countryOfResidence} onChange={set("countryOfResidence")} /></Field>
          <Field label="City of residence" required><Input value={draft.city} onChange={set("city")} /></Field>
          <Field label="Email" hint="This is your sign-in email. Contact your counselor to change it.">
            <Input value={profile.email} readOnly disabled />
          </Field>
          <Field label="Preferred language for communication" optional><Input value={draft.communicationLanguage} onChange={set("communicationLanguage")} /></Field>
          <Field label="Primary phone" required error={errors.phone} hint="Include the country code.">
            <Input type="tel" value={draft.phone} onChange={set("phone")} autoComplete="tel" />
          </Field>
          <Field label="Secondary phone" optional error={errors.phoneSecondary}>
            <Input type="tel" value={draft.phoneSecondary} onChange={set("phoneSecondary")} />
          </Field>
        </div>
        <Field label="Current address" optional><Textarea rows={2} value={draft.address} onChange={set("address")} /></Field>

        <div className="rounded-md border border-line bg-raised p-4">
          <p className="text-sm font-medium text-n-100">Passport</p>
          <p className="mt-0.5 text-tiny text-n-400">Sensitive. Only you and your counselor can see this, and it is hidden by default.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Field label="Passport number" optional error={errors.passportNumber}>
                {reveal
                  ? <Input value={draft.passportNumber} onChange={set("passportNumber")} autoComplete="off" />
                  : <Input value={maskSensitive(draft.passportNumber)} readOnly aria-label="Passport number (hidden)" />}
              </Field>
              <ReviewLine review={profile.review.passportNumber} reviewerNames={reviewerNames} />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>{reveal ? "Hide and lock" : "Show to edit"}</Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-line bg-raised p-4">
          <p className="text-sm font-medium text-n-100">Emergency contact <span className="text-tiny font-normal text-n-500">Optional</span></p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name" error={errors.ecName}><Input value={draft.ecName} onChange={set("ecName")} /></Field>
            <Field label="Relationship"><Input value={draft.ecRelation} onChange={set("ecRelation")} /></Field>
            <Field label="Phone" error={errors.ecPhone}><Input type="tel" value={draft.ecPhone} onChange={set("ecPhone")} /></Field>
          </div>
        </div>

        {reverify.length > 0 && (
          <Note tone="warn" title="Your counselor will review this again">
            {reverify.join(", ")} {reverify.length === 1 ? "was" : "were"} verified. If you save, the earlier value is kept in history and the field returns to review.
          </Note>
        )}
        {Object.keys(errors).length > 0 && <Note tone="bad" title="Please fix the highlighted fields">Nothing you typed has been lost.</Note>}

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">Save personal details</Button>
          {savedAt && <span role="status" className="text-tiny text-ok-400">Saved. You can come back and continue later.</span>}
        </div>
      </form>
    </Section>
  );
}
