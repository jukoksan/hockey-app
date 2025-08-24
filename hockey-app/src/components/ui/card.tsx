import * as React from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border bg-white rounded-2xl", className)} {...props} />;
}
export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="px-4 pt-4" {...props} />;
}
export function CardTitle(props: React.HTMLAttributes<HTMLDivElement>) {
  return <h3 className="text-lg font-semibold" {...props} />;
}
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="px-4 pb-4" {...props} />;
}
