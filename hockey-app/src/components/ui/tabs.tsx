import * as React from "react";
import { cn } from "@/lib/cn";

type TabsContextValue = {
  value: string;
  onValueChange: (v: string) => void;
};

const TabsCtx = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TabsCtx.Provider value={{ value, onValueChange }}>
      <div className={cn("inline-block", className)}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("inline-flex gap-2", className)}>{children}</div>;
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error("TabsTrigger must be used inside <Tabs>");

  const active = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "rounded-2xl px-3 py-1.5 text-sm font-medium border transition",
        "bg-green-800 text-white border-green-800 hover:bg-green-900",
        active && "ring-2 ring-green-900 ring-offset-2",
        className
      )}
    >
      {children}
    </button>
  );
}
