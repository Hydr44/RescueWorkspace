/**
 * Form Components - Design System
 * Componenti form standardizzati e riutilizzabili per RescueManager
 * 
 * @author haxies
 * @created 2025
 */

import React, { forwardRef } from 'react';
import { FiCheck, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { clsx } from 'clsx';

/* ===== FIELD LABEL ===== */
export function FieldLabel({ children, required = false, className, ...props }) {
  return (
    <label className={clsx(
      'block text-sm font-medium text-slate-300 mb-1',
      className
    )} {...props}>
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-label="Campo obbligatorio">*</span>
      )}
    </label>
  );
}

/* ===== FIELD HINT ===== */
export function FieldHint({ children, className, ...props }) {
  if (!children) return null;
  
  return (
    <p className={clsx(
      'mt-1 text-xs text-slate-500',
      className
    )} {...props}>
      {children}
    </p>
  );
}

/* ===== FIELD ERROR ===== */
export function FieldError({ children, className, ...props }) {
  if (!children) return null;
  
  return (
    <p className={clsx(
      'mt-1 text-xs text-red-600 flex items-center gap-1',
      className
    )} {...props}>
      <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
      {children}
    </p>
  );
}

/* ===== VALIDATION ICON ===== */
export function ValidationIcon({ isValid, isError, className, ...props }) {
  if (isError) {
    return (
      <FiAlertCircle className={clsx(
        'w-4 h-4 text-red-500 flex-shrink-0',
        className
      )} {...props} />
    );
  }
  
  if (isValid) {
    return (
      <FiCheck className={clsx(
        'w-4 h-4 text-green-500 flex-shrink-0',
        className
      )} {...props} />
    );
  }
  
  return null;
}

/* ===== INPUT BASE STYLES ===== */
const inputBaseStyles = [
  'w-full px-3 py-2',
  'border border-[#243044]',
  'bg-[#1a2536]',
  'text-slate-200',
  'placeholder-slate-600',
  'rounded-md',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors duration-200'
];

/* ===== INPUT COMPONENT ===== */
export const Input = forwardRef(({ 
  label, 
  hint, 
  error, 
  required = false, 
  isValid = false,
  isError = false,
  className,
  containerClassName,
  ...props 
}, ref) => {
  const inputId = React.useId();
  
  return (
    <div className={clsx('space-y-1', containerClassName)}>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            inputBaseStyles,
            error || isError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
            isValid ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : '',
            className
          )}
          {...props}
        />
        
        {(isValid || isError) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ValidationIcon isValid={isValid} isError={isError} />
          </div>
        )}
      </div>
      
      {hint && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
});

Input.displayName = 'Input';

/* ===== TEXTAREA COMPONENT ===== */
export const Textarea = forwardRef(({ 
  label, 
  hint, 
  error, 
  required = false, 
  className,
  containerClassName,
  ...props 
}, ref) => {
  const textareaId = React.useId();
  
  return (
    <div className={clsx('space-y-1', containerClassName)}>
      {label && (
        <FieldLabel htmlFor={textareaId} required={required}>
          {label}
        </FieldLabel>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        className={clsx(
          inputBaseStyles,
          'resize-y min-h-[80px]',
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
          className
        )}
        {...props}
      />
      
      {hint && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

/* ===== SELECT COMPONENT ===== */
export const Select = forwardRef(({ 
  label, 
  hint, 
  error, 
  required = false, 
  options = [],
  placeholder = "Seleziona...",
  className,
  containerClassName,
  ...props 
}, ref) => {
  const selectId = React.useId();
  
  return (
    <div className={clsx('space-y-1', containerClassName)}>
      {label && (
        <FieldLabel htmlFor={selectId} required={required}>
          {label}
        </FieldLabel>
      )}
      
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          inputBaseStyles,
          'pr-8',
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {hint && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
});

Select.displayName = 'Select';

/* ===== PASSWORD INPUT ===== */
export const PasswordInput = forwardRef(({ 
  label, 
  hint, 
  error, 
  required = false, 
  className,
  containerClassName,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputId = React.useId();
  
  return (
    <div className={clsx('space-y-1', containerClassName)}>
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={clsx(
            inputBaseStyles,
            'pr-10',
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
            className
          )}
          {...props}
        />
        
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 "
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <FiEyeOff className="w-4 h-4" />
          ) : (
            <FiEye className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {hint && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

/* ===== CHECKBOX COMPONENT ===== */
export const Checkbox = forwardRef(({ 
  label, 
  hint, 
  error, 
  className,
  containerClassName,
  ...props 
}, ref) => {
  const checkboxId = React.useId();
  
  return (
    <div className={clsx('space-y-1', containerClassName)}>
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={clsx(
            'w-4 h-4 mt-0.5',
            'text-blue-600 bg-[#141c27] border-[#243044] rounded',
            'focus:ring-blue-500 focus:ring-2',
            
            error ? 'border-red-500' : '',
            className
          )}
          {...props}
        />
        
        {label && (
          <label htmlFor={checkboxId} className="text-sm font-medium text-slate-300 cursor-pointer">
            {label}
          </label>
        )}
      </div>
      
      {hint && <FieldHint className="ml-6">{hint}</FieldHint>}
      {error && <FieldError className="ml-6">{error}</FieldError>}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

/* ===== RADIO GROUP COMPONENT ===== */
export const RadioGroup = forwardRef(({ 
  label, 
  hint, 
  error, 
  options = [],
  className,
  containerClassName,
  ...props 
}, ref) => {
  const groupId = React.useId();
  
  return (
    <div className={clsx('space-y-1', containerClassName)}>
      {label && (
        <FieldLabel>{label}</FieldLabel>
      )}
      
      <div className={clsx('space-y-2', className)}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <input
              ref={ref}
              id={`${groupId}-${option.value}`}
              type="radio"
              value={option.value}
              className={clsx(
                'w-4 h-4',
                'text-blue-600 bg-[#141c27] border-[#243044]',
                'focus:ring-blue-500 focus:ring-2',
                
                error ? 'border-red-500' : ''
              )}
              {...props}
            />
            <label 
              htmlFor={`${groupId}-${option.value}`}
              className="text-sm font-medium text-slate-300 cursor-pointer"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {hint && <FieldHint>{hint}</FieldHint>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
});

RadioGroup.displayName = 'RadioGroup';
