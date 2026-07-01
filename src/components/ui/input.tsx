import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        // Inline padding — beats the global `* { padding: 0 }` CSS reset in index.css
        style={{
          paddingLeft: '1rem',    // pl-4
          paddingRight: '1rem',   // pr-4
          paddingTop: '0.75rem',  // py-3
          paddingBottom: '0.75rem',
          ...style,               // allow callers to still override if needed
        }}
        className={cn(
          "flex h-11 w-full rounded-[10px] border border-zinc-700 bg-[var(--color-abyss,#0d0d0f)] text-sm text-[var(--color-text-primary,#f4f4f5)]",
          "placeholder:text-zinc-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]/40 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
