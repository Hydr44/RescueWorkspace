import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiRefreshCcw, FiUserPlus, FiEdit, FiMapPin, FiUser, FiFileText, FiClock, FiTruck, FiCheckCircle, FiCreditCard, FiPrinter } from "react-icons/fi";
import { supabaseBrowser } from "../lib/supabase-browser";
import { useOrg } from "../context/OrgContext";

export default function TransportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = supabaseBrowser();
  const { orgId } = useOrg();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('transports')
        .select('id, number, org_id, client_id, client:clients(nome,codice,phone,number), customer_name, customer_phone, pickup_address, dropoff_address, status, notes, created_at')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();
      if (error) throw error;
      setItem(data);
    } catch (e) {
      if (isDev) console.error('load transport failed', e);
      setError('Impossibile caricare il trasporto');
    } finally {
      setLoading(false);
    }
  }, [id, orgId, supabase, isDev]);

  useEffect(() => { if (id && orgId) load(); }, [id, orgId, load]);

  const cycleStatus = async () => {
    if (!item) return;
    const order = ['new','assigned','enroute','done'];
    const next = order[(order.indexOf(item.status) + 1) % order.length] || 'new';
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('transports')
        .update({ status: next })
        .eq('id', item.id)
        .eq('org_id', orgId)
        .select('*')
        .single();
      if (error) throw error;
      setItem(data);
    } catch (e) {
      setError('Errore aggiornando lo stato');
    } finally {
      setSaving(false);
    }
  };

  const registerClient = () => {
    if (!item || item.client_id) return;
    const nome = item.customer_name?.trim() || '';
    const phone = item.customer_phone || '';
    const address = item.pickup_address || '';
    const notes = item.notes || '';
    const params = new URLSearchParams();
    if (nome) params.set('name', nome);
    if (phone) params.set('phone', phone);
    if (address) params.set('address', address);
    if (notes) params.set('note', notes);
    params.set('return', `/trasporti/${item.id}`);
    setSaving(true);
    setTimeout(() => {
      navigate(`/clienti/nuovo?${params.toString()}`);
    }, 650);
  };

  const printSummary = () => {
    if (!item) return;
    const num = item.number ? `TR${String(item.number).padStart(4, '0')}` : `#${item.id?.slice(0, 6)}`;
    const sc = statusConfig[item.status] || statusConfig.new;
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
    const esc = (s) => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Trasporto ${esc(num)}</title>
<style>
  @media print { @page { margin: 20mm; } }
  body { font-family: system-ui, -apple-system, sans-serif; color: #111; padding: 24px; max-width: 700px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; } .sub { color: #666; font-size: 13px; margin-bottom: 20px; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 8px; font-weight: 600; }
  .value { font-size: 14px; } .label { font-size: 11px; color: #999; margin-bottom: 2px; }
  .route { display: flex; align-items: center; gap: 12px; margin: 6px 0; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-a { background: #3b82f6; } .dot-b { background: #10b981; }
  .line { width: 2px; height: 16px; background: #ddd; margin-left: 4px; }
  .status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; background: #f0f0f0; }
  .notes { white-space: pre-wrap; font-size: 13px; color: #333; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
</style></head><body>
<h1>Riepilogo Trasporto ${esc(num)}</h1>
<div class="sub">Data: ${esc(dateStr)} &mdash; Stato: <span class="status">${esc(sc?.label || item.status)}</span></div>
<div class="card"><div class="card-title">Cliente</div>
  <div class="value">${esc(item.client?.nome || item.customer_name || '—')}</div>
  ${(item.client?.phone || item.customer_phone) ? `<div style="color:#666;font-size:13px;margin-top:4px">${esc(item.client?.phone || item.customer_phone)}</div>` : ''}
</div>
<div class="card"><div class="card-title">Percorso</div>
  <div class="route"><div class="dot dot-a"></div><div><div class="label">Partenza</div><div class="value">${esc(item.pickup_address || '—')}</div></div></div>
  <div class="line"></div>
  <div class="route"><div class="dot dot-b"></div><div><div class="label">Arrivo</div><div class="value">${esc(item.dropoff_address || '—')}</div></div></div>
</div>
${item.notes ? `<div class="card"><div class="card-title">Note</div><div class="notes">${esc(item.notes)}</div></div>` : ''}
<div class="footer">Stampato il ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
</body></html>`;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) return;
    w.document.write(html + '<script>window.print();<\/script>');
    w.document.close();
    w.focus();
  };

  const statusConfig = {
    new:      { label: 'Nuovo',      color: 'blue',    border: 'border-l-blue-500',   bg: 'bg-blue-500/10',   text: 'text-blue-400' },
    assigned: { label: 'Assegnato',  color: 'amber',   border: 'border-l-amber-500',  bg: 'bg-amber-500/10',  text: 'text-amber-400' },
    enroute:  { label: 'In Viaggio', color: 'purple',  border: 'border-l-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    done:     { label: 'Completato', color: 'emerald', border: 'border-l-emerald-500',bg: 'bg-emerald-500/10',text: 'text-emerald-400' },
  };

  const statusSteps = ['new', 'assigned', 'enroute', 'done'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Caricamento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
        <button onClick={load} className="px-3 py-1.5 text-xs font-medium bg-[#1a2536] border border-[#243044] text-slate-300 rounded-lg hover:bg-[#243044] transition-colors">Riprova</button>
      </div>
    );
  }

  if (!item) return <div className="py-10 text-center text-sm text-slate-500">Nessun dato</div>;

  const sc = statusConfig[item.status] || statusConfig.new;
  const currentStepIdx = statusSteps.indexOf(item.status);

  return (
    <div className="space-y-4">
      {/* Header compatto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/trasporti')} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-100">Trasporto {item.number ? `TR${String(item.number).padStart(4, '0')}` : `#${item.id?.slice(0,6)}`}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                {sc.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Creato il {item.created_at ? new Date(item.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!item.client_id && item.customer_name && (
            <button onClick={registerClient} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
              <FiUserPlus className="w-3.5 h-3.5" /> Registra cliente
            </button>
          )}
          <button onClick={printSummary} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
            <FiPrinter className="w-3.5 h-3.5" /> Stampa
          </button>
          <button onClick={() => navigate(`/trasporti/new?id=${item.id}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors">
            <FiEdit className="w-3.5 h-3.5" /> Modifica
          </button>
          {item.status === 'done' && (
            <button
              onClick={() => {
                const num = item.number ? `TR${String(item.number).padStart(4,'0')}` : item.id?.slice(0,6);
                const desc = encodeURIComponent(`Trasporto ${num} — ${item.pickup_address || ''} → ${item.dropoff_address || ''}`);
                const clientId = item.client_id ? `&clientId=${item.client_id}` : '';
                navigate(`/fatture/new?transportId=${item.id}${clientId}&description=${desc}`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/15 transition-colors"
            >
              <FiCreditCard className="w-3.5 h-3.5" /> Crea Fattura
            </button>
          )}
          <button onClick={cycleStatus} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <FiRefreshCcw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Avanza stato
          </button>
        </div>
      </div>

      {/* Progress bar stato */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <div className="flex items-center gap-1">
          {statusSteps.map((step, i) => {
            const stepCfg = statusConfig[step];
            const isActive = i <= currentStepIdx;
            const isCurrent = step === item.status;
            return (
              <div key={step} className="flex-1 flex items-center gap-2">
                <div className={`flex items-center gap-1.5 flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isCurrent ? `${stepCfg.bg} ${stepCfg.text} ring-1 ring-${stepCfg.color}-500/30` 
                  : isActive ? 'bg-emerald-500/5 text-emerald-400/60' 
                  : 'bg-[#141c27] text-slate-600'
                }`}>
                  {isActive && i < currentStepIdx ? (
                    <FiCheckCircle className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <FiTruck className="w-3.5 h-3.5" />
                  ) : (
                    <FiClock className="w-3.5 h-3.5" />
                  )}
                  {stepCfg.label}
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`w-4 h-px ${isActive && i < currentStepIdx ? 'bg-emerald-500/40' : 'bg-[#243044]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info cards 2 colonne */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Cliente */}
        <div className={`bg-[#1a2536] rounded-xl border border-[#243044] ${sc.border} border-l-2 p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <FiUser className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</span>
          </div>
          <p className="text-sm font-medium text-slate-200">
            {item.client?.nome || item.customer_name || '—'}
            {item.client?.codice && <span className="ml-1.5 text-xs text-slate-500">({item.client.codice})</span>}
          </p>
          {(item.client?.phone || item.customer_phone) && (
            <p className="text-xs text-slate-400 mt-1">{item.client?.phone || item.customer_phone}</p>
          )}
          {!item.client_id && item.customer_name && (
            <p className="text-xs text-amber-400/70 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Cliente non registrato
            </p>
          )}
        </div>

        {/* Indirizzi */}
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <FiMapPin className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Percorso</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5 shrink-0">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Partenza</p>
                <p className="text-sm text-slate-200">{item.pickup_address || '—'}</p>
              </div>
            </div>
            <div className="ml-2.5 w-px h-3 bg-[#243044]" />
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Arrivo</p>
                <p className="text-sm text-slate-200">{item.dropoff_address || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <FiFileText className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Note</span>
        </div>
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.notes || 'Nessuna nota'}</p>
      </div>
    </div>
  );
}


