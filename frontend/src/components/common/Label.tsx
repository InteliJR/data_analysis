import React from 'react';
import { twMerge } from 'tailwind-merge';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children, className, ...props }: LabelProps) {
  const baseStyle = "block text-sm font-medium text-gray-700 mb-1";
  
  const combinedClasses = twMerge(baseStyle, className);

  return (
    <label className={combinedClasses} {...props}>
      {children}
    </label>
  );
}