import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  const baseStyle = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2";
  
  const combinedClasses = twMerge(baseStyle, className);

  return (
    <textarea className={combinedClasses} {...props} />
  );
}