import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function buttonVariants({
  variant = "default",
  size = "default",
  className = "",
}: {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
} = {}) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4945b] disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-[#171615] text-white hover:bg-[#35483d]",
    outline: "border border-[#ded9cf] bg-transparent text-[#171615] hover:bg-[#efebe2]",
    secondary: "bg-[#efebe2] text-[#171615] hover:bg-[#ded9cf]",
    ghost: "text-[#171615] hover:bg-[#efebe2]",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-11 rounded-md px-8",
    icon: "size-10",
  };

  return cn(base, variants[variant], sizes[size], className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={buttonVariants({ variant, size, className })} {...props} />
  ),
);

Button.displayName = "Button";
