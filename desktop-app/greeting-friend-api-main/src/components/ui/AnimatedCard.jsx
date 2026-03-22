// src/components/ui/AnimatedCard.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';

const AnimatedCard = ({ 
  children, 
  className = '', 
  hoverEffect = true,
  onClick,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = `
    transition-all duration-300 ease-out
    ${hoverEffect ? 'card clickable' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;

AnimatedCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hoverEffect: PropTypes.bool,
  onClick: PropTypes.func,
};
