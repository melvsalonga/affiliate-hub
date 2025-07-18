'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export interface FormMessageProps {
  children?: React.ReactNode;
  type?: 'error' | 'success' | 'info';
  className?: string;
}

export interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string; disabled?: boolean }>;
  label?: string;
  error?: string;
  className?: string;
}

// Form Container
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn('space-y-6', className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

// Form Field Container
export const FormField: React.FC<FormFieldProps> = ({ children, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
};

// Form Label
export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium text-foreground',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

// Form Message
export const FormMessage: React.FC<FormMessageProps> = ({ 
  children, 
  type = 'error', 
  className 
}) => {
  if (!children) return null;

  const typeStyles = {
    error: 'text-error-500',
    success: 'text-success-500',
    info: 'text-muted-foreground',
  };

  return (
    <p className={cn('text-sm', typeStyles[type], className)}>
      {children}
    </p>
  );
};

// Form Group
export const FormGroup: React.FC<FormGroupProps> = ({ children, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
};

// Select Component
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, ...props }, ref) => {
    return (
      <FormField>
        {label && (
          <FormLabel required={props.required}>
            {label}
          </FormLabel>
        )}
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error-500 focus:ring-error-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <FormMessage type="error">{error}</FormMessage>}
        {helperText && !error && <FormMessage type="info">{helperText}</FormMessage>}
      </FormField>
    );
  }
);

Select.displayName = 'Select';

// Checkbox Component
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, ...props }, ref) => {
    return (
      <FormField>
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            ref={ref}
            className={cn(
              'h-4 w-4 rounded border-input text-primary-500',
              'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-error-500',
              className
            )}
            {...props}
          />
          {(label || description) && (
            <div className="space-y-1">
              {label && (
                <FormLabel className="text-sm font-medium">
                  {label}
                </FormLabel>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        {error && <FormMessage type="error">{error}</FormMessage>}
      </FormField>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Radio Group Component
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  label,
  error,
  className,
}) => {
  return (
    <FormField className={className}>
      {label && (
        <FormLabel>{label}</FormLabel>
      )}
      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={option.disabled}
              className={cn(
                'h-4 w-4 border-input text-primary-500',
                'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
            <div className="space-y-1">
              <label
                htmlFor={`${name}-${option.value}`}
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {error && <FormMessage type="error">{error}</FormMessage>}
    </FormField>
  );
};

// Form Actions (for buttons)
export const FormActions: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ 
  children, 
  className,
  align = 'right'
}) => {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 pt-4',
      alignStyles[align],
      className
    )}>
      {children}
    </div>
  );
};