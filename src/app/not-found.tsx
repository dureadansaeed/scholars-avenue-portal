import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-micro font-medium tracking-wide text-n-500 uppercase">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-n-100">We could not find that page</h1>
        <p className="mt-2 text-base text-n-400">It may have moved, or you may not have access to it.</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6")}>Back to start</Link>
      </div>
    </div>
  );
}
