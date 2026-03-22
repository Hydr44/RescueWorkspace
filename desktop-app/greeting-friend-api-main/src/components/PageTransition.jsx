// src/components/PageTransition.jsx
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const PageTransition = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Piccolo delay per permettere al DOM di renderizzare
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`
        page-enter transition-all duration-300 ease-out
        ${isVisible ? 'page-enter-active' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default PageTransition;

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
