import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export function GlassCard({
  children,
  className,
  strong,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return <div className={cx("glass rounded-3xl", strong && "glass-strong", className)}>{children}</div>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = "primary", loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-gradient-to-r from-blue to-purple text-white shadow-[0_10px_24px_-10px_rgb(91_92_255/0.7)] hover:brightness-105 active:scale-[0.98]",
        variant === "ghost" && "glass text-ink hover:bg-white/80",
        variant === "danger" && "bg-danger-soft text-danger hover:bg-danger hover:text-white",
        className,
      )}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  prefix?: string;
};

export function TextField({ label, hint, error, prefix, className, ...rest }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        className={cx(
          "flex items-center overflow-hidden rounded-2xl border bg-white/70 transition focus-within:bg-white",
          error ? "border-danger" : "border-ink/10 focus-within:border-blue",
        )}
      >
        {prefix && <span className="shrink-0 pl-4 text-sm text-ink-faint">{prefix}</span>}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cx("w-full bg-transparent py-3 text-ink outline-none placeholder:text-ink-faint", prefix ? "pl-0.5 pr-4" : "px-4")}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-ink-soft">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string };

export function SelectField({ label, className, children, ...rest }: SelectProps) {
  const id = useId();
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/70 transition focus-within:border-blue focus-within:bg-white">
        <select id={id} className="w-full bg-transparent px-4 py-3 text-ink outline-none" {...rest}>
          {children}
        </select>
      </div>
    </div>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm",
        tone === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue to-purple text-white shadow-[0_8px_20px_-8px_rgb(91_92_255/0.8)]">
        <Sparkles className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="text-[15px] font-extrabold tracking-tight text-ink">
          UGC <span className="text-gradient">Admin</span>
        </span>
      )}
    </span>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "blue" | "purple"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tracking-wide",
        tone === "neutral" && "bg-ink/5 text-ink-soft",
        tone === "blue" && "bg-blue-soft text-blue-dark",
        tone === "purple" && "bg-purple-soft text-purple-dark",
      )}
    >
      {children}
    </span>
  );
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="app-backdrop" aria-hidden />
      <LoaderCircle className="size-8 animate-spin text-blue" aria-label="Carregando" />
    </div>
  );
}
