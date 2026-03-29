import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

export default function WidgetContainer({ children, onMoveUp, onMoveDown, canMoveUp, canMoveDown, title }) {
  return (
    <div className="relative group">
      {children}
      
      {/* Controlli riordino - visibili solo su hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {canMoveUp && (
          <button
            onClick={onMoveUp}
            className="p-1.5 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition text-slate-400 hover:text-slate-300"
            title="Sposta su"
          >
            <FiChevronUp className="w-3 h-3" />
          </button>
        )}
        {canMoveDown && (
          <button
            onClick={onMoveDown}
            className="p-1.5 bg-[#141c27] border border-[#243044] hover:bg-[#1a2536] transition text-slate-400 hover:text-slate-300"
            title="Sposta giù"
          >
            <FiChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
