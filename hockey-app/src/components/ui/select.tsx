import * as React from "react";
import { cn } from "../../lib/cn";

type SelectContext = {
  value?: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  label?: string;
  setLabel: (t?: string) => void;
  placeholder?: string;
};

const Ctx = React.createContext<SelectContext | null>(null);

export function Select({
  value,
  onValueChange,
  children,
  placeholder,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState<string | undefined>(undefined);

  const ctx: SelectContext = React.useMemo(
    () => ({ value, onValueChange, open, setOpen, label, setLabel, placeholder }),
    [value, onValueChange, open, label, placeholder]
  );

  // Sulje pudotusvalikko klikatessa ulos
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) ctx.setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [ctx]);

  return (
    <div ref={rootRef} className="relative inline-block w-full">
      <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
    </div>
  );
}

export function SelectTrigger({
  id,
  className,
  children,
}: React.HTMLAttributes<HTMLButtonElement> & { id?: string }) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("SelectTrigger must be used inside <Select>");

  return (
    <button
      id={id}
      type="button"
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        // KOKO kuten Button: korkeus, padding, fontti
        "w-full inline-flex items-center justify-between rounded-2xl h-11 px-4 text-base font-medium border shadow-sm transition",
        "bg-green-800 text-white border-green-800 hover:bg-green-900",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-900 focus-visible:ring-offset-2",
        className
      )}
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
    >
      <span className="truncate">
        {ctx.label ?? ctx.placeholder ?? "Valitse"}
      </span>
      {/* halutessasi voit lisätä tähän ▼-ikonin myöhemmin */}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  // Ylläpidämme labelia kontekstissa, joten tämä on vain paikka pitimelle
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  // Päivitä placeholder kontekstiin jos annettu
  React.useEffect(() => {
    if (placeholder) {
      // asetetaan placeholder vain jos ei ole labelia
      if (!ctx.label) {
        // @ts-ignore - placeholder vain näyttöön
        ctx.placeholder = placeholder;
      }
    }
  }, [placeholder]); // eslint-disable-line
  return null;
}

export function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("SelectContent must be used inside <Select>");
  if (!ctx.open) return null;

  return (
    <div
      role="listbox"
      className={cn(
        "absolute z-50 mt-1 w-full rounded-2xl border bg-white shadow-lg p-1",
        "border-slate-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("SelectItem must be used inside <Select>");

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const label = (e.currentTarget.textContent || "").trim();
    ctx.setLabel(label);
    ctx.onValueChange(value);
    ctx.setOpen(false);
  };

  const isActive = ctx.value === value;

  return (
    <div
      role="option"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl px-3 py-2 text-sm",
        isActive
          ? "bg-green-100 text-green-900"
          : "hover:bg-green-50 text-slate-900"
      )}
    >
      {children}
    </div>
  );
}
