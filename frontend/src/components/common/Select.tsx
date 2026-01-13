import React, { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  error?: string;
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, error, label, ...props }, ref) => {
    const baseStyle =
      "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 " +
      "transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer " +
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100";

    const errorStyle = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";

    const combinedClasses = twMerge(baseStyle, errorStyle, className);

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select ref={ref} className={combinedClasses} {...props}>
          {children}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
