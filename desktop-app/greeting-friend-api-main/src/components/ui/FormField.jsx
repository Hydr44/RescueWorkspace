// src/components/ui/FormField.jsx
import PropTypes from 'prop-types';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const FormField = ({
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
  ...props
}) => {
  const hasError = !!error;
  const isValid = !hasError && children.props.value && children.props.value.toString().trim() !== '';

  return (
    <div className={`space-y-1 ${className}`} {...props}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-300 ">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {children}
        
        {/* Status Icons */}
        {isValid && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <FiCheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Hint */}
      {hint && !hasError && (
        <p className="text-xs text-slate-500 ">{hint}</p>
      )}

      {/* Error Message */}
      {hasError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <FiAlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default FormField;
