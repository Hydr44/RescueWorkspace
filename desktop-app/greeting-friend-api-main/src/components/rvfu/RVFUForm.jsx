// src/components/rvfu/RVFUForm.jsx
// Form per la creazione e modifica di VFU

import { useState, useEffect } from 'react';
import { 
  FiTruck, FiUser, FiFileText, FiSave, FiX, FiAlertCircle,
  FiCheckCircle, FiUpload, FiDownload, FiCalendar
} from 'react-icons/fi';
import { useRVFU } from '@/hooks/useRVFU';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoadingButton } from '@/components/ui/LoadingButton';
import PropTypes from 'prop-types';

const RVFUForm = ({ 
  vfu = null, 
  onSave, 
  onCancel, 
  mode = 'create', // 'create' | 'edit'
  userType = 'concessionario' // 'concessionario' | 'cr'
}) => {
  const {
    loading,
    error,
    validation,
    registraVFUConcessionario,
    registraVFUCR,
    aggiornaVFU,
    validateVFUConcessionario,
    validateVFUCR,
    getCausali,
    getComuni,
    getProvince,
    clearError,
    clearValidation
  } = useRVFU();

  const [formData, setFormData] = useState({
    // Dati veicolo
    targa: '',
    telaio: '',
    tipoVeicolo: '',
    causale: '',
    flagConsegnaForzeOrdine: 'N',
    forzaRegistrazione: 'N',
    canaleNoPra: false,
    cic: '',
    
    // Soggetto intestatario
    intestatario: {
      codiceFiscale: '',
      cognome: '',
      nome: '',
      ragioneSociale: '',
      dataNascita: '',
      codiceComuneNascita: '',
      codiceProvinciaNascita: '',
      codiceStatoEsteroNascita: '',
      codiceComuneResidenza: '',
      codiceProvinciaResidenza: '',
      codiceStatoEsteroResidenza: '',
      comuneNascita: '',
      provinciaNascita: '',
      statoNascita: '',
      comuneResidenza: '',
      provinciaResidenza: '',
      statoResidenza: '',
      indirizzoResidenza: '',
      numeroCivicoResidenza: '',
      capResidenza: '',
      dugResidenza: '',
      toponimoResidenza: '',
      localitaEsteraNascita: '',
      localitaEsteraResidenza: '',
      tipoPersonaGiuridica: 'PF'
    },
    
    // Soggetto detentore (opzionale)
    detentore: {
      codiceFiscale: '',
      cognome: '',
      nome: '',
      ragioneSociale: '',
      dataNascita: '',
      codiceComuneNascita: '',
      codiceProvinciaNascita: '',
      codiceStatoEsteroNascita: '',
      codiceComuneResidenza: '',
      codiceProvinciaResidenza: '',
      codiceStatoEsteroResidenza: '',
      comuneNascita: '',
      provinciaNascita: '',
      statoNascita: '',
      comuneResidenza: '',
      provinciaResidenza: '',
      statoResidenza: '',
      indirizzoResidenza: '',
      numeroCivicoResidenza: '',
      capResidenza: '',
      dugResidenza: '',
      toponimoResidenza: '',
      localitaEsteraNascita: '',
      localitaEsteraResidenza: '',
      tipoPersonaGiuridica: 'PF'
    },
    
    // Distinta documenti
    distinta: {
      du: 'ASSENTE',
      cdc: 'ASSENTE',
      cdp: 'ASSENTE',
      foglioC: 'ASSENTE',
      documentoIntestatario: false,
      documentoDetentore: false,
      targaAnteriore: false,
      targaPosteriore: false,
      targaDenuncia: false,
      altro: ''
    },
    
    // Note
    noteAggiuntive: '',
    notePartiRifiuti: ''
  });

  const [causali, setCausali] = useState([]);
  const [province, setProvince] = useState([]);
  const [comuniNascita, setComuniNascita] = useState([]);
  const [comuniResidenza, setComuniResidenza] = useState([]);
  const [showDetentore, setShowDetentore] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carica dati iniziali
  useEffect(() => {
    loadInitialData();
    
    if (vfu && mode === 'edit') {
      loadVFUData();
    }
  }, [vfu, mode]);

  const loadInitialData = async () => {
    try {
      const [causaliData, provinceData] = await Promise.all([
        getCausali(),
        getProvince()
      ]);
      
      if (causaliData) setCausali(causaliData);
      if (provinceData) setProvince(provinceData);
    } catch (err) {
      console.error('Errore caricamento dati iniziali:', err);
    }
  };

  const loadVFUData = () => {
    if (vfu) {
      setFormData({
        targa: vfu.targa || '',
        telaio: vfu.telaio || '',
        tipoVeicolo: vfu.tipoVeicolo || '',
        causale: vfu.causale || '',
        flagConsegnaForzeOrdine: vfu.flagConsegnaForzeOrdine || 'N',
        forzaRegistrazione: vfu.forzaRegistrazione || 'N',
        canaleNoPra: vfu.canaleNoPra || false,
        cic: vfu.cic || '',
        intestatario: vfu.intestatario || formData.intestatario,
        detentore: vfu.detentore || formData.detentore,
        distinta: vfu.distinta || formData.distinta,
        noteAggiuntive: vfu.noteAggiuntive || '',
        notePartiRifiuti: vfu.notePartiRifiuti || ''
      });
      
      if (vfu.detentore) {
        setShowDetentore(true);
      }
    }
  };

  const handleInputChange = (field, value, section = null) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear validation errors when user starts typing
    if (validation) {
      clearValidation();
    }
    if (error) {
      clearError();
    }
  };

  const handleProvinceChange = async (provincia, section) => {
    handleInputChange('provinciaNascita', provincia, section);
    
    if (provincia) {
      try {
        const comuni = await getComuni(provincia);
        if (comuni) {
          if (section === 'intestatario') {
            setComuniNascita(comuni);
          } else {
            setComuniResidenza(comuni);
          }
        }
      } catch (err) {
        console.error('Errore caricamento comuni:', err);
      }
    }
  };

  const validateForm = () => {
    let validation;
    
    if (userType === 'concessionario') {
      validation = validateVFUConcessionario(formData);
    } else {
      validation = validateVFUCR(formData);
    }
    
    return validation;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validazione
      const validation = validateForm();
      if (!validation.isValid) {
        return;
      }
      
      let result;
      
      if (mode === 'create') {
        if (userType === 'concessionario') {
          result = await registraVFUConcessionario(formData);
        } else {
          result = await registraVFUCR(formData);
        }
      } else {
        result = await aggiornaVFU(vfu.idVFU, formData);
      }
      
      if (result && onSave) {
        onSave(result);
      }
    } catch (err) {
      console.error('Errore salvataggio VFU:', err);
    } finally {
      setSaving(false);
    }
  };

  const getFieldError = (field, section = null) => {
    if (!validation?.errors) return null;
    
    const fullField = section ? `${section}.${field}` : field;
    return validation.errors.find(e => e.field === fullField);
  };

  const getFieldWarning = (field, section = null) => {
    if (!validation?.warnings) return null;
    
    const fullField = section ? `${section}.${field}` : field;
    return validation.warnings.find(w => w.field === fullField);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">
            {mode === 'create' ? 'Nuovo VFU' : 'Modifica VFU'}
          </h2>
          <p className="text-slate-400 mt-1">
            {userType === 'concessionario' ? 'Registrazione come Concessionario' : 'Registrazione come Centro di Raccolta'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="btn btn-outline animate-fade-in"
          >
            <FiX className="h-4 w-4" />
            Annulla
          </button>
          <LoadingButton
            onClick={handleSave}
            loading={saving}
            loadingText="Salvataggio..."
            className="animate-bounce-in"
          >
            <FiSave className="h-4 w-4" />
            Salva
          </LoadingButton>
        </div>
      </div>

      {/* Errori di validazione */}
      {validation?.errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-start">
            <FiAlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-400">
                Errori di validazione
              </h3>
              <ul className="mt-2 text-sm text-red-400 list-disc list-inside">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Avvisi di validazione */}
      {validation?.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-start">
            <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-400">
                Avvisi
              </h3>
              <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-[#141c27] rounded-lg border border-[#243044]  p-6 space-y-6">
        
        {/* Sezione Veicolo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FiTruck className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-200">
              Dati Veicolo
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Targa *
              </label>
              <input
                type="text"
                value={formData.targa}
                onChange={(e) => handleInputChange('targa', e.target.value.toUpperCase())}
                placeholder="AA999AA"
                maxLength={7}
                className={`form-input focus-ring animate-fade-in ${
                  getFieldError('targa') ? 'border-red-500' : ''
                }`}
              />
              {getFieldError('targa') && (
                <p className="text-red-600 text-xs mt-1">{getFieldError('targa').message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Telaio *
              </label>
              <input
                type="text"
                value={formData.telaio}
                onChange={(e) => handleInputChange('telaio', e.target.value.toUpperCase())}
                placeholder="Numero telaio"
                className={`form-input focus-ring animate-fade-in ${
                  getFieldError('telaio') ? 'border-red-500' : ''
                }`}
              />
              {getFieldError('telaio') && (
                <p className="text-red-600 text-xs mt-1">{getFieldError('telaio').message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tipo Veicolo *
              </label>
              <select
                value={formData.tipoVeicolo}
                onChange={(e) => handleInputChange('tipoVeicolo', e.target.value)}
                className={`form-input focus-ring animate-fade-in ${
                  getFieldError('tipoVeicolo') ? 'border-red-500' : ''
                }`}
              >
                <option value="">Seleziona tipo</option>
                <option value="A">Autoveicolo</option>
                <option value="M">Motoveicolo</option>
                <option value="C">Ciclomotore</option>
                <option value="R">Rimorchio</option>
                <option value="T">Trattore</option>
                <option value="Q">Quadriciclo</option>
                <option value="S">Scooter</option>
                <option value="U">Autobus</option>
                <option value="V">Veicolo commerciale</option>
                <option value="W">Veicolo speciale</option>
                <option value="X">Veicolo agricolo</option>
                <option value="Y">Veicolo industriale</option>
                <option value="Z">Altro</option>
              </select>
              {getFieldError('tipoVeicolo') && (
                <p className="text-red-600 text-xs mt-1">{getFieldError('tipoVeicolo').message}</p>
              )}
            </div>

            {userType === 'cr' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Causale *
                </label>
                <select
                  value={formData.causale}
                  onChange={(e) => handleInputChange('causale', e.target.value)}
                  className={`form-input focus-ring animate-fade-in ${
                    getFieldError('causale') ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Seleziona causale</option>
                  {causali.map((causale) => (
                    <option key={causale.id} value={causale.codMtvInsVei}>
                      {causale.desMtvInsVei}
                    </option>
                  ))}
                </select>
                {getFieldError('causale') && (
                  <p className="text-red-600 text-xs mt-1">{getFieldError('causale').message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Flag Consegna Forze Ordine *
              </label>
              <select
                value={formData.flagConsegnaForzeOrdine}
                onChange={(e) => handleInputChange('flagConsegnaForzeOrdine', e.target.value)}
                className={`form-input focus-ring animate-fade-in ${
                  getFieldError('flagConsegnaForzeOrdine') ? 'border-red-500' : ''
                }`}
              >
                <option value="N">No</option>
                <option value="S">Sì</option>
              </select>
              {getFieldError('flagConsegnaForzeOrdine') && (
                <p className="text-red-600 text-xs mt-1">{getFieldError('flagConsegnaForzeOrdine').message}</p>
              )}
            </div>

            {userType === 'cr' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Forza Registrazione *
                </label>
                <select
                  value={formData.forzaRegistrazione}
                  onChange={(e) => handleInputChange('forzaRegistrazione', e.target.value)}
                  className={`form-input focus-ring animate-fade-in ${
                    getFieldError('forzaRegistrazione') ? 'border-red-500' : ''
                  }`}
                >
                  <option value="N">No</option>
                  <option value="S">Sì</option>
                </select>
                {getFieldError('forzaRegistrazione') && (
                  <p className="text-red-600 text-xs mt-1">{getFieldError('forzaRegistrazione').message}</p>
                )}
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="canaleNoPra"
                checked={formData.canaleNoPra}
                onChange={(e) => handleInputChange('canaleNoPra', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#243044] rounded"
              />
              <label htmlFor="canaleNoPra" className="ml-2 block text-sm text-slate-300">
                Canale No PRA
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                CIC
              </label>
              <input
                type="text"
                value={formData.cic}
                onChange={(e) => handleInputChange('cic', e.target.value)}
                placeholder="Codice identificativo"
                className="form-input focus-ring animate-fade-in"
              />
            </div>
          </div>
        </div>

        {/* Sezione Intestatario */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FiUser className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-200">
              Intestatario *
            </h3>
          </div>
          
          <SoggettoForm
            soggetto={formData.intestatario}
            onChange={(field, value) => handleInputChange(field, value, 'intestatario')}
            onProvinceChange={(provincia) => handleProvinceChange(provincia, 'intestatario')}
            province={province}
            comuni={comuniNascita}
            getFieldError={(field) => getFieldError(field, 'intestatario')}
            getFieldWarning={(field) => getFieldWarning(field, 'intestatario')}
          />
        </div>

        {/* Sezione Detentore (opzionale) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUser className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-200">
                Detentore
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDetentore(!showDetentore)}
              className="text-sm text-indigo-600 hover:text-blue-400"
            >
              {showDetentore ? 'Nascondi' : 'Aggiungi detentore'}
            </button>
          </div>
          
          {showDetentore && (
            <SoggettoForm
              soggetto={formData.detentore}
              onChange={(field, value) => handleInputChange(field, value, 'detentore')}
              onProvinceChange={(provincia) => handleProvinceChange(provincia, 'detentore')}
              province={province}
              comuni={comuniResidenza}
              getFieldError={(field) => getFieldError(field, 'detentore')}
              getFieldWarning={(field) => getFieldWarning(field, 'detentore')}
            />
          )}
        </div>

        {/* Sezione Distinta Documenti */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FiFileText className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-200">
              Distinta Documenti
            </h3>
          </div>
          
          <DistintaForm
            distinta={formData.distinta}
            onChange={(field, value) => handleInputChange(field, value, 'distinta')}
            getFieldError={(field) => getFieldError(field, 'distinta')}
            getFieldWarning={(field) => getFieldWarning(field, 'distinta')}
          />
        </div>

        {/* Sezione Note */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FiFileText className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-200">
              Note
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Note Aggiuntive
              </label>
              <textarea
                value={formData.noteAggiuntive}
                onChange={(e) => handleInputChange('noteAggiuntive', e.target.value)}
                rows={3}
                placeholder="Note aggiuntive..."
                className="form-input focus-ring animate-fade-in"
              />
              {getFieldWarning('noteAggiuntive') && (
                <p className="text-yellow-600 text-xs mt-1">{getFieldWarning('noteAggiuntive').message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Note Parti Rifiuti
              </label>
              <textarea
                value={formData.notePartiRifiuti}
                onChange={(e) => handleInputChange('notePartiRifiuti', e.target.value)}
                rows={3}
                placeholder="Note parti rifiuti..."
                className="form-input focus-ring animate-fade-in"
              />
              {getFieldWarning('notePartiRifiuti') && (
                <p className="text-yellow-600 text-xs mt-1">{getFieldWarning('notePartiRifiuti').message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente per il form del soggetto
const SoggettoForm = ({ 
  soggetto, 
  onChange, 
  onProvinceChange, 
  province, 
  comuni, 
  getFieldError, 
  getFieldWarning 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Codice Fiscale *
        </label>
        <input
          type="text"
          value={soggetto.codiceFiscale}
          onChange={(e) => onChange('codiceFiscale', e.target.value.toUpperCase())}
          placeholder="RSSMRA80A01H501U"
          maxLength={16}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('codiceFiscale') ? 'border-red-500' : ''
          }`}
        />
        {getFieldError('codiceFiscale') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('codiceFiscale').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Cognome *
        </label>
        <input
          type="text"
          value={soggetto.cognome}
          onChange={(e) => onChange('cognome', e.target.value)}
          placeholder="Rossi"
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('cognome') ? 'border-red-500' : ''
          }`}
        />
        {getFieldError('cognome') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('cognome').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Nome *
        </label>
        <input
          type="text"
          value={soggetto.nome}
          onChange={(e) => onChange('nome', e.target.value)}
          placeholder="Mario"
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('nome') ? 'border-red-500' : ''
          }`}
        />
        {getFieldError('nome') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('nome').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Ragione Sociale
        </label>
        <input
          type="text"
          value={soggetto.ragioneSociale}
          onChange={(e) => onChange('ragioneSociale', e.target.value)}
          placeholder="Per persone giuridiche"
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('ragioneSociale') ? 'border-red-500' : ''
          }`}
        />
        {getFieldError('ragioneSociale') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('ragioneSociale').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Data Nascita *
        </label>
        <input
          type="date"
          value={soggetto.dataNascita}
          onChange={(e) => onChange('dataNascita', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('dataNascita') ? 'border-red-500' : ''
          }`}
        />
        {getFieldError('dataNascita') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('dataNascita').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Provincia Nascita *
        </label>
        <select
          value={soggetto.provinciaNascita}
          onChange={(e) => {
            onChange('provinciaNascita', e.target.value);
            onProvinceChange(e.target.value);
          }}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('provinciaNascita') ? 'border-red-500' : ''
          }`}
        >
          <option value="">Seleziona provincia</option>
          {province.map((prov) => (
            <option key={prov.sigla} value={prov.sigla}>
              {prov.denominazione}
            </option>
          ))}
        </select>
        {getFieldError('provinciaNascita') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('provinciaNascita').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Comune Nascita *
        </label>
        <select
          value={soggetto.codiceComuneNascita}
          onChange={(e) => onChange('codiceComuneNascita', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('codiceComuneNascita') ? 'border-red-500' : ''
          }`}
        >
          <option value="">Seleziona comune</option>
          {comuni.map((comune) => (
            <option key={comune.codice} value={comune.codice}>
              {comune.denominazione}
            </option>
          ))}
        </select>
        {getFieldError('codiceComuneNascita') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('codiceComuneNascita').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Provincia Residenza *
        </label>
        <select
          value={soggetto.provinciaResidenza}
          onChange={(e) => {
            onChange('provinciaResidenza', e.target.value);
            onProvinceChange(e.target.value);
          }}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('provinciaResidenza') ? 'border-red-500' : ''
          }`}
        >
          <option value="">Seleziona provincia</option>
          {province.map((prov) => (
            <option key={prov.sigla} value={prov.sigla}>
              {prov.denominazione}
            </option>
          ))}
        </select>
        {getFieldError('provinciaResidenza') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('provinciaResidenza').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Comune Residenza *
        </label>
        <select
          value={soggetto.codiceComuneResidenza}
          onChange={(e) => onChange('codiceComuneResidenza', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('codiceComuneResidenza') ? 'border-red-500' : ''
          }`}
        >
          <option value="">Seleziona comune</option>
          {comuni.map((comune) => (
            <option key={comune.codice} value={comune.codice}>
              {comune.denominazione}
            </option>
          ))}
        </select>
        {getFieldError('codiceComuneResidenza') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('codiceComuneResidenza').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          CAP Residenza
        </label>
        <input
          type="text"
          value={soggetto.capResidenza}
          onChange={(e) => onChange('capResidenza', e.target.value)}
          placeholder="00100"
          maxLength={5}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('capResidenza') ? 'border-red-500' : ''
          }`}
        />
        {getFieldError('capResidenza') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('capResidenza').message}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Indirizzo Residenza
        </label>
        <input
          type="text"
          value={soggetto.indirizzoResidenza}
          onChange={(e) => onChange('indirizzoResidenza', e.target.value)}
          placeholder="Via Roma, 123"
          className="form-input focus-ring animate-fade-in"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Tipo Persona Giuridica
        </label>
        <select
          value={soggetto.tipoPersonaGiuridica}
          onChange={(e) => onChange('tipoPersonaGiuridica', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('tipoPersonaGiuridica') ? 'border-red-500' : ''
          }`}
        >
          <option value="PF">Persona Fisica</option>
          <option value="PG">Persona Giuridica</option>
          <option value="PM">Persona Morale</option>
        </select>
        {getFieldError('tipoPersonaGiuridica') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('tipoPersonaGiuridica').message}</p>
        )}
      </div>
    </div>
  );
};

// Componente per la distinta documenti
const DistintaForm = ({ distinta, onChange, getFieldError, getFieldWarning }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          DU *
        </label>
        <select
          value={distinta.du}
          onChange={(e) => onChange('du', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('du') ? 'border-red-500' : ''
          }`}
        >
          <option value="ASSENTE">Assente</option>
          <option value="DENUNCIA">Denuncia</option>
          <option value="DOCUMENTO">Documento</option>
          <option value="VERBALE">Verbale</option>
        </select>
        {getFieldError('du') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('du').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          CDC *
        </label>
        <select
          value={distinta.cdc}
          onChange={(e) => onChange('cdc', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('cdc') ? 'border-red-500' : ''
          }`}
        >
          <option value="ASSENTE">Assente</option>
          <option value="DENUNCIA">Denuncia</option>
          <option value="DOCUMENTO">Documento</option>
          <option value="VERBALE">Verbale</option>
        </select>
        {getFieldError('cdc') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('cdc').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          CDP *
        </label>
        <select
          value={distinta.cdp}
          onChange={(e) => onChange('cdp', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('cdp') ? 'border-red-500' : ''
          }`}
        >
          <option value="ASSENTE">Assente</option>
          <option value="DENUNCIA">Denuncia</option>
          <option value="DOCUMENTO">Documento</option>
        </select>
        {getFieldError('cdp') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('cdp').message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Foglio C *
        </label>
        <select
          value={distinta.foglioC}
          onChange={(e) => onChange('foglioC', e.target.value)}
          className={`form-input focus-ring animate-fade-in ${
            getFieldError('foglioC') ? 'border-red-500' : ''
          }`}
        >
          <option value="ASSENTE">Assente</option>
          <option value="DENUNCIA">Denuncia</option>
          <option value="DOCUMENTO">Documento</option>
        </select>
        {getFieldError('foglioC') && (
          <p className="text-red-600 text-xs mt-1">{getFieldError('foglioC').message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Documenti
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={distinta.documentoIntestatario}
              onChange={(e) => onChange('documentoIntestatario', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#243044] rounded"
            />
            <span className="ml-2 text-sm text-slate-300">
              Documento Intestatario
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={distinta.documentoDetentore}
              onChange={(e) => onChange('documentoDetentore', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#243044] rounded"
            />
            <span className="ml-2 text-sm text-slate-300">
              Documento Detentore
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Targhe
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={distinta.targaAnteriore}
              onChange={(e) => onChange('targaAnteriore', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#243044] rounded"
            />
            <span className="ml-2 text-sm text-slate-300">
              Targa Anteriore
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={distinta.targaPosteriore}
              onChange={(e) => onChange('targaPosteriore', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#243044] rounded"
            />
            <span className="ml-2 text-sm text-slate-300">
              Targa Posteriore
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={distinta.targaDenuncia}
              onChange={(e) => onChange('targaDenuncia', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-[#243044] rounded"
            />
            <span className="ml-2 text-sm text-slate-300">
              Targa Denuncia
            </span>
          </label>
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Altro
        </label>
        <input
          type="text"
          value={distinta.altro}
          onChange={(e) => onChange('altro', e.target.value)}
          placeholder="Altri documenti..."
          className={`form-input focus-ring animate-fade-in ${
            getFieldWarning('altro') ? 'border-yellow-500' : ''
          }`}
        />
        {getFieldWarning('altro') && (
          <p className="text-yellow-600 text-xs mt-1">{getFieldWarning('altro').message}</p>
        )}
      </div>
    </div>
  );
};

RVFUForm.propTypes = {
  vfu: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  userType: PropTypes.oneOf(['concessionario', 'cr']),
};

export default RVFUForm;
