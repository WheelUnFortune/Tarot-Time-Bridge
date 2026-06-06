import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "border border-gold bg-gradient-to-b from-[hsl(var(--gold))] to-[#b8941f] text-[#1a1033] hover:brightness-105 hover:shadow-[0_4px_14px_rgba(212,175,55,0.25)]",
        ghost:
          "border border-line bg-transparent text-ink-1 hover:border-violet hover:text-ink-0",
        destructive:
          "border border-[hsl(var(--danger)/0.4)] bg-transparent text-[hsl(var(--danger))] hover:border-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.08)]",
        outline:
          "border border-line bg-transparent text-ink-1 hover:border-violet hover:text-ink-0",
        secondary:
          "border border-line bg-secondary text-ink-1 hover:bg-bg-3 hover:text-ink-0",
        link: "text-gold-soft underline-offset-4 hover:underline border-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
