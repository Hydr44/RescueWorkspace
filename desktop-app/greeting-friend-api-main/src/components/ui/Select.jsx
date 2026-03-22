// src/components/ui/Select.jsx
import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import FormField from './FormField';

const Select = forwardRef(({
  label,
  error,
  hint,
  required = false,
  options = [],
  placeholder = 'Seleziona...',
  className = '',
  ...props
}, ref) => {
  const selectClasses = `
    block w-full rounded-md border px-3 py-2 text-sm
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    ${error 
      ? 'border-red-500/20 focus:border-red-500 focus:ring-red-500' 
      : 'border-[#243044] focus:border-indigo-500 focus:ring-indigo-500'
    }
    bg-[#1a2536] text-slate-200
    ${className}
  `;

  const select = (
    <select
      ref={ref}
      className={selectClasses}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  // Se abbiamo label, error o hint, wrappiamo in FormField
  if (label || error || hint) {
    return (
      <FormField label={label} error={error} hint={hint} required={required}>
        {select}
      </FormField>
    );
  }

  return select;
});

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  hint: PropTypes.string,
  required: PropTypes.bool,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  })),
  placeholder: PropTypes.string,
  className: PropTypes.string,
};

export default Select;
