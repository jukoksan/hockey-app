import * as React from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive";
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "md", ...props }, ref
) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border shadow-sm transition";
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 border-slate-900",
    secondary: "bg-white text-slate-900 hover:bg-slate-50 border-slate-200",
    destructive: "bg-red-600 text-white hover:bg-red-500 border-red-600",
  };
  const sizes = { sm: "text-sm px-3 py-1.5", md: "text-base" };
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
});
