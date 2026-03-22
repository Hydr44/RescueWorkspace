// src/components/ui/ProgressBar.jsx
import PropTypes from 'prop-types';

const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  size = 'md', 
  color = 'primary',
  animated = true,
  showLabel = false,
  className = '' 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4'
  };

  const colorClasses = {
    primary: 'bg-indigo-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    gray: 'bg-[#243044]'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-slate-400  mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-[#243044]  rounded-full overflow-hidden`}>
        <div 
          className={`
            ${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-500 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ 
            width: `${percentage}%`,
            transition: 'width 0.5s ease-out'
          }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-slate-500  mt-1 text-center">
          {percentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;

ProgressBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'gray']),
  animated: PropTypes.bool,
  showLabel: PropTypes.bool,
  className: PropTypes.string,
};
