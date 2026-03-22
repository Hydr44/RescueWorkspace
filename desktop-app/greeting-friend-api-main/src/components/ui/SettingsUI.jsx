/**
 * Shared UI components extracted from Settings.jsx
 * Field, Toggle, Card, Section - reusable form/layout primitives
 */
import PropTypes from "prop-types";
import { FiInfo } from "react-icons/fi";

export function Field({ label, children, required = false, tooltip = null, error = null, className = "" }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        {label}
        {required && <span className="text-red-500">*</span>}
        {tooltip && (
          <span className="relative group">
            <FiInfo className="w-3 h-3 text-slate-500 hover:text-slate-400 cursor-help" />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 text-xs text-white bg-[#1a2536] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, disabled = false, className = "" }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-[#243044]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-[#1a2536] transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-[#1a2536] rounded-xl border border-[#243044] p-4 ${className}`}>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function Section({ title, desc, children, className = "" }) {
  return (
    <div className={`bg-[#1a2536] rounded-xl border border-[#243044] p-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  tooltip: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string
};

Toggle.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

Card.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
