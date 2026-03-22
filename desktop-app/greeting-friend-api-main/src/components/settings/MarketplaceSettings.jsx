// src/components/settings/MarketplaceSettings.jsx
// Sezione Impostazioni Marketplace — Collega eBay, Subito.it, Shopify
import { useState, useEffect, useRef } from 'react';
import {
  FiGlobe, FiCheck, FiLoader, FiExternalLink, FiTrash2,
  FiAlertCircle, FiInfo, FiEye, FiEyeOff, FiRefreshCw
} from 'react-icons/fi';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase-browser';
import {
  PLATFORMS, getConnections, getConnection, saveConnection, disconnectPlatform
} from '@/lib/marketplace';

// ─── Costanti OAuth ───
// Queste verranno sostituite con le vere credenziali quando registrate
const OAUTH_CONFIG = {
  ebay: {
    clientId: import.meta.env.VITE_EBAY_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_EBAY_REDIRECT_URI || `${globalThis.location.origin}/settings?tab=marketplace&oauth=ebay`,
    scopes: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing',
    sandbox: import.meta.env.VITE_EBAY_SANDBOX === 'true',
  },
  shopify: {
    clientId: import.meta.env.VITE_SHOPIFY_CLIENT_ID || '',
    // Per app pubblica: redirect_uri deve essere un endpoint backend che fa exchange code->token.
    redirectUri: import.meta.env.VITE_SHOPIFY_REDIRECT_URI || `https://rescuemanager.eu/api/auth/oauth/shopify/callback`,
    scopes: 'read_products,write_products,read_inventory,write_inventory',
  },
};

export default function MarketplaceSettings() {
  const { orgId } = useOrg();
  const { showSuccess, showError } = useToast();

  const SHOPIFY_OLD_CLIENT_ID = '5e8204a9b95fd76feec6d53207c59f21';

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [manualForm, setManualForm] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [disconnecting, setDisconnecting] = useState(null);
  const oauthPopupRef = useRef(null);

  useEffect(() => {
    if (orgId) loadConnections();
  }, [orgId]);

  // Gestisci callback OAuth dalla URL
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const oauthPlatform = params.get('oauth');
    const code = params.get('code');
    if (oauthPlatform && code) {
      if (globalThis.opener) {
        try {
          globalThis.opener.postMessage({ type: 'rm-oauth-code', platform: oauthPlatform, code }, globalThis.location.origin);
        } catch (e) {
          logger.error('postMessage to opener failed:', e);
        }
        try {
          globalThis.close();
        } catch {
          // ignore
        }
        return;
      }

      handleOAuthCallback(oauthPlatform, code);
      globalThis.history.replaceState({}, '', `${globalThis.location.pathname}?tab=marketplace`);
    }
  }, []);

  // Per Shopify app pubblica: il backend ritorna alla UI con ?oauth=shopify&connected=1
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const oauthPlatform = params.get('oauth');
    const connected = params.get('connected');
    if (oauthPlatform === 'shopify' && connected === '1') {
      loadConnections();
      globalThis.history.replaceState({}, '', `${globalThis.location.pathname}?tab=marketplace`);
    }
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== globalThis.location.origin) return;
      const payload = event.data;
      if (!payload || payload.type !== 'rm-oauth-code') return;

      if (payload.platform && payload.code) {
        handleOAuthCallback(payload.platform, payload.code);
      }

      try {
        if (oauthPopupRef.current && !oauthPopupRef.current.closed) oauthPopupRef.current.close();
      } catch {
        // ignore
      }
      oauthPopupRef.current = null;
    };

    globalThis.addEventListener('message', onMessage);
    return () => globalThis.removeEventListener('message', onMessage);
  }, []);

  const openOAuthPopup = (url) => {
    const width = 520;
    const height = 720;
    const left = Math.max(0, Math.round((globalThis.screen.width - width) / 2));
    const top = Math.max(0, Math.round((globalThis.screen.height - height) / 2));
    const features = `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
    const w = globalThis.open(url, 'rm_oauth_popup', features);
    if (!w) {
      showError('Popup bloccato. Consenti i popup e riprova.');
      return null;
    }
    try {
      w.focus();
    } catch {
      // ignore
    }
    return w;
  };

  const normalizeShopDomain = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return '';
    // accetta input tipo:
    // - https://mystore.myshopify.com
    // - mystore.myshopify.com
    // - mystore.myshopify.com/admin
    // - https://admin.shopify.com/store/mystore
    // - https://admin.shopify.com/store/mystore/oauth/install_custom_app?... (custom distribution)
    const withoutProtocol = s.replace(/^https?:\/\//, '');
    const parts = withoutProtocol.split('/');
    const host = parts[0];

    if (host === 'admin.shopify.com') {
      const idx = parts.indexOf('store');
      const handle = idx >= 0 ? parts[idx + 1] : null;
      if (handle) return `${handle}.myshopify.com`;
    }

    return host;
  };

  const validateShopifyDomainForOAuth = (host) => {
    // Per Shopify OAuth è altamente consigliato usare il dominio tecnico *.myshopify.com
    // (i domini custom possono non risolvere l'endpoint /admin/oauth/authorize).
    return host.endsWith('.myshopify.com');
  };

  const loadConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await getConnections(orgId);
      if (error) throw error;
      setConnections(data || []);
    } catch (e) {
      logger.error('Error loading marketplace connections:', e);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionForPlatform = (platformId) => {
    return connections.find(c => c.platform === platformId);
  };

  // ─── OAuth Flow ───
  const startOAuthFlow = (platformId) => {
    const config = OAUTH_CONFIG[platformId];
    
    // eBay: usa server VPS per OAuth
    if (platformId === 'ebay') {
      const vpsOAuthUrl = `https://api.rescuemanager.eu/api/ebay/auth/start?org_id=${orgId}`;
      
      // Apri browser esterno (Electron shell.openExternal)
      if (window.electron?.shell?.openExternal) {
        window.electron.shell.openExternal(vpsOAuthUrl);
        showSuccess('Browser aperto. Completa il login eBay e torna qui.');
        
        // Polling per verificare se la connessione è stata salvata
        const pollInterval = setInterval(async () => {
          const { data } = await getConnection(orgId, 'ebay');
          if (data?.credentials?.access_token) {
            clearInterval(pollInterval);
            showSuccess('eBay collegato con successo!');
            await loadConnections();
          }
        }, 3000);
        
        // Stop polling dopo 5 minuti
        setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
      } else {
        // Fallback: apri in nuova finestra browser
        window.open(vpsOAuthUrl, '_blank');
        showSuccess('Completa il login eBay nella nuova finestra e torna qui.');
      }
      return;
    }
    
    if (!config?.clientId) {
      // Fallback: mostra form manuale
      setConnectingPlatform(platformId);
      setManualForm({});
      return;
    }

    if (platformId === 'shopify' && config.clientId === SHOPIFY_OLD_CLIENT_ID) {
      showError(`Shopify client_id non aggiornato (ancora ${config.clientId}). Aggiorna VITE_SHOPIFY_CLIENT_ID e riavvia l'app.`);
      return;
    }

    if (platformId === 'shopify') {
      const shopDomain = normalizeShopDomain(manualForm.shop_domain);
      if (!shopDomain) {
        setConnectingPlatform('shopify');
        setManualForm({});
        return;
      }
      if (!validateShopifyDomainForOAuth(shopDomain)) {
        showError('Inserisci il dominio tecnico Shopify in formato nome-store.myshopify.com');
        return;
      }
      (async () => {
        try {
          const { data } = await supabase.auth.getSession();
          const accessToken = data?.session?.access_token;
          if (!accessToken) {
            showError('Sessione non valida. Effettua login e riprova.');
            return;
          }

          const returnTo = `${globalThis.location.origin}/settings?tab=marketplace`;
          const stateRes = await fetch('https://rescuemanager.eu/api/auth/oauth/shopify/state', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ org_id: orgId, return_to: returnTo }),
          });

          if (!stateRes.ok) {
            const txt = await stateRes.text();
            throw new Error(`State mint failed: ${stateRes.status} ${txt}`);
          }

          const { state } = await stateRes.json();
          if (!state) throw new Error('State missing');

          const url = `https://${shopDomain}/admin/oauth/authorize?client_id=${encodeURIComponent(config.clientId)}&scope=${encodeURIComponent(config.scopes)}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${encodeURIComponent(state)}`;
          const w = openOAuthPopup(url);
          if (w) oauthPopupRef.current = w;
        } catch (e) {
          logger.error('Shopify OAuth start error:', e);
          showError('Errore durante avvio collegamento Shopify');
        }
      })();
    }
  };

  const handleOAuthCallback = async (platformId, code) => {
    try {
      // In produzione, scambiare il code per un access_token via backend
      // Per ora salviamo il code come placeholder
      await saveConnection(orgId, platformId, { oauth_code: code, connected_at: new Date().toISOString() });
      showSuccess(`${PLATFORMS[platformId]?.name || platformId} collegato con successo!`);
      await loadConnections();
    } catch (e) {
      logger.error('OAuth callback error:', e);
      showError('Errore durante il collegamento');
    }
  };

  // ─── Manual Connection ───
  const handleManualConnect = async (platformId) => {
    const platform = PLATFORMS[platformId];
    if (!platform) return;

    // Valida campi obbligatori
    const requiredFields = platform.fields.filter(f => f.required);
    const missing = requiredFields.filter(f => !manualForm[f.key]?.trim());
    if (missing.length > 0) {
      showError(`Compila i campi obbligatori: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    try {
      const { error } = await saveConnection(orgId, platformId, manualForm);
      if (error) throw error;
      showSuccess(`${platform.name} collegato con successo!`);
      setConnectingPlatform(null);
      setManualForm({});
      await loadConnections();
    } catch (e) {
      logger.error('Manual connect error:', e);
      showError('Errore durante il collegamento');
    }
  };

  // ─── Disconnect ───
  const handleDisconnect = async (platformId) => {
    const platform = PLATFORMS[platformId];
    if (!platform) return;
    if (!confirm(`Disconnettere ${platform.name}? I listing esistenti non verranno rimossi.`)) return;

    setDisconnecting(platformId);
    try {
      const { error } = await disconnectPlatform(orgId, platformId);
      if (error) throw error;
      showSuccess(`${platform.name} disconnesso`);
      await loadConnections();
    } catch (e) {
      logger.error('Disconnect error:', e);
      showError('Errore durante la disconnessione');
    } finally {
      setDisconnecting(null);
    }
  };

  const toggleSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Style helpers ───
  const cardCls = "bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden";
  const inputCls = "w-full h-10 px-3 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition";
  const labelCls = "text-xs text-slate-400 font-medium mb-1.5 block";
  const btnPrimary = "w-full h-10 text-sm font-medium text-white rounded-lg transition inline-flex items-center justify-center gap-2";
  const btnSecondary = "h-9 px-4 text-sm font-medium rounded-lg transition inline-flex items-center justify-center gap-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiLoader className="w-5 h-5 animate-spin text-blue-400 mr-2" />
        <span className="text-xs text-slate-400">Caricamento marketplace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
        <div className="flex items-start gap-3">
          <FiInfo className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-300 font-medium">Come funziona</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Collega i tuoi account marketplace per pubblicare i ricambi direttamente da RescueManager.
              Per eBay e Shopify puoi usare il login con un click. Per Subito.it usiamo l&apos;export CSV automatico.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Object.values(PLATFORMS).map(platform => {
          const conn = getConnectionForPlatform(platform.id);
          const isConnected = conn?.status === 'connected';
          const isExpired = conn?.status === 'expired';
          const isConnecting = connectingPlatform === platform.id;

          return (
            <div key={platform.id} className={`${cardCls} flex flex-col ${isConnected ? 'border-emerald-500/20' : ''}`}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#243044]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${platform.bgColor} ${platform.color}`}>
                      {platform.name}
                    </span>
                  </div>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 rounded-full">
                      <FiCheck className="w-3 h-3" /> Connesso
                    </span>
                  )}
                  {isExpired && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 rounded-full">
                      <FiAlertCircle className="w-3 h-3" /> Scaduto
                    </span>
                  )}
                  {!conn && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-slate-500/10 text-slate-500 rounded-full">
                      Non collegato
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">{platform.description}</p>
              </div>

              {/* Body */}
              <div className="px-5 py-4 flex-1 flex flex-col">
                {/* ── Stato connesso ── */}
                {isConnected && !isConnecting && (
                  <div className="space-y-4">
                    {conn.credentials?.shop_domain && (
                      <div className="flex items-center gap-2 bg-[#141c27] rounded-lg px-3 py-2">
                        <FiGlobe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-slate-200 font-medium truncate">{conn.credentials.shop_domain}</span>
                      </div>
                    )}
                    {conn.last_auth_at && (
                      <p className="text-xs text-slate-500">
                        Collegato il {new Date(conn.last_auth_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConnectingPlatform(platform.id); setManualForm(conn.credentials || {}); }}
                        className={`flex-1 ${btnSecondary} text-slate-300 bg-[#141c27] border border-[#243044] hover:bg-[#1e2b3d]`}
                      >
                        <FiRefreshCw className="w-4 h-4" /> Aggiorna
                      </button>
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={disconnecting === platform.id}
                        className={`${btnSecondary} text-red-400 bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 disabled:opacity-50`}
                      >
                        {disconnecting === platform.id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiTrash2 className="w-4 h-4" />}
                        Disconnetti
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Form connessione Shopify (solo dominio + OAuth) ── */}
                {isConnecting && platform.id === 'shopify' && OAUTH_CONFIG.shopify.clientId && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Dominio negozio Shopify</label>
                      <input
                        type="text"
                        value={manualForm.shop_domain || ''}
                        onChange={e => setManualForm(prev => ({ ...prev, shop_domain: e.target.value }))}
                        className={inputCls}
                        placeholder="mionegozio.myshopify.com"
                        autoFocus
                      />
                      <p className="text-xs text-slate-500 mt-1.5">Inserisci il dominio .myshopify.com del tuo negozio</p>
                    </div>
                    <button
                      onClick={() => startOAuthFlow('shopify')}
                      className={`${btnPrimary} bg-green-600 hover:bg-green-700`}
                    >
                      <FiExternalLink className="w-4 h-4" />
                      Collega con Shopify
                    </button>
                    <button
                      onClick={() => { setConnectingPlatform(null); setManualForm({}); }}
                      className={`${btnPrimary} text-slate-400 bg-[#141c27] border border-[#243044] hover:bg-[#1e2b3d]`}
                    >
                      Annulla
                    </button>
                  </div>
                )}

                {/* ── Form connessione generico (eBay, Subito, Shopify senza OAuth) ── */}
                {isConnecting && !(platform.id === 'shopify' && OAUTH_CONFIG.shopify.clientId) && (
                  <div className="space-y-3">
                    {platform.fields.map(field => (
                      <div key={field.key}>
                        <label className={labelCls}>
                          {field.label} {field.required && <span className="text-red-400">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={manualForm[field.key] || ''}
                            onChange={e => setManualForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className={inputCls}
                          >
                            <option value="">Seleziona...</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : field.type === 'checkbox' ? (
                          <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <input
                              type="checkbox"
                              checked={manualForm[field.key] || false}
                              onChange={e => setManualForm(prev => ({ ...prev, [field.key]: e.target.checked }))}
                              className="w-4 h-4 rounded border-[#243044] bg-[#141c27] text-blue-500"
                            />
                            <span className="text-sm text-slate-400">{field.label}</span>
                          </label>
                        ) : (
                          <div className="relative">
                            <input
                              type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                              value={manualForm[field.key] || ''}
                              onChange={e => setManualForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className={inputCls}
                              placeholder={field.placeholder || ''}
                            />
                            {field.type === 'password' && (
                              <button
                                type="button"
                                onClick={() => toggleSecret(field.key)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                              >
                                {showSecrets[field.key] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        )}
                        {field.hint && <p className="text-xs text-slate-500 mt-1">{field.hint}</p>}
                      </div>
                    ))}

                    <div className="flex gap-2 pt-2">
                      {OAUTH_CONFIG[platform.id]?.clientId && platform.id !== 'subito' && (
                        <button
                          onClick={() => startOAuthFlow(platform.id)}
                          className={`flex-1 ${btnSecondary} text-white bg-blue-600 hover:bg-blue-700`}
                        >
                          <FiExternalLink className="w-4 h-4" />
                          Collega con {platform.name}
                        </button>
                      )}
                      <button
                        onClick={() => handleManualConnect(platform.id)}
                        className={`${OAUTH_CONFIG[platform.id]?.clientId && platform.id !== 'subito' ? '' : 'flex-1'} ${btnSecondary} text-white bg-emerald-600 hover:bg-emerald-700`}
                      >
                        <FiCheck className="w-4 h-4" />
                        Salva
                      </button>
                      <button
                        onClick={() => { setConnectingPlatform(null); setManualForm({}); }}
                        className={`${btnSecondary} text-slate-400 bg-[#141c27] border border-[#243044] hover:bg-[#1e2b3d]`}
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Stato non connesso — bottone collega ── */}
                {!isConnected && !isConnecting && (
                  <div className="space-y-3 mt-auto">
                    {platform.id === 'ebay' && (
                      <p className="text-xs text-slate-500">
                        Vendi i tuoi ricambi su eBay Italia e raggiungi milioni di acquirenti.
                        Pubblica con un click, gestisci prezzi e disponibilit&agrave; direttamente da RescueManager.
                      </p>
                    )}
                    {platform.id === 'shopify' && (
                      <p className="text-xs text-slate-500">
                        Collega il tuo e-commerce Shopify per sincronizzare automaticamente
                        catalogo, prezzi e giacenze dei ricambi con il tuo negozio online.
                      </p>
                    )}
                    {platform.id === 'subito' && (
                      <p className="text-xs text-slate-500">
                        Subito.it non ha API pubblica. Configuriamo l&apos;export automatico CSV/XML per caricare i tuoi annunci.
                      </p>
                    )}
                    <button
                      onClick={() => {
                        if (platform.id === 'ebay') {
                          startOAuthFlow(platform.id);
                        } else if (OAUTH_CONFIG[platform.id]?.clientId) {
                          startOAuthFlow(platform.id);
                        } else {
                          setConnectingPlatform(platform.id);
                          setManualForm({});
                        }
                      }}
                      className={`${btnPrimary} ${
                        platform.id === 'ebay' ? 'bg-blue-600 hover:bg-blue-700' :
                        platform.id === 'subito' ? 'bg-orange-600 hover:bg-orange-700' :
                        'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      <FiGlobe className="w-4 h-4" />
                      Collega {platform.name}
                    </button>
                    {platform.id === 'ebay' && (
                      <button
                        onClick={async () => {
                          const { data } = await getConnection(orgId, 'ebay');
                          if (data?.credentials?.access_token) {
                            showSuccess('eBay collegato!');
                            await loadConnections();
                          } else {
                            showError('Nessuna connessione trovata. Completa il login eBay.');
                          }
                        }}
                        className={`${btnPrimary} text-slate-300 bg-[#141c27] border border-[#243044] hover:bg-[#1e2b3d]`}
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Verifica Connessione
                      </button>
                    )}
                    {(isExpired) && (
                      <p className="text-xs text-amber-400">
                        <FiAlertCircle className="w-3.5 h-3.5 inline mr-1" />
                        La connessione è scaduta. Ricollegati per continuare a pubblicare.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guida rapida */}
      <div className={cardCls}>
        <div className="px-5 py-3 border-b border-[#243044]">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Guida Rapida</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-blue-400">eBay</h4>
              <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
                <li>Clicca &quot;Collega eBay&quot;</li>
                <li>Accedi con il tuo account eBay</li>
                <li>Autorizza RescueManager</li>
                <li>Pubblica i ricambi dal form ricambio</li>
              </ol>
              <a href="https://developer.ebay.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-1">
                eBay Developer <FiExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-orange-400">Subito.it</h4>
              <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
                <li>Inserisci la tua email Subito</li>
                <li>Scegli il formato export (CSV/XML)</li>
                <li>Esporta i ricambi dalla lista</li>
                <li>Carica il file su Subito.it</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-green-400">Shopify</h4>
              <ol className="text-[10px] text-slate-500 space-y-1 list-decimal list-inside">
                <li>Inserisci il dominio del tuo negozio</li>
                <li>Clicca &quot;Collega con Shopify&quot;</li>
                <li>Autorizza l&apos;app nel tuo admin Shopify</li>
                <li>I ricambi si sincronizzano automaticamente</li>
              </ol>
              <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-400 hover:underline inline-flex items-center gap-1">
                Shopify Partners <FiExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
