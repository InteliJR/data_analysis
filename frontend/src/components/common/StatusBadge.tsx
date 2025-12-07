import type { UserStatusText } from "@/types/user";
import { twMerge } from "tailwind-merge";

type StatusBadgeVariant = "success" | "default" | "warning" | "danger";

interface StatusBadgeProps {
  status: UserStatusText | string;
  variant?: StatusBadgeVariant;
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const baseStyle =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

  const variantClasses: Record<StatusBadgeVariant, string> = {
    success: "bg-green-100 text-green-800",
    default: "bg-gray-100 text-gray-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };

  const resolvedVariant: StatusBadgeVariant = variant
    ? variant
    : status === "Ativo"
    ? "success"
    : "danger";

  const combinedClasses = twMerge(baseStyle, variantClasses[resolvedVariant]);

  return <span className={combinedClasses}>{status}</span>;
}
