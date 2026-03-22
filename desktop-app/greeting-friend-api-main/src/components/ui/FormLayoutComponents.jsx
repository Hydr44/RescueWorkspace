/**
 * Form Layout Components - Design System
 * Layout standardizzati per form e sezioni
 * 
 * @author haxies
 * @created 2025
 */

import React from 'react';
import { clsx } from 'clsx';

/* ===== FORM CONTAINER ===== */
export function FormContainer({ 
  children, 
  className,
  maxWidth = 'max-w-4xl',
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'mx-auto px-4 py-6',
        maxWidth,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===== FORM SECTION ===== */
export function FormSection({ 
  title,
  description,
  children, 
  className,
  icon,
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'bg-[#1a2536]',
        'border border-[#243044]',
        'rounded-xl p-6',
        'space-y-4',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              {icon && <span className="text-blue-600">{icon}</span>}
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}

/* ===== FORM ROW ===== */
export function FormRow({ 
  children, 
  columns = 2,
  className,
  gap = 'gap-4',
  ...props 
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div 
      className={clsx(
        'grid',
        gridCols[columns] || gridCols[2],
        gap,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===== FORM ACTIONS ===== */
export function FormActions({ 
  children, 
  className,
  align = 'right',
  ...props 
}) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div 
      className={clsx(
        'flex items-center gap-3',
        alignClasses[align],
        'pt-4 border-t border-[#243044]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===== FORM HEADER ===== */
export function FormHeader({ 
  title,
  subtitle,
  children,
  className,
  icon,
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'mb-6',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title && (
            <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
              {icon && <span className="text-blue-600">{icon}</span>}
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== FORM FOOTER ===== */
export function FormFooter({ 
  children, 
  className,
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'mt-8 pt-6',
        'border-t border-[#243044]',
        'bg-[#141c27]/50',
        'rounded-b-xl -mx-6 -mb-6 px-6 pb-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===== FORM CARD ===== */
export function FormCard({ 
  children, 
  className,
  padding = 'p-6',
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'bg-[#1a2536]',
        'border border-[#243044]',
        'rounded-xl shadow-sm',
        padding,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===== FORM MODAL ===== */
export function FormModal({ 
  isOpen,
  onClose,
  title,
  children,
  className,
  maxWidth = 'max-w-4xl',
  ...props 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={clsx(
          'relative w-full mx-4',
          maxWidth,
          'bg-[#1a2536]',
          'border border-[#243044]',
          'rounded-xl shadow-xl',
          className
        )}
        {...props}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-[#243044]">
            <h2 className="text-xl font-semibold text-slate-200">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-400 "
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ===== FORM STEPS ===== */
export function FormSteps({ 
  steps = [],
  currentStep = 0,
  className,
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'flex items-center justify-between mb-8',
        className
      )}
      {...props}
    >
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          {/* Step Circle */}
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            index <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-[#243044] text-slate-400  '
          )}>
            {index < currentStep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          
          {/* Step Label */}
          <div className="ml-3">
            <p className={clsx(
              'text-sm font-medium',
              index <= currentStep 
                ? 'text-blue-600' 
                : 'text-slate-500'
            )}>
              {step.title}
            </p>
            {step.description && (
              <p className="text-xs text-slate-500">
                {step.description}
              </p>
            )}
          </div>
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className={clsx(
              'flex-1 h-0.5 mx-4',
              index < currentStep ? 'bg-blue-600' : 'bg-[#243044] '
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
