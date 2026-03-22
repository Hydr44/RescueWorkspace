import { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';

/**
 * Componente per il login dell'operatore con password
 * Design moderno con gradienti e animazioni
 */
export default function OperatorLogin({ operator, onLogin, onBack, loading: externalLoading }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Inserisci la password');
      return;
    }

    setLoading(true);
    try {
      // Always use persistent token (rememberDevice = true)
      const result = await onLogin(operator.id, password, true);
      if (!result.success) {
        setError(result.error || 'Password non corretta');
      }
    } catch (err) {
      setError(err.message || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
          <FiLock className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          {operator.nome || operator.codice_operatore || 'Operatore'}
        </h3>
        <p className="text-sm text-slate-400">
          {operator.ruolo || operator.codice_operatore || 'Operatore'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Inserisci la password"
              disabled={isLoading}
              className="block w-full pl-10 pr-10 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[#1a2536] text-slate-200 placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-400 "
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
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
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-[#243044] text-slate-300 font-medium rounded-xl hover:bg-[#141c27] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Indietro
          </button>
          <button
            type="submit"
            disabled={isLoading || !password}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Accesso...
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
