import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { IconType } from "react-icons";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  leftIcon?: IconType;
  rightIcon?: IconType;
}

export function SecondaryButton({
  children,
  variant = "secondary",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  ...props
}: ButtonProps) {
  const baseStyle =
    "flex items-center justify-center px-4 py-2 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50";

  const variants = {
    primary: "bg-blue-900 text-white hover:bg-blue-700",
    secondary: "bg-white text-blue-900 border border-blue-900 hover:bg-blue-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const combinedClasses = twMerge(baseStyle, variants[variant], className);

  return (
    <button className={combinedClasses} {...props}>
      {LeftIcon && <LeftIcon className="mr-2 h-5 w-5" />}
      {children}
      {RightIcon && <RightIcon className="ml-2 h-5 w-5" />}
    </button>
  );
}
