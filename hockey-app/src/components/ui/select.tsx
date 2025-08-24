import * as React from "react";
import { cn } from "@/lib/cn";

export function Select({ value, onValueChange, children }: { value?: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return <div data-value={value}>{children}</div>;
}
export function SelectTrigger({ id, children }: React.HTMLAttributes<HTMLButtonElement> & { id?: string }) {
  return <button id={id} className={cn("w-full rounded-xl border px-3 py-2 text-left bg-white")}>{children}</button>;
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-slate-500">{placeholder}</span>;
}
export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 rounded-xl border bg-white p-2">{children}</div>;
}
export function SelectGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}
export function SelectItem({ value, children, onSelect }: { value: string; children: React.ReactNode; onSelect?: (v: string) => void }) {
  return (
    <div className="px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => onSelect?.(value)}>
      {children}
    </div>
  );
}
