import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiPlay, FiCheckCircle, FiXCircle, FiFileText,
  FiRefreshCw, FiSearch, FiTruck, FiAlertTriangle, FiDownload,
  FiEye, FiX, FiUser, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import RVFULogin from '@/components/rvfu/RVFULogin';

const STATI_COLORS = {
  'PRESO IN CARICO': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'VALIDATO': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'DEMOLITO': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'ANNULLATO': 'bg-red-500/20 text-red-300 border-red-500/30',
  'CONFERITO': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'INVIATO A STA': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'DA RADIARE': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'RADIATO': 'bg-green-500/20 text-green-300 border-green-500/30',
};

function LogEntry({ entry }) {
  const isOk = entry.ok;
  return (
    <div className={`px-3 py-2 rounded text-xs font-mono border ${
      isOk ? 'bg-emerald-950/30 border-emerald-800/30 text-emerald-300' : 'bg-red-950/30 border-red-800/30 text-red-300'
    }`}>
      <span className="text-slate-500">[{entry.time}]</span>{' '}
      <span className="font-semibold">{entry.method} {entry.endpoint}</span>{' '}
      → <span>{entry.code} {entry.message}</span>
      {entry.detail && <div className="mt-1 text-slate-400 break-all">{entry.detail}</div>}
    </div>
  );
}

export default function RVFUTestConsole() {
  const navigate = useNavigate();
  const { isAuthenticated, authService } = useRVFUAuth('formation');

  const [client, setClient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [vfuList, setVfuList] = useState([]);
  const [selectedVfu, setSelectedVfu] = useState(null);
  const [documenti, setDocumenti] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTarga, setSearchTarga] = useState('AG004559');
  const [searchCausale, setSearchCausale] = useState('D');
  const [searchTipo, setSearchTipo] = useState('T');
  const [searchResult, setSearchResult] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ search: true, vfu: true, actions: true, pdf: true });
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authService) {
      const c = createRVFUClient(authService, 'formation');
      setClient(c);
    }
  }, [isAuthenticated, authService]);

  const log = useCallback((method, endpoint, response, ok = true) => {
    const esito = response?.esito || {};
    const entry = {
      time: new Date().toLocaleTimeString('it-IT'),
      method,
      endpoint,
      code: esito.code || (ok ? 'OK' : 'ERR'),
      message: (esito.message || '').substring(0, 80),
      ok: ok && esito.responseStatus !== 'KO',
      detail: esito.responseStatus === 'KO' ? JSON.stringify(esito).substring(0, 200) : null,
    };
    setLogs(prev => [entry, ...prev].slice(0, 50));
    return entry;
  }, []);

  const apiCall = useCallback(async (fn, method, endpoint) => {
    try {
      const result = await fn();
      const esito = result?.esito;
      const ok = esito?.responseStatus === 'OK' || esito?.code === 'E000';
      log(method, endpoint, result, ok);
      return { result, ok };
    } catch (err) {
      log(method, endpoint, { esito: { code: 'ERR', message: err.message, responseStatus: 'KO' } }, false);
      return { result: null, ok: false };
    }
  }, [log]);

  // === AZIONI ===

  const loadUserDetail = useCallback(async () => {
    if (!client) return;
    const { result, ok } = await apiCall(
      () => client.getDettaglioUtente(), 'GET', '/utility/detail/utente'
    );
    if (ok && result?.result) setUserDetail(result.result);
  }, [client, apiCall]);

  const loadVFUList = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { result, ok } = await apiCall(
      () => client.consultaVFUConcessionario({ pageNumber: 0, pageSize: 50 }),
      'GET', '/cr/consulta/VFU'
    );
    if (ok) {
      const items = result?.result?.content || [];
      setVfuList(items);
    }
    setLoading(false);
  }, [client, apiCall]);

  const searchVeicolo = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const veicolo = await client.verificaVeicolo({
        causale: searchCausale,
        tipoVeicolo: searchTipo,
        targa: searchTarga,
      });
      setSearchResult(veicolo);
      log('GET', `/cr/veicolo?causale=${searchCausale}&tipoVeicolo=${searchTipo}&targa=${searchTarga}`,
        { esito: { code: 'E000', message: 'OK', responseStatus: 'OK' } }, true);
    } catch (err) {
      setSearchResult(null);
      log('GET', `/cr/veicolo?targa=${searchTarga}`,
        { esito: { code: 'ERR', message: err.message, responseStatus: 'KO' } }, false);
    }
    setLoading(false);
  }, [client, searchTarga, searchCausale, searchTipo, log]);

  const registraVFU = useCallback(async () => {
    if (!client || !searchResult) return;
    setLoading(true);
    const payload = {
      causale: searchCausale,
      dataRitiro: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
      fabbrica: searchResult.marca_modello || searchResult.modello || 'SCONOSCIUTO',
      flagConsegnaForzeOrdine: 'N',
      flagIntestatarioForzato: 'S',
      flagTipoRegime: '1',
      forzaRegistrazione: 'N',
      intestatario: {
        capResidenza: '00100',
        codiceComuneResidenza: '091',
        codiceFiscale: 'MROBNI82B11H501L',
        codiceProvinciaResidenza: '058',
        cognome: 'Bianchi',
        dataNascita: '1982-02-11T00:00:00Z',
        indirizzoResidenza: 'Via Flaminia 4',
        nome: 'Mario',
      },
      obbligoIscrizionePRA: searchResult.obbligoIscrizionePRA || 'N',
      targa: searchResult.targa,
      telaio: searchResult.telaio || searchResult.numeroTelaio,
      tipoVeicolo: searchResult.tipoVeicolo || searchTipo,
    };
    const { result, ok } = await apiCall(
      () => client.registraVFUConcessionario(payload), 'POST', '/cr/VFU'
    );
    if (ok && result?.result) {
      setSelectedVfu(result.result);
      await loadVFUList();
    }
    setLoading(false);
  }, [client, searchResult, searchCausale, searchTipo, apiCall, loadVFUList]);

  const tryDecodePDF = useCallback((data, title) => {
    // Estrai base64 dalla risposta — cerca in campi noti e ricorsivamente
    const extractBase64 = (obj) => {
      if (!obj) return null;
      if (typeof obj === 'string' && obj.length > 20) return obj;
      if (typeof obj !== 'object') return null;
      const knownFields = ['pdf', 'contenutoDocumento', 'content', 'file', 'documento',
        'body', 'base64', 'fileContent', 'pdfContent', 'bytes', 'report', 'data'];
      for (const key of knownFields) {
        const val = obj[key];
        if (typeof val === 'string' && val.length > 20) return val;
        if (val && typeof val === 'object') {
          const nested = extractBase64(val);
          if (nested) return nested;
        }
      }
      for (const [key, val] of Object.entries(obj)) {
        if (knownFields.includes(key)) continue;
        if (typeof val === 'string' && val.length > 100) return val;
      }
      return null;
    };

    const b64 = extractBase64(data);
    console.log('[PDF tryDecode]', { title, hasData: !!data, b64Type: typeof b64, b64Len: b64?.length, b64Start: b64?.substring(0, 40) });
    if (!b64) return false;

    try {
      const byteChars = atob(b64);
      const byteNumbers = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfData(url);
      setPdfTitle(title);
      return true;
    } catch (e) {
      console.error('[PDF tryDecode] atob/blob error:', e.message);
      return false;
    }
  }, []);

  const generaRicevuta = useCallback(async (idVFU) => {
    if (!client) return;
    const { result, ok } = await apiCall(() => client.generaRicevuta(idVFU), 'POST', `/cr/genera/ricevutaPresaInCarico/${idVFU}`);
    if (ok && result?.result) {
      tryDecodePDF(result.result, `Ricevuta Presa in Carico #${idVFU}`);
    }
  }, [client, apiCall, tryDecodePDF]);

  const generaCDR = useCallback(async (idVFU) => {
    if (!client) return;
    const { result, ok } = await apiCall(() => client.generaCDR(idVFU), 'POST', `/cr/genera/certificatoRottamazione/${idVFU}`);
    if (ok && result?.result) {
      tryDecodePDF(result.result, `Certificato Rottamazione #${idVFU}`);
    }
  }, [client, apiCall, tryDecodePDF]);

  const chiudiFascicolo = useCallback(async (idVFU) => {
    if (!client) return;
    await apiCall(() => client.chiudiFascicolo(idVFU), 'PUT', `/cr/chiudi/fascicolo/${idVFU}`);
  }, [client, apiCall]);

  const verificaVFU = useCallback(async (idVFU, causale) => {
    if (!client) return;
    const { ok } = await apiCall(
      () => client.verificaVFU(idVFU, causale || 'D'), 'PUT', `/cr/verifica/VFU/${idVFU}/${causale || 'D'}`
    );
    if (ok) await refreshVFU(idVFU);
  }, [client, apiCall]);

  const demolisciVFU = useCallback(async (idVFU) => {
    if (!client) return;
    const payload = {
      dataDistruzioneDocumenti: new Date().toISOString(),
      dataDistruzioneTarga: new Date().toISOString(),
      numeroTargheDistrutte: '1',
      dataBonifica: new Date().toISOString(),
    };
    const { ok } = await apiCall(
      () => client.demolisciVFU(idVFU, payload), 'PUT', `/cr/demolisci/VFU/${idVFU}`
    );
    if (ok) await refreshVFU(idVFU);
  }, [client, apiCall]);

  const annullaVFU = useCallback(async (idVFU) => {
    if (!client) return;
    const { ok } = await apiCall(
      () => client.annullaVFU(idVFU, { motivoEliminazione: 'Test annullamento' }),
      'PUT', `/cr/annulla/VFU/${idVFU}`
    );
    if (ok) await loadVFUList();
  }, [client, apiCall, loadVFUList]);

  const refreshVFU = useCallback(async (idVFU) => {
    if (!client) return;
    const { result, ok } = await apiCall(
      () => client.dettaglioVFU(idVFU), 'GET', `/cr/VFU/${idVFU}`
    );
    if (ok && result?.result) {
      setSelectedVfu(result.result);
      await loadVFUList();
    }
  }, [client, apiCall, loadVFUList]);

  const consultaDocumenti = useCallback(async (idVFU) => {
    if (!client) return;
    const { result } = await apiCall(
      () => client.consultaDocumenti(idVFU), 'GET', `/cr/consulta/documentoVFU/${idVFU}`
    );
    const docs = result?.result;
    console.log(`[Documenti VFU #${idVFU}]`, JSON.stringify(docs, null, 2));
    setDocumenti(docs);
  }, [client, apiCall]);

  const downloadDocumentoPDF = useCallback(async (doc) => {
    if (!client) return;
    const { idAciDocumento, idFascicolo, progressivoDocumento, tipoDocumento } = doc;
    const endpoint = `/cr/documentoVFU?idAci=${idAciDocumento}&idFascicolo=${idFascicolo}&progressivoDocumento=${progressivoDocumento}`;
    setLoading(true);
    try {
      const response = await client.downloadDocumento({ idAci: idAciDocumento, idFascicolo, progressivoDocumento });
      const esito = response?.esito;
      const ok = esito?.responseStatus === 'OK' || esito?.code === 'E000';
      log('GET', endpoint, response, ok);
      if (ok && response?.result?.file) {
        const title = `${tipoDocumento || 'Documento'} #${idFascicolo}`;
        if (tryDecodePDF(response.result, title)) {
          log('PDF', endpoint, { esito: { code: 'OK', message: `PDF ${tipoDocumento} decodificato`, responseStatus: 'OK' } }, true);
        }
      } else if (!ok) {
        log('PDF', endpoint, { esito: { code: 'ERR', message: 'Download fallito: ' + (esito?.message || 'file assente'), responseStatus: 'KO' } }, false);
      }
    } catch (err) {
      log('PDF', endpoint, { esito: { code: 'ERR', message: err.message, responseStatus: 'KO' } }, false);
    }
    setLoading(false);
  }, [client, log, tryDecodePDF]);

  // === PDF ===

  const viewPDF = useCallback(async (fetchFn, title, method, endpoint) => {
    if (!client) return;
    setLoading(true);
    try {
      const response = await fetchFn();
      const esito = response?.esito;
      const ok = esito?.responseStatus === 'OK' || esito?.code === 'E000';
      log(method, endpoint, response, ok);

      // Log struttura risposta per debug
      const resultData = response?.result;
      const resultType = typeof resultData;
      // Log dettagliato di ogni campo nell'oggetto result
      if (resultData && typeof resultData === 'object') {
        for (const [k, v] of Object.entries(resultData)) {
          console.log(`[PDF Debug] ${endpoint} result.${k}:`, { type: typeof v, length: typeof v === 'string' ? v.length : null, preview: typeof v === 'string' ? v.substring(0, 80) : v });
        }
      } else {
        console.log(`[PDF Debug] ${endpoint}: result is ${resultType}`, resultData ? String(resultData).substring(0, 100) : 'null');
      }

      // Prova a decodificare il PDF dalla risposta
      if (tryDecodePDF(resultData, title)) {
        log('PDF', endpoint, { esito: { code: 'OK', message: 'PDF decodificato con successo', responseStatus: 'OK' } }, true);
      } else {
        const keys = resultData && typeof resultData === 'object' ? Object.keys(resultData).join(',') : resultType;
        log('PDF', endpoint, {
          esito: {
            code: 'WARN',
            message: `Nessun PDF valido trovato. result=[${keys}]`,
            responseStatus: 'KO'
          }
        }, false);
      }
    } catch (err) {
      log('PDF', endpoint, { esito: { code: 'ERR', message: err.message, responseStatus: 'KO' } }, false);
    }
    setLoading(false);
  }, [client, log, tryDecodePDF]);

  const stampaPDFVFU = useCallback(() => {
    if (!client) return;
    viewPDF(() => client.stampaVFU({ pageNumber: 0, pageSize: 50 }),
      'Stampa Lista VFU (PDF)', 'GET', '/cr/stampa/VFU');
  }, [client, viewPDF]);

  const stampaPDFPresaInCarico = useCallback(() => {
    if (!client) return;
    viewPDF(() => client.stampaPresaInCarico({ pageNumber: 0, pageSize: 50 }),
      'Stampa Presa in Carico (PDF)', 'GET', '/cr/stampaPresaInCarico/VFU');
  }, [client, viewPDF]);

  const stampaPDFRottamazione = useCallback(() => {
    if (!client) return;
    viewPDF(() => client.stampaRottamazione({ pageNumber: 0, pageSize: 50 }),
      'Stampa Rottamazione (PDF)', 'GET', '/cr/stampaRottamazione/VFU');
  }, [client, viewPDF]);

  const stampaPDFRadiati = useCallback(() => {
    if (!client) return;
    viewPDF(() => client.stampaRadiati({ pageNumber: 0, pageSize: 50 }),
      'Stampa Radiati (PDF)', 'GET', '/cr/stampaRadiati/VFU');
  }, [client, viewPDF]);

  const downloadPDF = useCallback(() => {
    if (!pdfData) return;
    const a = document.createElement('a');
    a.href = pdfData;
    a.download = `${pdfTitle.replace(/\s/g, '_')}.pdf`;
    a.click();
  }, [pdfData, pdfTitle]);

  // Carica utente e lista VFU all'avvio
  useEffect(() => {
    if (client) {
      loadUserDetail();
      loadVFUList();
    }
  }, [client]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // === RENDER ===

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <div className="min-h-screen bg-[#141c27] p-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6">
            <FiArrowLeft /> Indietro
          </button>
          <div className="max-w-md mx-auto">
            <RVFULogin onSuccess={() => setShowLogin(false)} onCancel={() => navigate(-1)} />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center">
        <div className="text-center space-y-4">
          <FiAlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-200">Autenticazione RVFU richiesta</h2>
          <p className="text-slate-400">Effettua il login per accedere alla console test</p>
          <button onClick={() => setShowLogin(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Login RVFU
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141c27] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/demolizioni-rvfu')} className="text-slate-400 hover:text-slate-200">
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">RVFU Test Console</h1>
            {userDetail && (
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                <FiUser className="inline h-3 w-3 mr-1" />
                {userDetail.matricola} — CF: {userDetail.codiceFiscaleImpresa}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={loadVFUList} disabled={loading}
              className="px-3 py-1.5 text-xs bg-[#1a2536] border border-[#243044] rounded hover:bg-[#243044] flex items-center gap-1">
              <FiRefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Ricarica VFU
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* === COLONNA SINISTRA === */}
          <div className="space-y-4">
            {/* Ricerca Veicolo */}
            <div className="bg-[#1a2536] rounded-lg border border-[#243044]">
              <button onClick={() => toggleSection('search')}
                className="w-full flex items-center justify-between p-3 hover:bg-[#243044]/30">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <FiSearch className="h-4 w-4 text-blue-400" /> Ricerca Veicolo
                </h2>
                {expandedSections.search ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.search && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={searchTarga} onChange={e => setSearchTarga(e.target.value.toUpperCase())}
                      placeholder="Targa" className="flex-1 px-2 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded text-slate-200 font-mono" />
                    <select value={searchTipo} onChange={e => setSearchTipo(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded text-slate-200">
                      <option value="A">A (Auto)</option>
                      <option value="T">T (Rimorchio)</option>
                      <option value="M">M (Moto)</option>
                    </select>
                    <select value={searchCausale} onChange={e => setSearchCausale(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-[#141c27] border border-[#243044] rounded text-slate-200">
                      <option value="D">D (Demolizione)</option>
                      <option value="V">V (Veicolo)</option>
                      <option value="P">P (Provvedimento)</option>
                      <option value="R">R (Radiazione)</option>
                    </select>
                    <button onClick={searchVeicolo} disabled={loading || !searchTarga}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                      <FiSearch className="h-3 w-3" />
                    </button>
                  </div>
                  {searchResult && (
                    <div className="bg-[#141c27] rounded p-2 text-xs space-y-1 border border-emerald-500/20">
                      <div className="flex justify-between">
                        <span className="font-semibold text-emerald-400">{searchResult.targa}</span>
                        <span className="text-slate-400">Telaio: {searchResult.telaio || searchResult.numeroTelaio || '-'}</span>
                      </div>
                      <div className="text-slate-400">
                        Tipo: {searchResult.tipoVeicolo} | PRA: {searchResult.obbligoIscrizionePRA} | Radiabile: {searchResult.radiabile}
                      </div>
                      <button onClick={registraVFU} disabled={loading}
                        className="w-full mt-1 px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">
                        <FiPlay className="inline h-3 w-3 mr-1" /> Registra VFU
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista VFU */}
            <div className="bg-[#1a2536] rounded-lg border border-[#243044]">
              <button onClick={() => toggleSection('vfu')}
                className="w-full flex items-center justify-between p-3 hover:bg-[#243044]/30">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <FiTruck className="h-4 w-4 text-purple-400" /> VFU Registrati ({vfuList.length})
                </h2>
                {expandedSections.vfu ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.vfu && (
                <div className="px-3 pb-3 space-y-1 max-h-64 overflow-y-auto">
                  {vfuList.length === 0 && <p className="text-xs text-slate-500">Nessun VFU trovato</p>}
                  {vfuList.map(vfu => (
                    <button key={vfu.idVFU}
                      onClick={() => { setSelectedVfu(vfu); setDocumenti(null); refreshVFU(vfu.idVFU); }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                        selectedVfu?.idVFU === vfu.idVFU ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-[#243044]/50 border border-transparent'
                      }`}>
                      <div>
                        <span className="font-mono font-semibold">{vfu.targa}</span>
                        <span className="text-slate-500 ml-2">#{vfu.idVFU}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[10px] rounded border ${STATI_COLORS[vfu.statoVFU] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                        {vfu.statoVFU}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stampa PDF */}
            <div className="bg-[#1a2536] rounded-lg border border-[#243044]">
              <button onClick={() => toggleSection('pdf')}
                className="w-full flex items-center justify-between p-3 hover:bg-[#243044]/30">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <FiFileText className="h-4 w-4 text-amber-400" /> Stampa PDF
                </h2>
                {expandedSections.pdf ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
              </button>
              {expandedSections.pdf && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                  <button onClick={stampaPDFVFU} disabled={loading}
                    className="px-2 py-1.5 text-xs bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded hover:bg-amber-600/20 disabled:opacity-50">
                    <FiEye className="inline h-3 w-3 mr-1" /> Lista VFU
                  </button>
                  <button onClick={stampaPDFPresaInCarico} disabled={loading}
                    className="px-2 py-1.5 text-xs bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded hover:bg-amber-600/20 disabled:opacity-50">
                    <FiEye className="inline h-3 w-3 mr-1" /> Presa in Carico
                  </button>
                  <button onClick={stampaPDFRottamazione} disabled={loading}
                    className="px-2 py-1.5 text-xs bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded hover:bg-amber-600/20 disabled:opacity-50">
                    <FiEye className="inline h-3 w-3 mr-1" /> Rottamazione
                  </button>
                  <button onClick={stampaPDFRadiati} disabled={loading}
                    className="px-2 py-1.5 text-xs bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded hover:bg-amber-600/20 disabled:opacity-50">
                    <FiEye className="inline h-3 w-3 mr-1" /> Radiati
                  </button>
                </div>
              )}
            </div>

            {/* Log */}
            <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <FiFileText className="h-4 w-4 text-slate-400" /> Log API ({logs.length})
                </h2>
                <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-slate-300">Pulisci</button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {logs.length === 0 && <p className="text-xs text-slate-500">Nessuna chiamata ancora</p>}
                {logs.map((entry, i) => <LogEntry key={i} entry={entry} />)}
              </div>
            </div>
          </div>

          {/* === COLONNA DESTRA === */}
          <div className="space-y-4">
            {/* Dettaglio VFU selezionato */}
            {selectedVfu ? (
              <div className="bg-[#1a2536] rounded-lg border border-[#243044]">
                <div className="p-3 border-b border-[#243044]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <FiTruck className="h-4 w-4 text-blue-400" />
                      VFU #{selectedVfu.idVFU} — {selectedVfu.targa}
                    </h2>
                    <span className={`px-2 py-0.5 text-xs rounded border ${STATI_COLORS[selectedVfu.statoVFU] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                      {selectedVfu.statoVFU}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-3">
                  {/* Dati principali */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">Telaio:</span> <span className="font-mono">{selectedVfu.telaio || '-'}</span></div>
                    <div><span className="text-slate-500">Tipo:</span> {selectedVfu.tipoVeicolo || '-'}</div>
                    <div><span className="text-slate-500">Causale:</span> {selectedVfu.causale || '-'}</div>
                    <div><span className="text-slate-500">PRA:</span> {selectedVfu.obbligoIscrizionePRA || '-'}</div>
                    <div><span className="text-slate-500">Fascicolo:</span> {selectedVfu.idFascicolo || '-'}</div>
                    <div><span className="text-slate-500">Stato Fasc.:</span> {selectedVfu.statoFascicolo || '-'}</div>
                    <div className="col-span-2">
                      <span className="text-slate-500">dataPresaInCarico:</span>{' '}
                      <span className={selectedVfu.dataPresaInCarico ? 'text-emerald-400' : 'text-red-400 font-semibold'}>
                        {selectedVfu.dataPresaInCarico || 'NULL (blocco backend)'}
                      </span>
                    </div>
                    <div><span className="text-slate-500">Data Reg.:</span> {selectedVfu.dataRegistrazione ? new Date(selectedVfu.dataRegistrazione).toLocaleString('it-IT') : '-'}</div>
                    <div><span className="text-slate-500">Data Conf.:</span> {selectedVfu.dataConferimento ? new Date(selectedVfu.dataConferimento).toLocaleString('it-IT') : '-'}</div>
                    <div><span className="text-slate-500">Data Bonif.:</span> {selectedVfu.dataBonifica || '-'}</div>
                    <div><span className="text-slate-500">Data Demol.:</span> {selectedVfu.dataDemolizione || '-'}</div>
                  </div>

                  {selectedVfu.intestatario && (
                    <div className="text-xs bg-[#141c27] rounded p-2 border border-[#243044]">
                      <span className="text-slate-500">Intestatario:</span>{' '}
                      {selectedVfu.intestatario.nome} {selectedVfu.intestatario.cognome}{' '}
                      <span className="font-mono text-slate-400">({selectedVfu.intestatario.codiceFiscale})</span>
                    </div>
                  )}

                  {/* Documenti */}
                  {documenti && (
                    <div className="border-t border-[#243044] pt-3">
                      <h3 className="text-xs font-semibold text-slate-400 mb-2">DOCUMENTI FASCICOLO</h3>
                      {Array.isArray(documenti) && documenti.length > 0 ? (
                        <div className="space-y-1">
                          {documenti.map((doc, i) => (
                            <div key={i} className="text-xs bg-[#141c27] rounded p-2 border border-[#243044] flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-slate-300">{doc.tipoDocumento || doc.tipo || `Doc #${i+1}`}</span>
                                {doc.dataInserimento && <span className="text-slate-500 ml-2">{new Date(doc.dataInserimento).toLocaleString('it-IT')}</span>}
                                <span className="ml-2 text-slate-400">({doc.statoDocumento || doc.stato || '-'})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.idAciDocumento && <span className="text-slate-600 font-mono">idAci:{doc.idAciDocumento}</span>}
                                {doc.statoDocumentoEnum === 'FIRMATO' && (
                                  <button onClick={() => downloadDocumentoPDF(doc)} disabled={loading}
                                    className="px-1.5 py-0.5 text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-600/20 disabled:opacity-50 flex items-center gap-1">
                                    <FiDownload className="h-2.5 w-2.5" /> PDF
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : typeof documenti === 'object' && !Array.isArray(documenti) ? (
                        <pre className="text-[10px] text-slate-400 bg-[#141c27] rounded p-2 border border-[#243044] overflow-x-auto max-h-32">
                          {JSON.stringify(documenti, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-slate-500">Nessun documento trovato</p>
                      )}
                    </div>
                  )}

                  {/* Azioni workflow */}
                  <div className="border-t border-[#243044] pt-3">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2">AZIONI WORKFLOW</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => generaRicevuta(selectedVfu.idVFU)} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-600/20 disabled:opacity-50">
                        Genera Ricevuta
                      </button>
                      <button onClick={() => generaCDR(selectedVfu.idVFU)} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-600/20 disabled:opacity-50">
                        Genera CDR
                      </button>
                      <button onClick={() => consultaDocumenti(selectedVfu.idVFU)} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-slate-600/10 text-slate-400 border border-slate-500/20 rounded hover:bg-slate-600/20 disabled:opacity-50">
                        Consulta Documenti
                      </button>
                      <button onClick={() => chiudiFascicolo(selectedVfu.idVFU)} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded hover:bg-amber-600/20 disabled:opacity-50">
                        Chiudi Fascicolo
                      </button>
                      <button onClick={() => verificaVFU(selectedVfu.idVFU, selectedVfu.causale || 'D')} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-600/20 disabled:opacity-50">
                        <FiCheckCircle className="inline h-3 w-3 mr-1" /> Verifica VFU
                      </button>
                      <button onClick={() => demolisciVFU(selectedVfu.idVFU)} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-600/20 disabled:opacity-50">
                        <FiPlay className="inline h-3 w-3 mr-1" /> Demolisci
                      </button>
                      <button onClick={() => refreshVFU(selectedVfu.idVFU)} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-slate-600/10 text-slate-300 border border-slate-500/20 rounded hover:bg-slate-600/20 disabled:opacity-50">
                        <FiRefreshCw className="inline h-3 w-3 mr-1" /> Aggiorna
                      </button>
                      <button onClick={() => annullaVFU(selectedVfu.idVFU)} disabled={loading}
                        className="px-2 py-1.5 text-xs bg-red-600/10 text-red-400 border border-red-500/20 rounded hover:bg-red-600/20 disabled:opacity-50">
                        <FiXCircle className="inline h-3 w-3 mr-1" /> Annulla
                      </button>
                    </div>
                  </div>

                  {/* Dati JSON completi */}
                  <details className="text-xs">
                    <summary className="text-slate-500 cursor-pointer hover:text-slate-300">JSON completo</summary>
                    <pre className="mt-1 p-2 bg-[#141c27] rounded border border-[#243044] overflow-x-auto max-h-48 text-[10px] text-slate-400">
                      {JSON.stringify(selectedVfu, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="bg-[#1a2536] rounded-lg border border-[#243044] p-8 text-center">
                <FiTruck className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Seleziona un VFU dalla lista o cerca un veicolo</p>
              </div>
            )}

            {/* Visualizzatore PDF */}
            {pdfData && (
              <div className="bg-[#1a2536] rounded-lg border border-[#243044]">
                <div className="p-3 border-b border-[#243044] flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <FiFileText className="h-4 w-4 text-amber-400" /> {pdfTitle}
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={downloadPDF}
                      className="px-2 py-1 text-xs bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-600/20">
                      <FiDownload className="inline h-3 w-3 mr-1" /> Scarica
                    </button>
                    <button onClick={() => { setPdfData(null); setPdfTitle(''); }}
                      className="px-2 py-1 text-xs bg-red-600/10 text-red-400 border border-red-500/20 rounded hover:bg-red-600/20">
                      <FiX className="inline h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="p-1">
                  <iframe src={pdfData} className="w-full h-[500px] rounded bg-white" title={pdfTitle} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
