import React, { useState } from 'react';
import { 
  FiEdit, FiX, FiCheckCircle, FiSend, FiTrash2, FiUserPlus, 
  FiShuffle, FiUnlock, FiFileText, FiAward, FiPaperclip, FiTruck, FiSearch, FiLoader
} from 'react-icons/fi';
import { getAzioniDisponibili } from '@/lib/vfu-state-machine';
import LoadingButton from '@/components/ui/LoadingButton';
import Modal from '@/components/ui/Modal';

const ICON_MAP = {
  FiEdit, FiX, FiCheckCircle, FiSend, FiTrash2, FiUserPlus,
  FiShuffle, FiUnlock, FiFileText, FiAward, FiPaperclip, FiTruck
};

const STASearchField = ({ rvfuClient, value, onChange }) => {
  const [searchCode, setSearchCode] = useState(value || '');
  const [searching, setSearching] = useState(false);
  const [agenzia, setAgenzia] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchCode.trim() || !rvfuClient) return;
    setSearching(true);
    setError('');
    setAgenzia(null);
    try {
      const response = await rvfuClient.ricercaAgenziaSTA(searchCode.trim().toUpperCase());
      const esito = response?.esito;
      const result = response?.result ?? response?.payload;
      if (result?.codiceAgenzia) {
        setAgenzia(result);
        onChange(result.codiceAgenzia, result);
      } else {
        const msg = esito?.message || 'Agenzia non trovata';
        setError(msg);
        onChange('', null);
      }
    } catch (err) {
      setError(err.message || 'Errore ricerca agenzia');
      onChange('', null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Ricerca Agenzia STA *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => {
              setSearchCode(e.target.value.toUpperCase());
              if (agenzia) { setAgenzia(null); onChange('', null); }
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono"
            placeholder="es. RM0001, BO0001"
            required
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !searchCode.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-1.5"
          >
            {searching ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4" />}
            Cerca
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Inserisci il codice STA e premi Cerca (es. RM0001, RM1000, BO0001)
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          {error}
        </div>
      )}

      {agenzia && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <FiCheckCircle className="w-4 h-4" />
            Agenzia trovata
          </div>
          <div className="text-xs text-gray-300">
            <span className="font-mono text-green-300">{agenzia.codiceAgenzia}</span>
            {' — '}
            {agenzia.denominazione || 'N/A'}
          </div>
          {agenzia.provinciaSede && (
            <div className="text-xs text-gray-400">
              Provincia: {agenzia.provinciaSede}
            </div>
          )}
          {agenzia.email && (
            <div className="text-xs text-gray-400">
              Email: {agenzia.email}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const VFUAzioniTab = ({ 
  statoVFU, 
  fascicoloStato,
  onAzioneClick,
  loading,
  rvfuClient 
}) => {
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionData, setActionData] = useState({});

  const azioni = getAzioniDisponibili(statoVFU, fascicoloStato);

  const handleActionClick = (azione) => {
    if (azione.requiresConfirm) {
      setConfirmAction(azione);
      setActionData({});
    } else {
      onAzioneClick(azione.azione, {});
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      onAzioneClick(confirmAction.azione, actionData);
      setConfirmAction(null);
      setActionData({});
    }
  };

  const getVariantClasses = (variant) => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500',
      success: 'bg-green-600 hover:bg-green-700 text-white border-green-500',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-red-500',
      info: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500',
    };
    return variants[variant] || variants.info;
  };

  if (azioni.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">Nessuna azione disponibile</div>
        <div className="text-sm text-gray-500">
          Lo stato corrente non permette ulteriori azioni
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-xl border border-[#243044] p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Azioni disponibili per lo stato corrente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {azioni.map((azione) => {
            const IconComponent = ICON_MAP[azione.icon] || FiCheckCircle;
            const variantClasses = getVariantClasses(azione.variant);

            return (
              <LoadingButton
                key={azione.azione}
                onClick={() => handleActionClick(azione)}
                loading={loading}
                className={`${variantClasses} rounded-lg p-4 border transition-all flex items-start gap-3 text-left`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{azione.label}</div>
                  <div className="text-xs opacity-90 mt-0.5">
                    {azione.descrizione}
                  </div>
                </div>
              </LoadingButton>
            );
          })}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          title={`Conferma: ${confirmAction.label}`}
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              {confirmAction.descrizione}
            </p>

            {/* Azione-specific forms */}
            {confirmAction.azione === 'annulla' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Motivo annullamento
                </label>
                <textarea
                  value={actionData.motivoEliminazione || ''}
                  onChange={(e) => setActionData({ motivoEliminazione: e.target.value })}
                  className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  rows={3}
                  placeholder="Inserisci il motivo dell'annullamento"
                  required
                />
              </div>
            )}

            {confirmAction.azione === 'demolisci' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data distruzione targa *
                  </label>
                  <input
                    type="date"
                    value={actionData.dataDistruzioneTarga || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setActionData(prev => ({ ...prev, dataDistruzioneTarga: e.target.value }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data distruzione documenti *
                  </label>
                  <input
                    type="date"
                    value={actionData.dataDistruzioneDocumenti || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setActionData(prev => ({ ...prev, dataDistruzioneDocumenti: e.target.value }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Numero targhe distrutte *
                  </label>
                  <input
                    type="number"
                    value={actionData.numeroTargheDistrutte ?? 2}
                    onChange={(e) => setActionData(prev => ({ ...prev, numeroTargheDistrutte: Number.parseInt(e.target.value, 10) }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    min="0"
                    max="2"
                  />
                </div>
                <div className="text-xs text-gray-400 bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                  <strong>Nota:</strong> Tutti i campi sono obbligatori per l'API ACI.
                </div>
              </div>
            )}

            {confirmAction.azione === 'aggiorna' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data bonifica
                  </label>
                  <input
                    type="date"
                    value={actionData.dataBonifica || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, dataBonifica: e.target.value }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Note parti rifiuti
                  </label>
                  <textarea
                    value={actionData.notePartiRifiuti || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, notePartiRifiuti: e.target.value }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    rows={3}
                    placeholder="Note opzionali su parti rifiuti"
                  />
                </div>
              </div>
            )}

            {confirmAction.azione === 'inoltraSTA' && (
              <STASearchField
                rvfuClient={rvfuClient}
                value={actionData.codiceSTA || ''}
                onChange={(codice, agenzia) => setActionData(prev => ({ ...prev, codiceSTA: codice, agenziaSTA: agenzia }))}
              />
            )}

            {confirmAction.azione === 'cedi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Codice Fiscale destinatario *
                  </label>
                  <input
                    type="text"
                    value={actionData.codiceFiscaleDestinatario || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, codiceFiscaleDestinatario: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono"
                    placeholder="RSSMRA80A01H501Z"
                    maxLength={16}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Matricola sede destinatario
                  </label>
                  <input
                    type="text"
                    value={actionData.matricolaSedeDestinatario || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, matricolaSedeDestinatario: e.target.value }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Matricola sede"
                  />
                </div>
              </div>
            )}

            {confirmAction.azione === 'prendiInCarico' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data presa in carico
                </label>
                <input
                  type="date"
                  value={actionData.dataPresaInCarico || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setActionData({ dataPresaInCarico: e.target.value })}
                  className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            )}

            {confirmAction.azione === 'trasferisci' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Codice Fiscale nuovo CR *
                  </label>
                  <input
                    type="text"
                    value={actionData.codiceFiscaleNuovoCR || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, codiceFiscaleNuovoCR: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-mono"
                    placeholder="CF Centro Raccolta destinazione"
                    maxLength={16}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Motivazione trasferimento
                  </label>
                  <textarea
                    value={actionData.motivazione || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, motivazione: e.target.value }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    rows={3}
                    placeholder="Inserisci la motivazione del trasferimento"
                  />
                </div>
              </div>
            )}

            {confirmAction.azione === 'integra' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dati integrazione richiesti *
                  </label>
                  <textarea
                    value={actionData.datiIntegrazione || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, datiIntegrazione: e.target.value }))}
                    className="w-full bg-[#243044] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                    rows={5}
                    placeholder="Inserisci i dati richiesti dall'agenzia STA per completare la radiazione"
                    required
                  />
                </div>
                <div className="text-xs text-gray-400 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                  <strong>Nota:</strong> Assicurati di inserire tutti i dati richiesti dalla STA nel dettaglio della richiesta di integrazione.
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-[#243044]">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
              >
                Annulla
              </button>
              <LoadingButton
                onClick={handleConfirmAction}
                loading={loading}
                className={`px-4 py-2 ${getVariantClasses(confirmAction.variant)} rounded-lg text-sm`}
              >
                Conferma
              </LoadingButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VFUAzioniTab;
