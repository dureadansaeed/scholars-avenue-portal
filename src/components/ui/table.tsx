import { cx } from "@/lib/cx";

// Fixed layout stops one long string from stealing width. Keep the container
// bounded (max-h) so large lists never render unbounded (PRD 11.2).
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-auto", className ?? "max-h-[32rem]")}>
      <table className="w-full table-fixed border-collapse text-left text-tiny">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="material-thin sticky top-0 z-10 backdrop-saturate-150"><tr className="border-b border-line">{children}</tr></thead>;
}
export function TH({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cx("px-4 py-2.5 text-micro font-medium tracking-wide text-n-500 uppercase", className)}>{children}</th>;
}
export function TR({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cx("border-b border-line align-top transition-colors last:border-0 hover:bg-n-850/70", className)}>{children}</tr>;
}
export function TD({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cx("px-4 py-3", className)}>{children}</td>;
}
