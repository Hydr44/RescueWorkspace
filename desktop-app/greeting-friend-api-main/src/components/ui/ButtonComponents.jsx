/**
 * Button Components - Design System
 * Componenti button standardizzati per RescueManager
 * 
 * @author haxies
 * @created 2025
 */

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

/* ===== BUTTON BASE STYLES ===== */
const buttonBaseStyles = [
  'inline-flex items-center justify-center',
  'px-4 py-2',
  'text-sm font-medium',
  'rounded-md',
  'border',
  'focus:outline-none focus:ring-2 focus:ring-offset-2',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'transition-colors duration-200',
  'gap-2'
];

/* ===== BUTTON VARIANTS ===== */
const buttonVariants = {
  primary: [
    'bg-blue-600 text-white border-blue-600',
    'hover:bg-blue-700 hover:border-blue-700',
    'focus:ring-blue-500'
  ],
  secondary: [
    'bg-[#1a2536] text-slate-300 border-[#243044]',
    'hover:bg-[#141c27] hover:border-[#243044]',
    'focus:ring-blue-500'
  ],
  success: [
    'bg-green-600 text-white border-green-600',
    'hover:bg-green-700 hover:border-green-700',
    'focus:ring-green-500'
  ],
  warning: [
    'bg-yellow-600 text-white border-yellow-600',
    'hover:bg-yellow-700 hover:border-yellow-700',
    'focus:ring-yellow-500'
  ],
  danger: [
    'bg-red-600 text-white border-red-600',
    'hover:bg-red-700 hover:border-red-700',
    'focus:ring-red-500'
  ],
  ghost: [
    'bg-transparent text-slate-400 border-transparent',
    'hover:bg-[#141c27] hover:text-slate-200',
    'focus:ring-blue-500'
  ],
  outline: [
    'bg-transparent text-blue-400 border-blue-500/30',
    'hover:bg-blue-500/10 hover:text-blue-300',
    'focus:ring-blue-500'
  ]
};

/* ===== BUTTON SIZES ===== */
const buttonSizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
};

/* ===== BUTTON COMPONENT ===== */
export const Button = forwardRef(({ 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        buttonBaseStyles,
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg 
          className="w-4 h-4 animate-spin" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

/* ===== BUTTON GROUP COMPONENT ===== */
export function ButtonGroup({ 
  children, 
  className,
  orientation = 'horizontal',
  ...props 
}) {
  return (
    <div 
      className={clsx(
        'flex',
        orientation === 'horizontal' ? 'flex-row gap-2' : 'flex-col gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ===== ICON BUTTON COMPONENT ===== */
export const IconButton = forwardRef(({ 
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props 
}, ref) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center',
        'rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        buttonVariants[variant],
        iconSizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg 
          className="w-4 h-4 animate-spin" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

/* ===== FLOATING ACTION BUTTON ===== */
export const FloatingActionButton = forwardRef(({ 
  variant = 'primary',
  size = 'lg',
  className,
  children,
  ...props 
}, ref) => {
  const fabSizes = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <button
      ref={ref}
      className={clsx(
        'fixed bottom-6 right-6',
        'inline-flex items-center justify-center',
        'rounded-full',
        'shadow-lg hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'transition-all duration-200',
        'z-50',
        buttonVariants[variant],
        fabSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';
