import { cx } from "@/lib/cx";
import { Icon } from "./icons";

export function Section({ title, description, actions, flush, children, className, id }: {
  title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; flush?: boolean;
  children?: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={cx("scroll-mt-20 rounded-lg border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-tight text-n-100">{title}</h2>}
            {description && <p className="mt-0.5 text-tiny leading-relaxed text-n-400">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children != null && <div className={cx(title || actions ? "border-t border-line" : "", !flush && "p-5")}>{children}</div>}
    </section>
  );
}

export function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-micro font-medium tracking-wide text-n-500 uppercase">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-n-100">
        {value}
        {hint && <span className="block text-tiny font-normal text-n-500">{hint}</span>}
      </dd>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-n-300">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-tiny text-n-500">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

const NOTE: Record<"info" | "warn" | "bad" | "ok", string> = {
  info: "border-line bg-info-tint text-n-200", warn: "border-warn-400/25 bg-warn-tint text-n-200",
  bad: "border-bad-400/25 bg-bad-tint text-n-200", ok: "border-ok-400/25 bg-ok-tint text-n-200",
};
const NOTE_ICON = { info: Icon.Info, warn: Icon.Alert, bad: Icon.Alert, ok: Icon.CheckCircle };

export function Note({ tone = "info", title, children, action, className }: {
  tone?: keyof typeof NOTE; title?: string; children?: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  const G = NOTE_ICON[tone];
  return (
    <div role={tone === "bad" ? "alert" : "note"} className={cx("flex items-start gap-3 rounded-sm border px-3 py-2.5 text-sm", NOTE[tone], className)}>
      <G className="mt-0.5 size-4 shrink-0 opacity-70" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cx("leading-relaxed", title && "opacity-85")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const band = (v: number) => (v >= 85 ? "bg-ok-400" : v >= 60 ? "bg-blue-500" : v >= 35 ? "bg-warn-400" : "bg-bad-400");
const bandText = (v: number) => (v >= 85 ? "text-ok-400" : v >= 60 ? "text-link" : v >= 35 ? "text-warn-400" : "text-bad-400");

/**
 * `score` (default): higher is better, coloured by band. `load`: higher is worse,
 * blue until 80% of the limit, amber up to it, red past it. `neutral`: a share of
 * a whole, where no value is good or bad.
 */
export function Meter({ label, value, max = 100, tone = "score" }: { label: string; value: number; max?: number; tone?: "score" | "load" | "neutral" }) {
  const raw = max > 0 ? (value / max) * 100 : 0;
  const pct = Math.min(100, Math.round(raw));
  const fill = tone === "neutral" ? "bg-n-400" : tone === "load" ? (raw > 100 ? "bg-bad-400" : raw >= 80 ? "bg-warn-400" : "bg-blue-500") : band(pct);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-n-200">{label}</span>
        <span className={cx("text-tiny tabular-nums", tone === "load" && raw > 100 ? "text-bad-400" : "text-n-400")}>{value}<span className="text-n-500"> / {max}</span></span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-n-800" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className={cx("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ScoreRing({ value, size = 42, stroke = 3.5, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ring = value >= 75 ? "text-ok-400" : value >= 55 ? "text-link" : value >= 40 ? "text-warn-400" : "text-bad-400";
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${value} percent`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-n-100/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className={cx(ring, "transition-[stroke-dashoffset] duration-700 ease-out")} />
      </svg>
      <span className={cx("absolute font-semibold tabular-nums", size >= 80 ? "text-xl" : "text-micro")}>{value}{size >= 80 && <span className="text-tiny text-n-500">%</span>}</span>
    </div>
  );
}

export function StageBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-micro font-medium tracking-wide text-n-500 uppercase">
        <span>{label}</span><span className="tabular-nums">{value}%</span>
      </div>
      <p className={cx("mt-1 text-2xl font-semibold tabular-nums", bandText(value))}>{value}<span className="text-tiny text-n-500"> / 100</span></p>
      <div className="mt-1.5 h-1 rounded-full bg-n-800"><div className={cx("h-full rounded-full", band(value))} style={{ width: `${value}%` }} /></div>
    </div>
  );
}

/** Nested block inside a panel: one grey step, no extra border weight. */
export function Well({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded-md border border-line bg-raised p-4", className)}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse-dot rounded-sm bg-n-800", className)} />;
}
