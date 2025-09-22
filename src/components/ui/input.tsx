import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-[color:var(--input)] border border-[color:var(--tech-border)] text-[color:var(--tech-text)] placeholder:text-[color:var(--tech-text-muted)] focus:border-[color:var(--tech-accent)] focus:outline-none transition-all duration-300 flex h-9 w-full min-w-0 rounded-xl px-3 py-1 text-base file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "selection:bg-[color:var(--tech-accent)]/20 selection:text-[color:var(--tech-text)]",
        "focus-visible:ring-[color:var(--tech-accent)]/20 focus-visible:ring-[2px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
