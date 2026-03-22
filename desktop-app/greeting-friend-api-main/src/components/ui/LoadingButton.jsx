// src/components/ui/LoadingButton.jsx
import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';

const LoadingButton = forwardRef(({
  children,
  loading = false,
  loadingText = 'Caricamento...',
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500',
    secondary: 'bg-[#141c27]  text-slate-200 hover:bg-[#243044]  border border-[#243044]  focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-blue-500/10 focus:ring-indigo-500',
    ghost: 'text-slate-400  hover:bg-[#141c27]  focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed transform-none hover:scale-100' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'} 
        />
      )}
      <span className={loading ? 'animate-pulse' : ''}>
        {loading ? loadingText : children}
      </span>
    </button>
  );
});

LoadingButton.displayName = 'LoadingButton';

LoadingButton.propTypes = {
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'outline', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default LoadingButton;