// src/pages/RifiutiCertificati.jsx
/**
 * Gestione Certificati RENTRI per Organizzazione
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  FiShield, FiPlus, FiCheckCircle,
  FiAlertCircle, FiRefreshCw, FiStar, FiKey, FiEdit3,
  FiSmartphone, FiX, FiSave
} from "react-icons/fi";
import rentriCert from "../lib/rentri-multi-cert";
import { supabaseBrowser } from "../lib/supabase-browser";

export default function RifiutiCertificati() {
  const navigate = useNavigate();
  const { orgId } = useOrg();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState('demo');

  useEffect(() => {
    if (orgId) {
      loadCertificates();
    } else {
      setLoading(false);
    }
  }, [orgId]);

  async function loadCertificates() {
    setLoading(true);
    try {
      const certs = await rentriCert.listCertificates(orgId);
      setCertificates(certs);
    } catch (error) {
      console.error("[CERTIFICATI] Errore caricamento:", error);
      alert("Errore caricamento certificati: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault(certId, environment) {
    try {
      await rentriCert.setDefaultCertificate(certId, orgId, environment);
      await loadCertificates();
    } catch (error) {
      alert("Errore impostazione certificato default: " + error.message);
    }
  }

  async function handleDeactivate(certId) {
    if (!confirm("Disattivare questo certificato?")) return;
    try {
      await rentriCert.deactivateCertificate(certId, orgId);
      await loadCertificates();
    } catch (error) {
      alert("Errore disattivazione certificato: " + error.message);
    }
  }

  function parseDevices(raw) {
    if (!raw) return [];
    const t = raw.trim();
    if (t.startsWith('[')) {
      try {
        const arr = JSON.parse(t);
        if (Array.isArray(arr)) return arr.map((d, i) => ({ name: d.name || `Dispositivo ${i + 1}`, id: d.id || '' }));
      } catch(e) {}
    }
    const plain = t.replace(/^credentials_id_mobile:/, '');
    return plain ? [{ name: 'Dispositivo 1', id: plain }] : [];
  }

  async function handleSaveDevices(certId, devices) {
    try {
      const supabase = supabaseBrowser();
      const valid = devices.filter(d => d.id.trim());
      const jsonVal = valid.length > 0 ? JSON.stringify(valid) : null;
      const legacyNote = valid.length > 0 ? `credentials_id_mobile:${valid[0].id}` : null;
      const { error } = await supabase
        .from('rentri_org_certificates')
        .update({ credentials_id_mobile: jsonVal, note: legacyNote })
        .eq('id', certId)
        .eq('org_id', orgId);
      if (error) throw error;
      await loadCertificates();
      return true;
    } catch (error) {
      alert('Errore salvataggio: ' + error.message);
      return false;
    }
  }

  const CertificateCard = ({ cert }) => {
    const expiryInfo = rentriCert.checkCertificateExpiry(cert);

    let statusColor = "gray";
    let statusIcon = FiShield;
    let statusText = "Inattivo";

    if (cert.is_active) {
      if (expiryInfo.isExpired) {
        statusColor = "red";
        statusIcon = FiAlertCircle;
        statusText = "Scaduto";
      } else if (expiryInfo.isExpiringSoon) {
        statusColor = "yellow";
        statusIcon = FiAlertCircle;
        statusText = `Scade tra ${expiryInfo.daysRemaining}gg`;
      } else {
        statusColor = "green";
        statusIcon = FiCheckCircle;
        statusText = "Attivo";
      }
    }

    const StatusIcon = statusIcon;

    const envBadge = cert.environment === 'demo'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-teal-500/10 text-teal-400 border-teal-500/20';

    const isFirma = cert.tipo_certificato === 'firma_remota';

    const rawCred = cert.credentials_id_mobile ||
      cert.note?.match(/credentials_id_mobile:(\S+)/)?.[1] ||
      null;
    const parsedDevices = parseDevices(rawCred);

    const [editingCred, setEditingCred] = useState(false);
    const [deviceList, setDeviceList] = useState(parsedDevices);
    const [savingCred, setSavingCred] = useState(false);

    function updateDevice(idx, field, value) {
      setDeviceList(prev => prev.map((d, i) => i === idx ? { ...d, [field]: field === 'id' ? value.toUpperCase() : value } : d));
    }
    function addDevice() { setDeviceList(prev => [...prev, { name: `Dispositivo ${prev.length + 1}`, id: '' }]); }
    function removeDevice(idx) { setDeviceList(prev => prev.filter((_, i) => i !== idx)); }

    async function saveCredentials() {
      setSavingCred(true);
      const ok = await handleSaveDevices(cert.id, deviceList);
      if (ok) setEditingCred(false);
      setSavingCred(false);
    }

    return (
      <div className="bg-[#1a2536]/50 border border-[#243044] rounded-lg p-5 hover:border-[#344054] transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              statusColor === 'green' ? 'bg-teal-500/10' :
              statusColor === 'red' ? 'bg-red-500/10' :
              statusColor === 'yellow' ? 'bg-yellow-500/10' : 'bg-gray-500/10'
            }`}>
              {isFirma
                ? <FiEdit3 className={`w-5 h-5 ${statusColor === 'green' ? 'text-teal-400' : statusColor === 'red' ? 'text-red-400' : statusColor === 'yellow' ? 'text-yellow-400' : 'text-gray-400'}`} />
                : <FiKey className={`w-5 h-5 ${statusColor === 'green' ? 'text-teal-400' : statusColor === 'red' ? 'text-red-400' : statusColor === 'yellow' ? 'text-yellow-400' : 'text-gray-400'}`} />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-200 text-sm">
                  {cert.ragione_sociale || cert.cf_operatore}
                </h3>
                {cert.is_default && (
                  <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" title="Default" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                CF: {cert.cf_operatore}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${envBadge}`}>
              {cert.environment === 'demo' ? 'DEMO' : 'PROD'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
              isFirma
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}>
              {isFirma ? 'Firma Remota' : 'Interoperabilita'}
            </span>
          </div>
        </div>

        {/* Info certificato */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-500">RENTRI ID</p>
            <p className="text-sm text-slate-400 mt-1">
              {cert.rentri_id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Serial Number</p>
            <p className="text-sm text-slate-400 mt-1 font-mono">
              {cert.serial_number || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Emesso il</p>
            <p className="text-sm text-slate-400 mt-1">
              {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('it-IT') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Scade il</p>
            <p className={`text-sm mt-1 ${expiryInfo.isExpiringSoon ? 'text-yellow-400 font-semibold' : 'text-slate-400'}`}>
              {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString('it-IT') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-2 mb-4 ${
          statusColor === 'green' ? 'text-teal-400' :
          statusColor === 'red' ? 'text-red-400' :
          statusColor === 'yellow' ? 'text-yellow-400' : 'text-gray-400'
        }`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{statusText}</span>
        </div>

        {/* Dispositivi di Firma (solo firma_remota) */}
        {isFirma && (
          <div className="mb-4 p-3 bg-[#141c27]/60 border border-[#1e2d44] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <FiSmartphone className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-slate-300">
                  Dispositivi di Firma
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cert.environment === 'demo' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>
                    {cert.environment === 'demo' ? 'DEMO' : 'PROD'}
                  </span>
                </span>
              </div>
              {!editingCred && (
                <button
                  onClick={() => { setDeviceList(parsedDevices.length > 0 ? parsedDevices : [{ name: 'Dispositivo 1', id: '' }]); setEditingCred(true); }}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 bg-[#1e2d44] hover:bg-[#243044] rounded transition-colors"
                >
                  <FiEdit3 className="w-3 h-3" />
                  {parsedDevices.length > 0 ? 'Modifica' : 'Aggiungi'}
                </button>
              )}
            </div>

            {editingCred ? (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500">
                  Portale <a href="https://demooperatori.rentri.gov.it" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">RENTRI Operatori</a> → Firma Remota → Dispositivi → copia il <strong className="text-slate-400">credentials_id</strong> (es. <span className="font-mono">FIZLU1OBD</span>).
                </p>
                {deviceList.map((dev, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      value={dev.name}
                      onChange={e => updateDevice(idx, 'name', e.target.value)}
                      placeholder="Nome dispositivo"
                      className="w-32 px-2 py-1.5 bg-[#0f1623] border border-[#243044] rounded text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500/40"
                    />
                    <input
                      value={dev.id}
                      onChange={e => updateDevice(idx, 'id', e.target.value)}
                      placeholder="credentials_id"
                      maxLength={50}
                      className="flex-1 px-2 py-1.5 bg-[#0f1623] border border-[#243044] rounded text-[11px] text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                    />
                    {idx === 0 && <span className="text-[9px] text-purple-400 font-medium whitespace-nowrap">Primario</span>}
                    <button onClick={() => removeDevice(idx)} className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={addDevice} className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 bg-[#1e2d44] rounded transition-colors">
                    <FiPlus className="w-3 h-3" /> Aggiungi dispositivo
                  </button>
                  <button onClick={saveCredentials} disabled={savingCred} className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50 ml-auto">
                    <FiSave className="w-3 h-3" /> {savingCred ? 'Salvo...' : 'Salva'}
                  </button>
                  <button onClick={() => setEditingCred(false)} className="p-1.5 text-slate-500 hover:text-slate-300 bg-[#1e2d44] rounded">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : parsedDevices.length > 0 ? (
              <div className="space-y-1.5">
                {parsedDevices.map((dev, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx === 0 && <span className="text-[9px] text-purple-400 font-semibold uppercase tracking-wide w-12 flex-shrink-0">Primary</span>}
                    {idx > 0  && <span className="text-[9px] text-slate-600 w-12 flex-shrink-0">Alt {idx}</span>}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[11px]">
                      <FiSmartphone className="w-3 h-3 text-purple-400" />
                      <span className="text-slate-400">{dev.name}</span>
                      <span className="text-purple-300 font-mono font-medium">{dev.id}</span>
                    </span>
                    {idx === 0 && <FiCheckCircle className="w-3 h-3 text-teal-400 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-[10px] text-amber-300">
                  Nessun dispositivo configurato. Clicca Aggiungi e inserisci il credentials_id dall&apos;app RENTRI.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!cert.is_default && cert.is_active && !expiryInfo.isExpired && (
            <button
              onClick={() => handleSetDefault(cert.id, cert.environment)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiStar className="w-3 h-3" />
              Imposta come Default
            </button>
          )}
          {cert.is_active && (
            <button
              onClick={() => handleDeactivate(cert.id)}
              className="px-3 py-1.5 text-xs font-medium bg-[#1a2536] border border-[#243044] hover:bg-[#243044] text-slate-400 rounded-lg transition-colors"
            >
              Disattiva
            </button>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-blue-400" />
            Certificati RENTRI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestione certificati di autenticazione per RENTRI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCertificates}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            Aggiorna
          </button>
          <button
            onClick={() => navigate("/rifiuti/certificati/upload")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-xs font-medium transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Carica Certificato
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiShield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300 mb-1">
              Certificati Digitali RENTRI
            </p>
            <p className="text-xs text-slate-500">
              Ogni autodemolitore ha bisogno di <strong className="text-slate-400">2 certificati</strong>:
              uno di <strong className="text-cyan-400">Interoperabilita</strong> (per autenticarsi alle API RENTRI)
              e uno di <strong className="text-purple-400">Firma Remota</strong> (per firmare digitalmente i FIR).
              Se gestisci piu aziende, ognuna deve avere i propri certificati.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedEnvironment('all')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            selectedEnvironment === 'all'
              ? 'bg-slate-600 text-white'
              : 'bg-[#1a2536] text-slate-500 hover:text-slate-400'
          }`}
        >
          Tutti
        </button>
        <button
          onClick={() => setSelectedEnvironment('demo')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            selectedEnvironment === 'demo'
              ? 'bg-blue-600 text-white'
              : 'bg-[#1a2536] text-slate-500 hover:text-slate-400'
          }`}
        >
          DEMO
        </button>
        <button
          onClick={() => setSelectedEnvironment('prod')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            selectedEnvironment === 'prod'
              ? 'bg-teal-600 text-white'
              : 'bg-[#1a2536] text-slate-500 hover:text-slate-400'
          }`}
        >
          PRODUZIONE
        </button>
      </div>

      {/* Certificates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Caricamento certificati...</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-8 text-center">
          <FiShield className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-slate-400 mb-1">
            Nessun Certificato Configurato
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Aggiungi il primo certificato RENTRI per iniziare a trasmettere dati
          </p>
          <button
            onClick={() => navigate("/rifiuti/certificati/upload")}
            className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Carica Primo Certificato
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {certificates
            .filter(cert => selectedEnvironment === 'all' || cert.environment === selectedEnvironment)
            .map(cert => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-[#1a2536] border border-[#243044] rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">
          Guida Rapida
        </h3>
        <div className="space-y-3 text-xs text-slate-500">
          <div>
            <p className="font-medium text-cyan-400 mb-1">Certificato di Interoperabilita</p>
            <p>Usato per autenticarsi alle API RENTRI (trasmissioni JWT, creazione FIR, registri, movimenti). File .p12 con password. Ogni azienda ne ha uno per ambiente.</p>
          </div>
          <div>
            <p className="font-medium text-purple-400 mb-1">Certificato di Firma Remota</p>
            <p>Usato per firmare digitalmente i FIR (xFIR). File .cer senza password. Scaricabile dall&apos;area operatori RENTRI.</p>
          </div>
          <div>
            <p className="font-medium text-slate-400 mb-1">DEMO vs PRODUZIONE</p>
            <p>I certificati demo sono per test (gratuiti), quelli produzione per operativita reale con valore legale.</p>
          </div>
          <div>
            <p className="font-medium text-slate-400 mb-1">Certificato Default</p>
            <p>Il certificato marcato con stella viene usato automaticamente per le trasmissioni.</p>
          </div>
          <div>
            <p className="font-medium text-slate-400 mb-1">Notifiche PUSH</p>
            <p className="mb-1">Indirizzo da configurare su RENTRI (solo dominio, senza https:// e senza path):</p>
            <p className="mb-0.5">DEMO: <code className="text-blue-400 bg-blue-500/10 px-1 rounded">rentri-test.rescuemanager.eu</code></p>
            <p className="mb-0.5">PROD: <code className="text-teal-400 bg-teal-500/10 px-1 rounded">rentri.rescuemanager.eu</code></p>
            <p className="text-[11px] text-slate-600 mt-1">RENTRI aggiungera automaticamente https:// e il path /api/rentri/notifiche/webhook</p>
          </div>
        </div>
      </div>
    </div>
  );
}
