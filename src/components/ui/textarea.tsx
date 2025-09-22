import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-[color:var(--input)] border border-[color:var(--tech-border)] text-[color:var(--tech-text)] placeholder:text-[color:var(--tech-text-muted)] focus:border-[color:var(--tech-accent)] focus:outline-none transition-all duration-300 flex field-sizing-content min-h-16 w-full rounded-xl px-3 py-2 text-base disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "selection:bg-[color:var(--tech-accent)]/20 selection:text-[color:var(--tech-text)]",
        "focus-visible:ring-[color:var(--tech-accent)]/20 focus-visible:ring-[2px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
