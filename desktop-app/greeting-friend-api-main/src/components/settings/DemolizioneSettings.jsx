// src/components/settings/DemolizioneSettings.jsx
// Impostazioni voci fattura e template per demolizione VFU

import { useState, useEffect, useCallback } from "react";
import { FiPlus, FiTrash2, FiSave, FiRefreshCw } from "react-icons/fi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOrg } from "@/context/OrgContext";

const inputCls = "w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none focus:ring-1 ring-blue-500/30";

const DEFAULT_ITEMS = [
  {
    codice: "DEMO-VFU",
    descrizione: "Servizio di demolizione VFU ai sensi del D.Lgs 209/2003",
    qty: 1,
    prezzo: 150,
    iva: 22,
  },
];

export default function DemolizioneSettings({ showToast }) {
  const { orgId } = useOrg();
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [importoDefault, setImportoDefault] = useState(150);
  const [causaleTemplate, setCausaleTemplate] = useState(
    "Servizio demolizione veicolo {targa} {marca_modello} - D.Lgs 209/2003"
  );
  const [noteTemplate, setNoteTemplate] = useState(
    "Demolizione VFU D.Lgs 209/2003 - Targa: {targa} - Telaio: {telaio}"
  );

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("org_settings")
        .select("value")
        .eq("org_id", orgId)
        .eq("key", "demolizione_fattura")
        .maybeSingle();

      if (data?.value) {
        const v = data.value;
        if (v.items?.length) setItems(v.items);
        if (v.importo_default != null) setImportoDefault(v.importo_default);
        if (v.causale_template) setCausaleTemplate(v.causale_template);
        if (v.note_template) setNoteTemplate(v.note_template);
      }
    } catch (err) {
      console.error("[DemolizioneSettings] load error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, supabase]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const value = {
        items,
        importo_default: importoDefault,
        causale_template: causaleTemplate,
        note_template: noteTemplate,
      };

      const { error } = await supabase
        .from("org_settings")
        .upsert(
          { org_id: orgId, key: "demolizione_fattura", value },
          { onConflict: "org_id,key" }
        );

      if (error) throw error;
      showToast?.("Impostazioni demolizione salvate");
    } catch (err) {
      console.error("[DemolizioneSettings] save error:", err);
      showToast?.("Errore salvataggio: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems([...items, { codice: "", descrizione: "", qty: 1, prezzo: 0, iva: 22 }]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const resetDefaults = () => {
    setItems(DEFAULT_ITEMS);
    setImportoDefault(150);
    setCausaleTemplate("Servizio demolizione veicolo {targa} {marca_modello} - D.Lgs 209/2003");
    setNoteTemplate("Demolizione VFU D.Lgs 209/2003 - Targa: {targa} - Telaio: {telaio}");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Caricamento impostazioni demolizione...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Impostazioni Fattura Demolizione</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura le voci predefinite della fattura generata automaticamente al completamento della demolizione VFU
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetDefaults}
            className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#141c27] border border-[#243044] rounded-lg hover:bg-[#243044] transition">
            <FiRefreshCw className="w-3.5 h-3.5 inline mr-1" /> Ripristina default
          </button>
          <button onClick={save} disabled={saving}
            className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            <FiSave className="w-3.5 h-3.5 inline mr-1" /> {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      {/* Voci Fattura */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#243044] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Righe Fattura Predefinite</h3>
          <button onClick={addItem}
            className="h-7 px-2.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition">
            <FiPlus className="w-3 h-3 inline mr-1" /> Aggiungi riga
          </button>
        </div>
        <div className="p-5 space-y-3">
          {items.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">Nessuna riga configurata. Aggiungi almeno una riga.</p>
          )}
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-2">
                {idx === 0 && <label className="block text-[10px] text-slate-500 mb-1">Codice</label>}
                <input
                  type="text"
                  value={item.codice}
                  onChange={e => updateItem(idx, "codice", e.target.value)}
                  placeholder="Codice"
                  className={inputCls}
                />
              </div>
              <div className="col-span-5">
                {idx === 0 && <label className="block text-[10px] text-slate-500 mb-1">Descrizione</label>}
                <input
                  type="text"
                  value={item.descrizione}
                  onChange={e => updateItem(idx, "descrizione", e.target.value)}
                  placeholder="Descrizione voce"
                  className={inputCls}
                />
              </div>
              <div className="col-span-1">
                {idx === 0 && <label className="block text-[10px] text-slate-500 mb-1">Q.tà</label>}
                <input
                  type="number"
                  value={item.qty}
                  onChange={e => updateItem(idx, "qty", Number(e.target.value))}
                  min={1}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className="block text-[10px] text-slate-500 mb-1">Prezzo</label>}
                <input
                  type="number"
                  value={item.prezzo}
                  onChange={e => updateItem(idx, "prezzo", Number(e.target.value))}
                  step="0.01"
                  min={0}
                  className={inputCls}
                />
              </div>
              <div className="col-span-1">
                {idx === 0 && <label className="block text-[10px] text-slate-500 mb-1">IVA %</label>}
                <input
                  type="number"
                  value={item.iva}
                  onChange={e => updateItem(idx, "iva", Number(e.target.value))}
                  min={0}
                  max={100}
                  className={inputCls}
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {idx === 0 && <label className="block text-[10px] text-slate-500 mb-1">&nbsp;</label>}
                <button onClick={() => removeItem(idx)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-lg transition">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[#243044] bg-[#141c27]/50">
          <p className="text-[10px] text-slate-500">
            Nella descrizione puoi usare segnaposto: <code className="text-blue-400">{"{targa}"}</code>, <code className="text-blue-400">{"{telaio}"}</code>, <code className="text-blue-400">{"{marca_modello}"}</code>, <code className="text-blue-400">{"{anno}"}</code>, <code className="text-blue-400">{"{peso_ingresso}"}</code>
          </p>
        </div>
      </div>

      {/* Template Causale e Note */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#243044]">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Template Fattura</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Causale fattura (campo SDI)</label>
            <input
              type="text"
              value={causaleTemplate}
              onChange={e => setCausaleTemplate(e.target.value)}
              className={inputCls}
              placeholder="Servizio demolizione veicolo {targa} ..."
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Note interne fattura</label>
            <textarea
              value={noteTemplate}
              onChange={e => setNoteTemplate(e.target.value)}
              rows={2}
              className={inputCls + " resize-none"}
              placeholder="Template note..."
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Importo default (se nessuna riga configurata)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">€</span>
              <input
                type="number"
                value={importoDefault}
                onChange={e => setImportoDefault(Number(e.target.value))}
                step="0.01"
                min={0}
                className={inputCls + " w-32"}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-[#243044] bg-[#141c27]/50">
          <p className="text-[10px] text-slate-500">
            Segnaposto disponibili: <code className="text-blue-400">{"{targa}"}</code>, <code className="text-blue-400">{"{telaio}"}</code>, <code className="text-blue-400">{"{marca_modello}"}</code>, <code className="text-blue-400">{"{anno}"}</code>, <code className="text-blue-400">{"{peso_ingresso}"}</code>, <code className="text-blue-400">{"{peso_carcassa}"}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
