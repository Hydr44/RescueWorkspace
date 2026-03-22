// src/components/ui/LoadingSpinner.jsx
import PropTypes from 'prop-types';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = null 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'text-indigo-600',
    white: 'text-white',
    gray: 'text-slate-500',
    success: 'text-green-600',
    danger: 'text-red-600'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-3">
        {/* Spinner migliorato con animazione più fluida */}
        <div className="relative">
          <svg
            className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {/* Pulsing dot per effetto aggiuntivo */}
          <div className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} opacity-30 animate-ping`}>
            <div className="w-full h-full rounded-full bg-current"></div>
          </div>
        </div>
        
        {text && (
          <span className={`text-sm font-medium ${colorClasses[color]} animate-pulse`}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'white', 'gray', 'success', 'danger']),
  className: PropTypes.string,
  text: PropTypes.string,
};

export default LoadingSpinner;