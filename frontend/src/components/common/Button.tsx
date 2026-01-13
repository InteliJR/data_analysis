import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      asChild = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const iconSizeClass = {
      sm: "h-4 w-4",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    }[size];

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-600 shadow-sm hover:shadow-md":
              variant === "primary",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-500 border border-gray-300":
              variant === "secondary",
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600 shadow-sm hover:shadow-md":
              variant === "danger",
            "hover:bg-gray-100 active:bg-gray-200 text-gray-700":
              variant === "ghost",
            "h-9 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-11 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && (
              <Loader2 className={cn("mr-2 animate-spin", iconSizeClass)} />
            )}
            {!isLoading && LeftIcon && (
              <LeftIcon className={cn("mr-2", iconSizeClass)} />
            )}
            {children}
            {!isLoading && RightIcon && (
              <RightIcon className={cn("ml-2", iconSizeClass)} />
            )}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";
