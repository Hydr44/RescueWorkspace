/**
 * Toggle per pubblicare ricambio su Marketplace B2B
 * Componente da integrare nel form ricambi
 */

import { useState, useEffect } from 'react';
import { FiPackage, FiCheck, FiX } from 'react-icons/fi';
import { isSparePartOnMarketplace } from '../lib/marketplace-sync';

export default function MarketplacePublishToggle({ 
  orgId, 
  sparePartId, 
  value, 
  onChange,
  disabled = false 
}) {
  const [isPublished, setIsPublished] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (sparePartId && orgId) {
      checkMarketplaceStatus();
    }
  }, [sparePartId, orgId]);

  async function checkMarketplaceStatus() {
    setChecking(true);
    try {
      const { isPublished: published } = await isSparePartOnMarketplace(orgId, sparePartId);
      setIsPublished(published);
    } catch (err) {
      console.error('Errore verifica marketplace:', err);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-lg">
          <FiPackage className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Marketplace B2B tra Demolitori
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Pubblica questo ricambio nel marketplace per venderlo ad altri demolitori
          </p>

          {isPublished && (
            <div className="mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Già pubblicato sul marketplace</span>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled || checking}
              className="w-5 h-5 rounded border-[#243044] bg-[#141c27] text-emerald-500 disabled:opacity-50"
            />
            <span className="text-sm text-slate-300">
              {isPublished 
                ? 'Aggiorna annuncio marketplace' 
                : 'Pubblica su Marketplace B2B'
              }
            </span>
          </label>

          {value && !isPublished && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400">
                ℹ️ L'annuncio verrà creato automaticamente quando salvi il ricambio
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
