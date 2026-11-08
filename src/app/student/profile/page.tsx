import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/navigation";
import { getStudentProfileBundle } from "@/lib/data/student";
import { getCurrentStudentId } from "@/lib/session";
import { ProfileEditor } from "./profile-editor";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const bundle = await getStudentProfileBundle(await getCurrentStudentId());
  if (!bundle) notFound();
  return (
    <>
      <PageHead
        title="Your profile"
        description={`Complete each section at your own pace. ${bundle.counselorName ? `${bundle.counselorName} reviews what you enter and may ask for corrections.` : "Your counselor will review what you enter once assigned."}`}
      />
      <ProfileEditor key={bundle.profile.studentId} bundle={bundle} />
    </>
  );
}
