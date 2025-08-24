import * as React from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, variant = "secondary", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" }) {
  const styles = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-800 border border-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs", styles[variant], className)} {...props} />;
}
