// src/components/ui/Button.tsx
import { cn } from "../../utils/cn"
import { ButtonHTMLAttributes, ReactNode } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-3 py-1 rounded bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 transition",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
