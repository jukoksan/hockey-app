import * as React from "react";
import { cn } from "../../lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive";
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "md", ...props }, ref
) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border shadow-sm transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-900";

  // vihreä oletus
  const variants = {
    default: "bg-green-800 text-white hover:bg-green-900 border-green-800",
    secondary: "bg-green-800 text-white hover:bg-green-900 border-green-800",
    destructive: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  } as const;

  const sizes = { sm: "text-sm px-3 py-1.5", md: "text-base" } as const;

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant] ?? variants.default, sizes[size], className)}
      {...props}
    />
  );
});