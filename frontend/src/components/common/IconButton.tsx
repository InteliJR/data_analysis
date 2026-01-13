import React from 'react';
import type { IconType } from 'react-icons';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType;
  'aria-label': string;
}

export function IconButton({ 
  icon: Icon, 
  className, 
  ...props 
}: IconButtonProps) {
  
  const baseStyle = 'p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

  const combinedClasses = twMerge(
    baseStyle,
    className
  );
  
  return (
    <button
      type="button"
      className={combinedClasses}
      {...props}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}