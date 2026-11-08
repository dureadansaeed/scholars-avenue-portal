import { Suspense } from "react";
import { PageHead } from "@/components/ui/navigation";
import { Skeleton } from "@/components/ui/panels";
import { getMatchableStudents, programBank } from "@/lib/data/counselor-work";
import { getCurrentCounselorId } from "@/lib/session";
import { ProgramBank } from "./program-bank";

export const metadata = { title: "Program bank" };

export default async function ProgramsPage() {
  const counselorId = await getCurrentCounselorId();
  const students = await getMatchableStudents(counselorId);
  return (
    <>
      <PageHead title="Program bank" description="Search the catalog, then choose a student to see how each programme compares with their record." />
      {/* useSearchParams (for ?student=) is request-time, so it streams in behind Suspense */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProgramBank counselorId={counselorId} bank={programBank()} students={students} />
      </Suspense>
    </>
  );
}
