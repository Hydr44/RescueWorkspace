// src/components/Toast.jsx
import { useEffect, useState } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import PropTypes from 'prop-types';

const Toast = ({ 
  show, 
  text, 
  type = 'info', 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsLeaving(false);
      
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const icons = {
    success: FiCheckCircle,
    error: FiAlertCircle,
    warning: FiAlertTriangle,
    info: FiInfo,
  };

  const colors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };

  const Icon = icons[type];

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ${
      isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
    }`}>
      <div className={`border rounded-lg p-4 shadow-lg backdrop-blur-sm bg-[#1a2536]/95 /90 ${colors[type]} animate-slide-up`}>
        <div className="flex items-start">
          <div className="animate-bounce-in">
            <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          </div>
          <div className="flex-1 animate-fade-in">
            <p className="text-sm font-medium">{text}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-3 flex-shrink-0 text-slate-500 hover:text-slate-400 transition-colors clickable"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;

Toast.propTypes = {
  show: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
};
