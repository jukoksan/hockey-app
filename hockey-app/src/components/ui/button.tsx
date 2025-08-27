import * as React from "react";
import { cn } from "../../lib/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive";
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "default", size = "md", ...props },
    ref
  ) {
    // Base-tyylit: responsiivinen padding
    const base =
      "inline-flex items-center justify-center rounded-2xl font-medium border shadow-sm transition " +
      "px-2.5 py-1.5 sm:px-4 sm:py-2";

    // Varianttien värit
    const variants = {
      default:
        "bg-green-800 text-white hover:bg-green-900 border-green-800",
      secondary:
        "bg-white text-slate-900 hover:bg-slate-50 border-slate-200",
      destructive:
        "bg-red-600 text-white hover:bg-red-500 border-red-600",
    };

    // Tekstikoot
    const sizes = {
      sm: "text-sm",
      md: "text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
