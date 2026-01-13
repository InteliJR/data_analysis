import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  // Gera um ID único se não for fornecido, para o 'htmlFor' funcionar
  const inputId = id || `checkbox-${props.name}-${label}`;
  
  return (
    <div className="flex items-center gap-2">
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        {...props}
      />
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-gray-700 select-none"
      >
        {label}
      </label>
    </div>
  );
}