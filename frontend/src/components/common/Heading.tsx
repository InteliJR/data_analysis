import React from 'react';
import { twMerge } from 'tailwind-merge';

type HeadingElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingVariant = 'title' | 'subtitle' | 'section';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: HeadingElement;
  variant?: HeadingVariant;
  className?: string;
}

export function Heading({
  children,
  as: Component = 'h1',
  variant = 'title',
  className,
  ...props
}: HeadingProps) {
  
  const variantClasses: Record<HeadingVariant, string> = {
    title: 'text-3xl font-bold text-gray-800', 
    subtitle: 'text-xl font-semibold text-gray-700',
    section: 'text-lg font-medium text-gray-600',
  };

  const combinedClasses = twMerge(
    'font-sans', // Classe base
    variantClasses[variant],
    className
  );

  return (
    <Component className={combinedClasses} {...props}>
      {children}
    </Component>
  );
}