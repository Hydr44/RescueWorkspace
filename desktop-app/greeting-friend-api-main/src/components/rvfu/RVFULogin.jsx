// src/components/rvfu/RVFULogin.jsx
// Componente per autenticazione RVFU

import React, { useState } from 'react';
import { FiShield, FiAlertCircle, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';

export default function RVFULogin({ onSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [environment, setEnvironment] = useState('formation');
  
  const { login, isLoading, error, clearError } = useRVFUAuth(environment);

  // Credenziali di test
  const TEST_CREDENTIALS = {
    username: 'DETO003001',
    password: 'TEST.030',
  };

  const fillTestCredentials = () => {
    setUsername(TEST_CREDENTIALS.username);
    setPassword(TEST_CREDENTIALS.password);
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    console.log('[RVFU Login] Submit form:', {
      username,
      hasPassword: !!password,
      environment,
    });
    
    try {
      console.log('[RVFU Login] Chiamata login...');
      await login(username, password); // Login con credenziali (secondo specifiche ACI)
      console.log('[RVFU Login] Login completato con successo!');
      onSuccess?.();
    } catch (error) {
      console.error('[RVFU Login] Errore login:', error);
      // Error già gestito dal hook
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="bg-[#1a2536] rounded-2xl shadow-2xl border border-[#243044] p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Autenticazione RVFU
          </h1>
          <p className="text-slate-400">
            Accedi ai servizi ACI/MIT per la gestione VFU
          </p>
        </div>

        {/* Environment Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Ambiente
          </label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full px-3 py-2 border border-[#243044] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-[#1a2536] text-white"
            disabled={isLoading}
          >
            <option value="formation">Formazione (Test)</option>
            <option value="production">Produzione (Esercizio)</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Credentials Button */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Credenziali di test</span>
            <button
              type="button"
              onClick={fillTestCredentials}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Usa credenziali test
            </button>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Username (Matricola Agenzia)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Es: DETO000301"
              className="w-full px-3 py-2 border border-[#243044] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-[#1a2536] text-white placeholder-slate-600"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Password (Agenzia)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci password ACI"
                className="w-full px-3 py-2 pr-10 border border-[#243044] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-[#1a2536] text-white placeholder-slate-600"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-400"
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <FiLoader className="w-5 h-5 mr-2 animate-spin" />
                Autenticazione...
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-start">
            <FiShield className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Sicurezza</p>
              <p>
                Secondo le specifiche ACI/MIT, le credenziali vengono utilizzate per autenticazione programmatica.
                Il flusso /authenticate evita la richiesta della pagina di Login interattiva.
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="mt-4 text-center">
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-400 text-sm"
              disabled={isLoading}
            >
              Annulla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
