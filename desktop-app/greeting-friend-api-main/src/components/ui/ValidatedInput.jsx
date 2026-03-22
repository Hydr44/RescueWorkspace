import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';

const ValidatedInput = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  validation,
  className = '',
  disabled = false,
  showPasswordToggle = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : type;

  const hasError = validation && !validation.valid;
  const hasSuccess = validation && validation.valid && value;

  const getInputClasses = () => {
    let classes = 'w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 ease-out form-input focus-ring animate-fade-in';
    
    if (hasError) {
      classes += ' border-red-500/20 focus:border-red-500 focus:ring-red-500';
    } else if (hasSuccess) {
      classes += ' border-green-300 focus:border-green-500 focus:ring-green-500';
    } else if (isFocused) {
      classes += ' border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500';
    } else {
      classes += ' border-[#243044]  focus:border-indigo-500 focus:ring-indigo-500';
    }
    
    if (disabled) {
      classes += ' bg-[#141c27]  cursor-not-allowed';
    }
    
    return classes + ' ' + className;
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-300 ">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClasses()}
          {...props}
        />
        
        {/* Icone di stato */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {hasError && (
            <FiAlertCircle className="h-4 w-4 text-red-500 animate-bounce-in" />
          )}
          {hasSuccess && !hasError && (
            <FiCheckCircle className="h-4 w-4 text-green-500 animate-bounce-in" />
          )}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-400 transition-colors"
            >
              {showPassword ? (
                <FiEyeOff className="h-4 w-4" />
              ) : (
                <FiEye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Messaggio di validazione */}
      {validation && validation.message && (
        <p className={`text-xs transition-all duration-200 ease-out ${
          hasError 
            ? 'text-red-600 animate-fade-in' 
            : hasSuccess 
            ? 'text-green-600 animate-fade-in'
            : 'text-slate-500'
        }`}>
          {validation.message}
        </p>
      )}
    </div>
  );
};

ValidatedInput.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  validation: PropTypes.shape({
    valid: PropTypes.bool,
    message: PropTypes.string
  }),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  showPasswordToggle: PropTypes.bool,
};

export default ValidatedInput;
