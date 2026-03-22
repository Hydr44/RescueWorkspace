// src/components/ModuleGuard.jsx
/**
 * Componente che protegge le route in base ai moduli attivi dell'organizzazione.
 * Se il modulo non è attivo, mostra un messaggio informativo invece del contenuto.
 * 
 * Uso:
 *   <ModuleGuard module="rvfu">
 *     <DemolizioniRVFU />
 *   </ModuleGuard>
 */
import PropTypes from "prop-types";
import { useSubscription } from "@/hooks/useSubscription";
import { FiLock, FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";

const MODULE_LABELS = {
  rvfu: "Demolizioni RVFU",
  sdi: "Fatturazione Elettronica SDI",
  rentri: "Rifiuti RENTRI",
  base: "Base",
};

export default function ModuleGuard({ module, children }) {
  const { isModuleActive, loading } = useSubscription();

  // Durante il caricamento, mostra un placeholder leggero
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se il modulo è attivo, mostra il contenuto normalmente
  if (isModuleActive(module)) {
    return children;
  }

  // Modulo non attivo — mostra messaggio informativo
  const label = MODULE_LABELS[module] || module;

  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center">
          <FiLock className="w-7 h-7 text-slate-400" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-200">
            Modulo non attivo
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Il modulo <strong className="text-slate-300">{label}</strong> non è
            attivo per la tua organizzazione.
          </p>
          <p className="text-xs text-slate-500">
            Contatta l&apos;amministratore per attivare questo modulo.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors border border-blue-500/20 no-underline"
        >
          <FiArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </Link>
      </div>
    </div>
  );
}

ModuleGuard.propTypes = {
  module: PropTypes.oneOf(["base", "rvfu", "sdi", "rentri"]).isRequired,
  children: PropTypes.node.isRequired,
};
