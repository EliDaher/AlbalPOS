import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] shadow-sm hover:shadow-md [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-tl from-primary-500 to-primary-600 text-primary-foreground hover:from-primary-500 hover:to-primary-700",

        accent:
          "bg-gradient-to-tl from-accent-500 to-accent-600 text-primary-foreground hover:from-accent-500 hover:to-accent-700",

        destructive:
          "bg-gradient-to-tl from-destructive/90 to-destructive text-destructive-foreground hover:from-destructive hover:to-destructive/90",

        secondary:
          "bg-gradient-to-tl from-secondary-500 to-secondary-600 text-secondary-foreground hover:from-secondary-500 hover:to-secondary-700",

        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-none",

        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground shadow-none",

        link: "bg-transparent text-primary underline-offset-4 hover:underline shadow-none",
      },

      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild && !React.isValidElement(children)) {
      throw new Error(
        "Button with asChild expects a single React element child",
      );
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={!asChild ? disabled || loading : disabled}
        aria-busy={loading}
        {...props}
      >
        {!asChild && loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
