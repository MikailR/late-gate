import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-sm border border-ink/15 bg-paper px-3 text-ink outline-none",
        className,
      )}
      {...props}
    />
  );
}
