// src/components/ui/Input.jsx
import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import FormField from './FormField';

const Input = forwardRef(({
  label,
  error,
  hint,
  required = false,
  className = '',
  ...props
}, ref) => {
  const inputClasses = `
    block w-full rounded-md border px-3 py-2 text-sm
    placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    ${error 
      ? 'border-red-500/20 focus:border-red-500 focus:ring-red-500' 
      : 'border-[#243044] focus:border-indigo-500 focus:ring-indigo-500'
    }
    bg-[#1a2536] text-slate-200
    ${className}
  `;

  const input = (
    <input
      ref={ref}
      className={inputClasses}
      {...props}
    />
  );

  // Se abbiamo label, error o hint, wrappiamo in FormField
  if (label || error || hint) {
    return (
      <FormField label={label} error={error} hint={hint} required={required}>
        {input}
      </FormField>
    );
  }

  return input;
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  hint: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
};

export default Input;
