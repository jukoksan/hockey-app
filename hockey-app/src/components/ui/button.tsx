import * as React from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive";
  size?: "sm" | "md";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "md", ...props }, ref
) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium border shadow-sm transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  // emme anna tässä mitään bg- tai border-luokkaa => kaikki väri tulee .app-btn:stä
  const variants = {
    default: "",
    secondary: "",
    destructive: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  } as const;

  const sizes = { sm: "text-sm px-3 py-1.5", md: "text-base" } as const;

  return (
    <button
      ref={ref}
      className={cn(base, sizes[size], variants[variant], "app-btn", className)}
      {...props}
    />
  );
});