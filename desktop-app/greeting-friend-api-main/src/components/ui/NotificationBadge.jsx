// src/components/ui/NotificationBadge.jsx
import PropTypes from 'prop-types';

const NotificationBadge = ({ 
  count = 0, 
  max = 99, 
  size = 'md',
  color = 'danger',
  animated = true,
  className = '' 
}) => {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  const colorClasses = {
    primary: 'bg-indigo-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    danger: 'bg-red-600 text-white',
    gray: 'bg-[#243044] text-white'
  };

  return (
    <span 
      className={`
        ${sizeClasses[size]} ${colorClasses[color]}
        rounded-full flex items-center justify-center font-medium
        ${animated ? 'animate-bounce-in' : ''}
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;

NotificationBadge.propTypes = {
  count: PropTypes.number,
  max: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'gray']),
  animated: PropTypes.bool,
  className: PropTypes.string,
};
