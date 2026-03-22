// src/components/ui/Skeleton.jsx
import PropTypes from 'prop-types';

const Skeleton = ({ 
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
  ...props 
}) => {
  const baseClasses = 'loading-pulse bg-[#243044]  rounded';
  
  const variantClasses = {
    text: 'h-4',
    title: 'h-6',
    button: 'h-10',
    avatar: 'rounded-full',
    image: 'aspect-video',
    card: 'h-32'
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={`skeleton-line-${index}`}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={index === lines - 1 ? { width: '75%' } : {}}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      {...props}
    />
  );
};

Skeleton.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['text', 'title', 'button', 'avatar', 'image', 'card']),
  width: PropTypes.string,
  height: PropTypes.string,
  lines: PropTypes.number,
};

export default Skeleton;
