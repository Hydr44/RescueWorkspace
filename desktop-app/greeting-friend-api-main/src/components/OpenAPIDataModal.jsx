// src/components/OpenAPIDataModal.jsx
// Modal per visualizzare e selezionare dati recuperati da Agenzia delle Entrate

import { useState } from 'react';
import { FiX, FiCheck, FiInfo, FiMapPin, FiMail, FiHash, FiBriefcase } from 'react-icons/fi';

export default function OpenAPIDataModal({ isOpen, onClose, companyData, onApply }) {
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    taxCode: true,
    street: true,
    zip: true,
    city: true,
    province: true,
    codiceDestinatario: true,
    pec: true
  });

  if (!isOpen || !companyData) return null;

  const toggleField = (field) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleApply = () => {
    const fieldsToApply = {};
    Object.keys(selectedFields).forEach(field => {
      if (selectedFields[field]) {
        // Per 'name', usa anche 'denomination' come fallback
        if (field === 'name') {
          const value = companyData.name || companyData.denomination;
          if (value) fieldsToApply[field] = value;
        } else if (companyData[field]) {
          fieldsToApply[field] = companyData[field];
        }
      }
    });
    onApply(fieldsToApply);
    onClose();
  };

  // Prepara dati per il modal (usa denomination se name non c'è)
  const displayData = {
    ...companyData,
    name: companyData.name || companyData.denomination || '',
    denomination: companyData.denomination || companyData.name || ''
  };

  const hasData = (field) => {
    // Per 'name', controlla anche 'denomination' come fallback
    if (field === 'name') {
      const value = displayData.name || displayData.denomination;
      return value && String(value).trim().length > 0;
    }
    const value = displayData[field];
    return value && String(value).trim().length > 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-[#1a2536] rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#1a2536] border-b border-[#243044] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <FiCheck className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">
                Dati Azienda da Agenzia delle Entrate
              </h2>
              <p className="text-sm text-slate-500">
                Seleziona i campi da compilare automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-400 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Azienda */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiInfo className="text-blue-600 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {displayData.denomination || displayData.name || 'Azienda trovata'}
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  P.IVA: {companyData.vat} | 
                  {companyData.active ? (
                    <span className="text-green-600 ml-1">● Attiva</span>
                  ) : (
                    <span className="text-yellow-600 ml-1">● {companyData.status || 'Stato sconosciuto'}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Campi disponibili */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Dati disponibili:
            </h3>

            {/* Ragione Sociale */}
            {hasData('name') && (
              <label className="flex items-start gap-3 p-3 border border-[#243044] rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedFields.name}
                  onChange={() => toggleField('name')}
                  className="mt-1 w-4 h-4 text-blue-600 border-[#243044] rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FiBriefcase className="text-slate-500" size={16} />
                    <span className="text-sm font-medium text-slate-200">Ragione Sociale</span>
                  </div>
                  <p className="text-sm text-slate-400">{displayData.name || displayData.denomination}</p>
                </div>
              </label>
            )}

            {/* Codice Fiscale */}
            {hasData('taxCode') && (
              <label className="flex items-start gap-3 p-3 border border-[#243044] rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedFields.taxCode}
                  onChange={() => toggleField('taxCode')}
                  className="mt-1 w-4 h-4 text-blue-600 border-[#243044] rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FiHash className="text-slate-500" size={16} />
                    <span className="text-sm font-medium text-slate-200">Codice Fiscale</span>
                  </div>
                  <p className="text-sm text-slate-400 font-mono">{displayData.taxCode}</p>
                </div>
              </label>
            )}

            {/* Indirizzo */}
            {(hasData('street') || hasData('zip') || hasData('city') || hasData('province')) && (
              <label className="flex items-start gap-3 p-3 border border-[#243044] rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedFields.street && selectedFields.zip && selectedFields.city && selectedFields.province}
                  onChange={() => {
                    const allSelected = selectedFields.street && selectedFields.zip && selectedFields.city && selectedFields.province;
                    setSelectedFields(prev => ({
                      ...prev,
                      street: !allSelected,
                      zip: !allSelected,
                      city: !allSelected,
                      province: !allSelected
                    }));
                  }}
                  className="mt-1 w-4 h-4 text-blue-600 border-[#243044] rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FiMapPin className="text-slate-500" size={16} />
                    <span className="text-sm font-medium text-slate-200">Indirizzo</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {[displayData.street, displayData.zip, displayData.city, displayData.province]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </label>
            )}

            {/* Codice Destinatario SDI */}
            {hasData('codiceDestinatario') && (
              <label className="flex items-start gap-3 p-3 border border-[#243044] rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedFields.codiceDestinatario}
                  onChange={() => toggleField('codiceDestinatario')}
                  className="mt-1 w-4 h-4 text-blue-600 border-[#243044] rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FiHash className="text-slate-500" size={16} />
                    <span className="text-sm font-medium text-slate-200">Codice Destinatario SDI</span>
                  </div>
                  <p className="text-sm text-slate-400 font-mono">{displayData.codiceDestinatario}</p>
                </div>
              </label>
            )}

            {/* PEC */}
            {hasData('pec') && (
              <label className="flex items-start gap-3 p-3 border border-[#243044] rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedFields.pec}
                  onChange={() => toggleField('pec')}
                  className="mt-1 w-4 h-4 text-blue-600 border-[#243044] rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FiMail className="text-slate-500" size={16} />
                    <span className="text-sm font-medium text-slate-200">PEC</span>
                  </div>
                  <p className="text-sm text-slate-400">{displayData.pec}</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#141c27] border-t border-[#243044] px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-[#141c27]  rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <FiCheck size={16} />
            Applica Campi Selezionati
          </button>
        </div>
      </div>
    </div>
  );
}
