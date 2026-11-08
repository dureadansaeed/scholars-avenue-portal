import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { Note } from "@/components/ui/panels";

const ROLES = [
  { href: "/student", title: "Student portal", body: "Profile, documents, shortlisted programmes and application progress.", icon: Icon.User, tint: "bg-tint-1" },
  { href: "/counselor", title: "Counselor portal", body: "Assigned students, the program bank, shortlists and applications.", icon: Icon.Users, tint: "bg-tint-2" },
  { href: "/admin", title: "Admin portal", body: "Users, assignments, the program catalog, reports and audit.", icon: Icon.Globe, tint: "bg-tint-3" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col justify-center px-6 py-16">
      <span className="grid size-10 place-items-center rounded-md bg-accent text-n-950"><Icon.Logo className="size-5" /></span>
      <h1 className="mt-6 text-3xl font-semibold text-n-100">Scholars Avenue</h1>
      <p className="mt-2 max-w-xl text-lg text-n-400">One platform for the whole student journey, from first profile to final offer.</p>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ROLES.map((r) => (
          <Link key={r.href} href={r.href} className={`press group rounded-lg border border-line p-5 transition-colors hover:border-line-strong ${r.tint}`}>
            <r.icon className="size-5 text-n-100" />
            <h2 className="mt-8 text-sm font-semibold text-n-100">{r.title}</h2>
            <p className="mt-1 text-tiny leading-relaxed text-n-300">{r.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-tiny font-medium text-link">Open <Icon.Chevron className="size-3 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
      <Note className="mt-8" title="Demo build">
        Sign-in is a stand-in and all data is sample data. Pick a portal to explore; inside the student portal you can switch between mock students.
      </Note>
      <p className="mt-4 text-tiny text-n-500"><Link href="/login" className="text-link hover:underline">Use the sign-in screen</Link></p>
    </main>
  );
}
