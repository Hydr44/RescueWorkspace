// src/pages/RifiutiCertificatiUpload.jsx
/**
 * Upload Certificato RENTRI
 * Supporta 2 tipi:
 * - Interoperabilità (.p12/.pfx) → password + chiave privata richieste
 * - Firma Remota (.cer/.crt/.pem) → solo certificato pubblico, no password
 */

import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { FiUpload, FiX, FiShield, FiCheck, FiAlertCircle, FiFile, FiKey, FiEdit3 } from "react-icons/fi";

export default function RifiutiCertificatiUpload() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnPath = searchParams.get('return') || '/rifiuti/certificati';
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    password: "",
    environment: "demo",
    cf_operatore: "",
    ragione_sociale: "",
    tipo_certificato: "interoperabilita"
  });
  const [errors, setErrors] = useState({});

  const isFirma = form.tipo_certificato === 'firma_remota';
  const acceptedExtensions = isFirma ? ['.cer', '.crt', '.pem'] : ['.p12', '.pfx'];
  const acceptAttr = acceptedExtensions.join(',');

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;

    const name = selectedFile.name.toLowerCase();
    const valid = acceptedExtensions.some(ext => name.endsWith(ext));

    if (!valid) {
      alert(`Formato file non valido.\n\nFormati accettati: ${acceptedExtensions.join(', ')}`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setErrors(prev => ({ ...prev, file: null }));

    // Suggerisci CF dal nome file
    const match = selectedFile.name.match(/([A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z])/);
    if (match && !form.cf_operatore) {
      setForm(prev => ({ ...prev, cf_operatore: match[1] }));
    }
  }

  function handleFileChange(e) {
    handleFileSelect(e.target.files?.[0]);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer?.files?.[0]);
  }

  // Reset file when switching tipo_certificato
  function handleTipoChange(newTipo) {
    setForm(prev => ({ ...prev, tipo_certificato: newTipo, password: "" }));
    setFile(null);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    const newErrors = {};

    if (!file) newErrors.file = isFirma
      ? "Seleziona un file .cer, .crt o .pem"
      : "Seleziona un file .p12 o .pfx";

    if (!isFirma && !form.password) newErrors.password = "Password richiesta";

    if (!form.cf_operatore || !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(form.cf_operatore)) {
      newErrors.cf_operatore = "Codice Fiscale non valido (16 caratteri)";
    }
    if (!form.ragione_sociale) newErrors.ragione_sociale = "Ragione sociale richiesta";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /** Read .cer/.crt/.pem file as text (PEM format) */
  function readFileAsText(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Errore lettura file"));
      reader.readAsText(f);
    });
  }

  async function handleUpload() {
    if (!validate()) {
      alert("Compila tutti i campi obbligatori");
      return;
    }
    if (!orgId) {
      alert("Errore: Nessuna organizzazione selezionata");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      let certPem = "";
      let keyPem = "";
      let issuedAt = new Date().toISOString();
      let expiresAt = null;

      if (isFirma) {
        // ─── FIRMA REMOTA: .cer/.crt/.pem → leggi direttamente ───
        setUploadProgress(30);
        const rawContent = await readFileAsText(file);

        // Se è PEM, usalo direttamente; se è DER binario fallback a base64
        if (rawContent.includes('-----BEGIN CERTIFICATE-----')) {
          certPem = rawContent.trim();
        } else {
          // Potrebbe essere DER → converti a base64 PEM
          const reader = new FileReader();
          const b64 = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const arr = new Uint8Array(reader.result);
              let binary = '';
              arr.forEach(b => binary += String.fromCharCode(b));
              resolve(btoa(binary));
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
          });
          certPem = `-----BEGIN CERTIFICATE-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;
        }

        // Scadenza default 2 anni se non riusciamo a estrarla
        const twoYears = new Date();
        twoYears.setFullYear(twoYears.getFullYear() + 2);
        expiresAt = twoYears.toISOString();

        setUploadProgress(60);
      } else {
        // ─── INTEROPERABILITÀ: .p12/.pfx → estrai via VPS (OpenSSL) ───
        setUploadProgress(30);
        const vpsFormData = new FormData();
        vpsFormData.append("p12_file", file);
        vpsFormData.append("password", form.password);

        const vpsResponse = await fetch("http://217.154.118.37/rentri-cert-upload/upload-cert", {
          method: "POST",
          body: vpsFormData
        });

        setUploadProgress(50);
        const vpsResult = await vpsResponse.json();

        if (!vpsResponse.ok) {
          throw new Error(vpsResult.error || vpsResult.details || "Errore estrazione certificato");
        }

        certPem = vpsResult.certificate_pem;
        keyPem = vpsResult.private_key_pem;
        issuedAt = vpsResult.issued_at || issuedAt;
        expiresAt = vpsResult.expires_at;
        setUploadProgress(60);
      }

      // ─── Salvataggio in Supabase ───
      setUploadProgress(70);
      const { supabaseBrowser } = await import("../lib/supabase-browser");
      const supabase = supabaseBrowser();

      // Disattiva eventuali altri certificati default per questa org/env/tipo
      await supabase
        .from("rentri_org_certificates")
        .update({ is_default: false })
        .eq("org_id", orgId)
        .eq("environment", form.environment)
        .eq("tipo_certificato", form.tipo_certificato);

      const insertData = {
        org_id: orgId,
        cf_operatore: form.cf_operatore,
        ragione_sociale: form.ragione_sociale,
        tipo_certificato: form.tipo_certificato,
        certificate_pem: certPem,
        private_key_pem: isFirma ? (keyPem || '') : keyPem,
        certificate_password: isFirma ? null : form.password,
        environment: form.environment,
        issued_at: issuedAt,
        expires_at: expiresAt,
        is_active: true,
        is_default: true
      };

      const { error } = await supabase
        .from("rentri_org_certificates")
        .upsert(insertData, {
          onConflict: 'cf_operatore,environment,tipo_certificato',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        throw new Error("Errore salvataggio certificato: " + error.message);
      }

      setUploadProgress(100);

      const tipoLabel = isFirma ? 'Firma Remota' : 'Interoperabilita';
      alert(`Certificato ${tipoLabel} caricato con successo!\n\nOperatore: ${form.cf_operatore}\nScadenza: ${expiresAt?.split('T')[0] || 'N/A'}\nAmbiente: ${form.environment.toUpperCase()}`);

      navigate(returnPath);

    } catch (error) {
      console.error("[CERT-UPLOAD] Errore:", error);
      const hint = isFirma
        ? "Verifica che il file .cer sia valido."
        : "Verifica che il file .p12 sia valido e la password corretta.";
      alert(`Errore upload certificato:\n\n${error.message}\n\n${hint}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <FiShield className="w-4 h-4 text-purple-400" />
            Carica Certificato RENTRI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Carica un certificato di interoperabilita (.p12) o firma remota (.cer)
          </p>
        </div>
      </div>

      {/* Tipo Certificato - primo campo, determina il resto del form */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleTipoChange('interoperabilita')}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            !isFirma
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-[#243044] bg-[#1a2536] hover:border-[#344054]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FiKey className={`w-4 h-4 ${!isFirma ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className={`text-sm font-medium ${!isFirma ? 'text-cyan-300' : 'text-slate-400'}`}>
              Interoperabilita
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            File .p12 / .pfx con password. Per API RENTRI, trasmissioni JWT, creazione FIR.
          </p>
        </button>
        <button
          type="button"
          onClick={() => handleTipoChange('firma_remota')}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            isFirma
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-[#243044] bg-[#1a2536] hover:border-[#344054]'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FiEdit3 className={`w-4 h-4 ${isFirma ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className={`text-sm font-medium ${isFirma ? 'text-purple-300' : 'text-slate-400'}`}>
              Firma Remota
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            File .cer / .crt / .pem. Solo certificato pubblico, senza password.
          </p>
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-300">
              {isFirma ? 'Certificato di Firma Remota' : 'Certificato di Interoperabilita'}
            </p>
            {isFirma ? (
              <ul className="text-xs text-slate-500 mt-2 space-y-1">
                <li>1. Scarica il certificato di firma dall&apos;area operatori RENTRI</li>
                <li>2. Il file sara in formato .cer o .pem (solo chiave pubblica)</li>
                <li>3. Non serve password ne chiave privata</li>
                <li>4. Necessario per firmare digitalmente i FIR (xFIR)</li>
              </ul>
            ) : (
              <ul className="text-xs text-slate-500 mt-2 space-y-1">
                <li>1. Richiedi certificato su: <a href="https://www.rentri.gov.it" target="_blank" rel="noreferrer" className="text-blue-400 underline">portale RENTRI</a></li>
                <li>2. Riceverai file .p12 via email con password</li>
                <li>3. Caricalo qui con la password fornita</li>
                <li>4. Il sistema estrarra automaticamente certificato e chiave</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 space-y-4">

        {/* File Upload */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            {isFirma ? 'File Certificato (.cer / .crt / .pem) *' : 'File Certificato (.p12 / .pfx) *'}
          </label>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              onChange={handleFileChange}
              className="hidden"
              id="cert-file"
            />
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`flex items-center justify-center gap-3 w-full px-6 py-8 border-2 border-dashed ${
                dragActive
                  ? "border-purple-500 bg-purple-500/10"
                  : file
                    ? "border-sky-500 bg-sky-500/5"
                    : "border-[#243044] bg-[#141c27]"
              } rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all`}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
            >
              {file ? (
                <>
                  <FiCheck className="w-5 h-5 text-sky-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FiFile className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB - Click per cambiare file
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <FiUpload className={`w-5 h-5 ${dragActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {dragActive ? "Rilascia qui il file" : `Click per selezionare file ${acceptedExtensions.join(' / ')}`}
                    </p>
                    <p className="text-xs text-slate-500">oppure trascina qui il file</p>
                  </div>
                </>
              )}
            </div>
          </div>
          {errors.file && <p className="text-xs text-red-400 mt-1">{errors.file}</p>}
        </div>

        {/* Password - solo per interoperabilita */}
        {!isFirma && (
          <div>
            <label htmlFor="cert-password" className="block text-xs font-medium text-slate-400 mb-1.5">
              Password Certificato *
            </label>
            <input
              id="cert-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`w-full px-3 py-2 text-sm bg-[#141c27] border ${
                errors.password ? "border-red-500" : "border-[#243044]"
              } rounded-lg text-slate-200`}
              placeholder="Password fornita con il certificato"
            />
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
          </div>
        )}

        {/* CF Operatore */}
        <div>
          <label htmlFor="cf-operatore" className="block text-xs font-medium text-slate-400 mb-1.5">
            Codice Fiscale Operatore *
          </label>
          <input
            id="cf-operatore"
            type="text"
            value={form.cf_operatore}
            onChange={(e) => setForm({ ...form, cf_operatore: e.target.value.toUpperCase() })}
            className={`w-full px-3 py-2 text-sm bg-[#141c27] border ${
              errors.cf_operatore ? "border-red-500" : "border-[#243044]"
            } rounded-lg text-slate-200 font-mono uppercase`}
            placeholder="SCZMNL05L21D960T"
            maxLength={16}
          />
          {errors.cf_operatore && <p className="text-xs text-red-400 mt-1">{errors.cf_operatore}</p>}
          <p className="text-xs text-slate-500 mt-1">Codice fiscale a cui e intestato il certificato</p>
        </div>

        {/* Ragione Sociale */}
        <div>
          <label htmlFor="ragione-sociale" className="block text-xs font-medium text-slate-400 mb-1.5">
            Ragione Sociale / Nome Completo *
          </label>
          <input
            id="ragione-sociale"
            type="text"
            value={form.ragione_sociale}
            onChange={(e) => setForm({ ...form, ragione_sociale: e.target.value })}
            className={`w-full px-3 py-2 text-sm bg-[#141c27] border ${
              errors.ragione_sociale ? "border-red-500" : "border-[#243044]"
            } rounded-lg text-slate-200`}
            placeholder="SCOZZARINI EMMANUEL SALVATORE"
          />
          {errors.ragione_sociale && <p className="text-xs text-red-400 mt-1">{errors.ragione_sociale}</p>}
        </div>

        {/* Ambiente */}
        <div>
          <label htmlFor="cert-env" className="block text-xs font-medium text-slate-400 mb-1.5">
            Ambiente RENTRI
          </label>
          <select
            id="cert-env"
            value={form.environment}
            onChange={(e) => setForm({ ...form, environment: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200"
          >
            <option value="demo">DEMO - Test (gratuito)</option>
            <option value="production">PRODUZIONE - Reale</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Demo per test, Produzione per FIR con valore legale</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-300">Caricamento in corso...</p>
            <span className="text-xs text-slate-500 ml-auto">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-[#141c27] rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={() => navigate(returnPath)}
          disabled={uploading}
          className="px-3 py-1.5 text-xs font-medium bg-[#1a2536] hover:bg-[#243044] text-slate-200 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <FiX className="w-3.5 h-3.5" />
          Annulla
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Caricamento... {uploadProgress}%
            </>
          ) : (
            <>
              <FiUpload className="w-3.5 h-3.5" />
              Carica Certificato
            </>
          )}
        </button>
      </div>
    </div>
  );
}
