/**
 * Pagina Gestione Limiti Rifiuti (da Settings)
 * Permette di configurare i limiti annuali di rifiuti smaltibili
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { FiPlus, FiTrash2, FiEdit, FiSave, FiX, FiAlertCircle, FiInfo } from "react-icons/fi";

export default function RifiutiLimitiSettings() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [limiti, setLimiti] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    anno: new Date().getFullYear(),
    codice_eer: "",
    limite_quantita: "",
    unita_misura: "kg",
    soglia_alert_percentuale: 80,
    note: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (orgId) {
      loadLimiti();
    }
  }, [orgId]);

  async function loadLimiti() {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const currentYear = new Date().getFullYear();
      const response = await fetch(`${apiUrl}/limiti?org_id=${orgId}&anno=${currentYear}`);
      
      if (response.ok) {
        const data = await response.json();
        setLimiti(data.limiti || []);
      }
    } catch (error) {
      console.error("Errore caricamento limiti:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!orgId || !formData.limite_quantita) {
      alert("Compila tutti i campi obbligatori");
      return;
    }

    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/limiti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          org_id: orgId,
          anno: formData.anno,
          codice_eer: formData.codice_eer || null,
          limite_quantita: parseFloat(formData.limite_quantita),
          unita_misura: formData.unita_misura,
          soglia_alert_percentuale: parseInt(formData.soglia_alert_percentuale),
          note: formData.note || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore salvataggio limite');
      }

      await loadLimiti();
      resetForm();
      alert("Limite salvato con successo!");
    } catch (error) {
      console.error("Errore salvataggio limite:", error);
      alert(`Errore: ${error?.message || 'Errore sconosciuto'}`);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setFormData({
      anno: new Date().getFullYear(),
      codice_eer: "",
      limite_quantita: "",
      unita_misura: "kg",
      soglia_alert_percentuale: 80,
      note: ""
    });
  }

  function handleEdit(limite) {
    setEditingId(limite.id);
    setFormData({
      anno: limite.anno,
      codice_eer: limite.codice_eer || "",
      limite_quantita: limite.limite_quantita.toString(),
      unita_misura: limite.unita_misura,
      soglia_alert_percentuale: limite.soglia_alert_percentuale || 80,
      note: limite.note || ""
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Limiti Quantità Rifiuti
        </h3>
        <p className="text-xs text-slate-500">
          Configura i limiti annuali per la quantità di rifiuti smaltibili. Il sistema ti avviserà quando ti avvicini al limite.
        </p>
      </div>

      {/* Form */}
      <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Anno *
            </label>
            <input
              type="number"
              value={formData.anno}
              onChange={(e) => setFormData({ ...formData, anno: parseInt(e.target.value) })}
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200"
              min="2020"
              max="2100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Codice EER (opzionale)
            </label>
            <input
              type="text"
              value={formData.codice_eer}
              onChange={(e) => setFormData({ ...formData, codice_eer: e.target.value })}
              placeholder="Es: 170101 (vuoto per limite totale)"
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200"
            />
            <p className="text-xs text-slate-500 mt-1">Lascia vuoto per limite totale annuo</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Quantità Limite *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.limite_quantita}
              onChange={(e) => setFormData({ ...formData, limite_quantita: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Unità di Misura
            </label>
            <select
              value={formData.unita_misura}
              onChange={(e) => setFormData({ ...formData, unita_misura: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200"
            >
              <option value="kg">kg</option>
              <option value="t">tonnellate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Soglia Alert (%)
            </label>
            <input
              type="number"
              value={formData.soglia_alert_percentuale}
              onChange={(e) => setFormData({ ...formData, soglia_alert_percentuale: parseInt(e.target.value) })}
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200"
              min="0"
              max="100"
            />
            <p className="text-xs text-slate-500 mt-1">Alert quando raggiungi questa percentuale</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Note
            </label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiSave className="w-3.5 h-3.5" />
            {editingId ? 'Aggiorna' : 'Salva'} Limite
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-xs bg-[#243044] hover:bg-[#1a2536] text-slate-300 rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
              Annulla
            </button>
          )}
        </div>
      </div>

      {/* Lista Limiti */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Caricamento...</div>
      ) : limiti.length === 0 ? (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-6 text-center">
          <FiInfo className="h-6 w-6 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            Nessun limite configurato per l'anno {new Date().getFullYear()}
          </p>
        </div>
      ) : (
        <div className="bg-[#1a2536] rounded-lg border border-[#243044] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#141c27]">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Anno</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Codice EER</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Limite</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Utilizzato</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Soglia Alert</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243044]">
              {limiti.map((limite) => {
                const percentuale = limite.limite_quantita > 0 
                  ? (limite.quantita_attuale / limite.limite_quantita) * 100 
                  : 0;
                return (
                  <tr key={limite.id} className="hover:bg-[#141c27]">
                    <td className="px-3 py-2 text-xs text-slate-200">{limite.anno}</td>
                    <td className="px-3 py-2 text-xs text-slate-200">{limite.codice_eer || 'Totale'}</td>
                    <td className="px-3 py-2 text-xs text-slate-200">
                      {limite.limite_quantita} {limite.unita_misura}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={percentuale >= 100 ? 'text-red-400' : percentuale >= limite.soglia_alert_percentuale ? 'text-amber-400' : 'text-slate-200'}>
                        {limite.quantita_attuale} {limite.unita_misura} ({percentuale.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-200">{limite.soglia_alert_percentuale}%</td>
                    <td className="px-3 py-2 text-xs">
                      <button
                        onClick={() => handleEdit(limite)}
                        className="text-blue-400 hover:text-blue-400"
                      >
                        <FiEdit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiInfo className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="text-xs text-blue-400">
            <p className="font-medium mb-1">Informazioni</p>
            <p>I limiti vengono calcolati automaticamente in base ai movimenti trasmessi a RENTRI. Puoi configurare limiti totali (senza codice EER) o specifici per codice EER.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

