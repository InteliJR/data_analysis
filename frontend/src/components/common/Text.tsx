import React from 'react';
import { twMerge } from 'tailwind-merge';

type TextElement = 'p' | 'span' | 'div' | 'label';
type TextVariant = 'body' | 'caption' | 'small';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: TextElement;
  variant?: TextVariant;
  className?: string;
}

export function Text({
  children,
  as: Component = 'p',
  variant = 'body',
  className,
  ...props
}: TextProps) {
  
  const variantClasses: Record<TextVariant, string> = {
    body: 'text-base text-gray-700', 
    caption: 'text-sm text-gray-600',
    small: 'text-xs text-gray-500', 
  };

  const combinedClasses = twMerge(
    'font-sans', 
    variantClasses[variant],
    className
  );

  return (
    <Component className={combinedClasses} {...props}>
      {children}
    </Component>
  );
}