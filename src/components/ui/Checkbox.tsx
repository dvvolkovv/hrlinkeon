import { InputHTMLAttributes, ReactNode } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  error?: boolean;
}

export function Checkbox({ label, error, className = '', ...props }: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        className={`
          mt-1 w-5 h-5 rounded border-2
          ${error ? 'border-red-500' : 'border-gray-300'}
          text-forest-600
          focus:ring-2 focus:ring-forest-200 focus:ring-offset-0
          transition-colors duration-200
          cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {label && (
        <span className={`text-sm ${error ? 'text-red-600' : 'text-gray-700'} select-none flex-1`}>
          {label}
        </span>
      )}
    </label>
  );
}
