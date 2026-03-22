/**
 * Checkbox per selezione multipla
 * 
 * Componente checkbox con stato indeterminate per "alcuni selezionati"
 */

export default function SelectableCheckbox({ 
  checked, 
  indeterminate = false, 
  onChange, 
  className = "",
  disabled = false
}) {
  const ref = (checkbox) => {
    if (checkbox) {
      checkbox.indeterminate = indeterminate;
    }
  };

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        e.stopPropagation(); // Ferma la propagazione dell'evento
        onChange?.(e.target.checked);
      }}
      onClick={(e) => {
        e.stopPropagation(); // Ferma anche il click
      }}
      disabled={disabled}
      className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#243044] rounded cursor-pointer ${className}`}
    />
  );
}

