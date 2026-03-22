import { useState } from 'react';
import { FiUser, FiLock, FiLoader, FiArrowLeft } from 'react-icons/fi';

/**
 * Componente per creare il primo operatore
 * Design moderno con gradienti e animazioni
 */
export default function CreateFirstOperator({ onCreate, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validazione
    if (!username || !password || !confirmPassword) {
      setError('Compila tutti i campi');
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    setLoading(true);
    try {
      const orgId = localStorage.getItem('rm:current_org') || localStorage.getItem('current_org_id');
      
      if (!orgId) {
        throw new Error('Organizzazione non selezionata');
      }

      const result = await onCreate(orgId, username, password);
      if (!result.success) {
        setError(result.error || 'Errore creazione operatore');
      }
    } catch (err) {
      setError(err.message || 'Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
          <FiUser className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          Crea Primo Operatore
        </h3>
        <p className="text-sm text-slate-400">
          Crea il primo operatore per questa organizzazione
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Inserisci username"
              disabled={loading}
              className="block w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[#1a2536] text-slate-200 placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Inserisci password (min. 6 caratteri)"
              disabled={loading}
              className="block w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[#1a2536] text-slate-200 placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Conferma Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Conferma password"
              disabled={loading}
              className="block w-full pl-10 pr-3 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[#1a2536] text-slate-200 placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 animate-fadeIn">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-[#243044] text-slate-300 font-medium rounded-xl hover:bg-[#141c27] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading || !username || !password || !confirmPassword}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Creazione...
              </>
            ) : (
              'Crea Operatore'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
