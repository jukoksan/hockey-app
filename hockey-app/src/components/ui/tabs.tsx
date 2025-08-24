import * as React from "react";
import { cn } from "@/lib/cn";

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return <div data-value={value} className="inline-block">{children}</div>;
}
export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex rounded-xl border bg-white p-1">{children}</div>;
}
export function TabsTrigger({ value, children, onClick }: { value: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("px-3 py-1.5 text-sm rounded-lg hover:bg-slate-50")}>
      {children}
    </button>
  );
}
