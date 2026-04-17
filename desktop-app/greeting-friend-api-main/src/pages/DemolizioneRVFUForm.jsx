import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiX, FiShield, FiUser, FiTruck, FiFileText,
  FiArrowLeft, FiCheck, FiCalendar, FiMapPin, FiPhone, FiMail, FiSearch, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase-browser';
import { useOrg } from '@/context/OrgContext';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';
import LoadingButton from '@/components/ui/LoadingButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import DocumentManager from '@/components/rvfu/DocumentManager';
import { useDocumentManager } from '@/hooks/useDocumentManager';
import { useRVFUAuth } from '@/hooks/useRVFUAuth';
import { createRVFUClient } from '@/lib/rvfu-client';
import { useDemo } from '@/hooks/useDemo';
import { mockVerificaVeicolo } from '@/lib/rvfu-mock';
import { normalizeCausale } from '@/lib/rvfu-mapper';

const TABLE = "demolition_cases";

const DemolizioneRVFUForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { orgId } = useOrg();
  const { showError, showSuccess, showInfo } = useToast();
  const documentManager = useDocumentManager();
  const { isAuthenticated, tokens, authService } = useRVFUAuth('formation');
  const { isDemo } = useDemo();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false); // Modal per ricerca veicolo
  const [searching, setSearching] = useState(false);
  const [veicoliTrovati, setVeicoliTrovati] = useState([]);
  const [searchErrors, setSearchErrors] = useState({});
  const [searchParams, setSearchParams] = useState({
    codiceFiscale: '',
    targa: '',
    telaio: '',
    tipoVeicolo: 'A',
    causale: ''
  });
  const [formData, setFormData] = useState({
    // Veicolo
    targa: '',
    telaio: '',
    numero_telaio: '',
    tipoVeicolo: 'A', // default autoveicolo
    marca: '',
    modello: '',
    marca_modello: '',
    anno: '',
    colore: '',
    cilindrata: '',
    potenza: '',
    dataPrimaImmatricolazione: '',
    flagConsegnaForzeOrdine: 'N',
    canaleNoPra: false,
    cic: '',
    
    // Intestatario - Persona Fisica/Giuridica
    proprietario_tipoPersona: 'PF', // PF o PG
    proprietario_nome: '',
    proprietario_cognome: '',
    proprietario_ragioneSociale: '',
    proprietario_cf: '',
    proprietario_dataNascita: '',
    
    // Intestatario - Nascita
    proprietario_codiceComuneNascita: '',
    proprietario_comuneNascita: '',
    proprietario_codiceProvinciaNascita: '',
    proprietario_provinciaNascita: '',
    proprietario_statoNascita: '',
    proprietario_codiceStatoEsteroNascita: '',
    proprietario_localitaEsteraNascita: '',
    
    // Intestatario - Residenza
    proprietario_codiceComuneResidenza: '',
    proprietario_comuneResidenza: '',
    proprietario_codiceProvinciaResidenza: '',
    proprietario_provinciaResidenza: '',
    proprietario_indirizzoResidenza: '',
    proprietario_numeroCivicoResidenza: '',
    proprietario_capResidenza: '',
    proprietario_dugResidenza: '',
    proprietario_toponimoResidenza: '',
    proprietario_statoResidenza: '',
    proprietario_codiceStatoEsteroResidenza: '',
    proprietario_localitaEsteraResidenza: '',
    proprietario_telefono: '',
    proprietario_email: '',
    
    // Detentore (opzionale)
    showDetentore: false,
    detentore_tipoPersona: 'PF',
    detentore_nome: '',
    detentore_cognome: '',
    detentore_ragioneSociale: '',
    detentore_cf: '',
    detentore_dataNascita: '',
    detentore_codiceComuneNascita: '',
    detentore_comuneNascita: '',
    detentore_codiceProvinciaNascita: '',
    detentore_provinciaNascita: '',
    detentore_statoNascita: '',
    detentore_codiceStatoEsteroNascita: '',
    detentore_localitaEsteraNascita: '',
    detentore_codiceComuneResidenza: '',
    detentore_comuneResidenza: '',
    detentore_codiceProvinciaResidenza: '',
    detentore_provinciaResidenza: '',
    detentore_indirizzoResidenza: '',
    detentore_numeroCivicoResidenza: '',
    detentore_capResidenza: '',
    detentore_dugResidenza: '',
    detentore_toponimoResidenza: '',
    detentore_statoResidenza: '',
    detentore_codiceStatoEsteroResidenza: '',
    detentore_localitaEsteraResidenza: '',
    
    // Distinta Documenti
    distinta_du: 'ASSENTE',
    distinta_cdc: 'ASSENTE',
    distinta_cdp: 'ASSENTE',
    distinta_foglioC: 'ASSENTE',
    distinta_documentoIntestatario: false,
    distinta_documentoDetentore: false,
    distinta_targaAnteriore: false,
    distinta_targaPosteriore: false,
    distinta_targaDenuncia: false,
    distinta_altro: '',
    
    // Demolizione
    demolizione_data: '',
    demolizione_causale: '',
    demolizione_km: '',
    demolizione_osservazioni: '',
    
    // PRA
    obbligoIscrizionePRA: '', // 'S' = Sì, altro = No
    
    // Note
    noteAggiuntive: '',
    notePartiRifiuti: '',
    
    rvfu_documenti: []
  });

  const [causali, setCausali] = useState([]);
  const [province, setProvince] = useState([]);
  const [comuniNascitaIntestatario, setComuniNascitaIntestatario] = useState([]);
  const [comuniResidenzaIntestatario, setComuniResidenzaIntestatario] = useState([]);
  const [comuniNascitaDetentore, setComuniNascitaDetentore] = useState([]);
  const [comuniResidenzaDetentore, setComuniResidenzaDetentore] = useState([]);
  const [showTestMenu, setShowTestMenu] = useState(false);

  const TEST_DATASETS = [
    {
      label: '1 - Fiat Panda (Rossi Mario, Cagliari)',
      data: {
        targa: 'AB123CD', telaio: 'ZFA22300005123456', numero_telaio: 'ZFA22300005123456',
        tipoVeicolo: 'A', marca: 'FIAT', modello: 'Panda', marca_modello: 'FIAT Panda',
        anno: '2010', colore: 'BIANCO', cilindrata: '1242', potenza: '51',
        dataPrimaImmatricolazione: '2010-03-15', flagConsegnaForzeOrdine: 'N',
        canaleNoPra: false, cic: '',
        obbligoIscrizionePRA: 'S', demolizione_causale: 'D',
        demolizione_data: new Date().toISOString().split('T')[0], demolizione_km: '185000',
        demolizione_osservazioni: 'Veicolo incidentato, danni strutturali importanti',
        proprietario_tipoPersona: 'PF', proprietario_nome: 'MARIO', proprietario_cognome: 'ROSSI',
        proprietario_ragioneSociale: '', proprietario_cf: 'RSSMRA80A01B354Z',
        proprietario_dataNascita: '1980-01-01',
        proprietario_provinciaNascita: 'CA', proprietario_comuneNascita: 'Cagliari',
        proprietario_codiceComuneNascita: '092009', proprietario_codiceProvinciaNascita: '092',
        proprietario_statoNascita: 'IT',
        proprietario_provinciaResidenza: 'CA', proprietario_comuneResidenza: 'Cagliari',
        proprietario_codiceComuneResidenza: '092009', proprietario_codiceProvinciaResidenza: '092',
        proprietario_indirizzoResidenza: 'Via Roma 15', proprietario_numeroCivicoResidenza: '15',
        proprietario_capResidenza: '09124', proprietario_telefono: '3201234567',
        proprietario_email: 'mario.rossi@test.it',
        distinta_du: 'INSERITO', distinta_cdc: 'INSERITO', distinta_cdp: 'INSERITO',
        distinta_documentoIntestatario: true, distinta_targaAnteriore: true, distinta_targaPosteriore: true,
        noteAggiuntive: 'Test caso 1 - Fiat Panda rottamazione',
      }
    },
    {
      label: '2 - VW Golf (Verdi Luigi, Firenze)',
      data: {
        targa: 'EF456GH', telaio: 'WVWZZZ3CZWE123456', numero_telaio: 'WVWZZZ3CZWE123456',
        tipoVeicolo: 'A', marca: 'VOLKSWAGEN', modello: 'Golf', marca_modello: 'VOLKSWAGEN Golf',
        anno: '2015', colore: 'GRIGIO', cilindrata: '1598', potenza: '77',
        dataPrimaImmatricolazione: '2015-06-20', flagConsegnaForzeOrdine: 'N',
        canaleNoPra: false, cic: '',
        obbligoIscrizionePRA: 'S', demolizione_causale: 'D',
        demolizione_data: new Date().toISOString().split('T')[0], demolizione_km: '220000',
        demolizione_osservazioni: 'Fine vita utile, motore fuso',
        proprietario_tipoPersona: 'PF', proprietario_nome: 'LUIGI', proprietario_cognome: 'VERDI',
        proprietario_ragioneSociale: '', proprietario_cf: 'VRDLGI75B02D612X',
        proprietario_dataNascita: '1975-02-02',
        proprietario_provinciaNascita: 'FI', proprietario_comuneNascita: 'Firenze',
        proprietario_codiceComuneNascita: '048017', proprietario_codiceProvinciaNascita: '048',
        proprietario_statoNascita: 'IT',
        proprietario_provinciaResidenza: 'FI', proprietario_comuneResidenza: 'Firenze',
        proprietario_codiceComuneResidenza: '048017', proprietario_codiceProvinciaResidenza: '048',
        proprietario_indirizzoResidenza: 'Viale Michelangelo 42', proprietario_numeroCivicoResidenza: '42',
        proprietario_capResidenza: '50125', proprietario_telefono: '3339876543',
        proprietario_email: 'luigi.verdi@email.com',
        distinta_du: 'INSERITO', distinta_cdc: 'INSERITO', distinta_cdp: 'ASSENTE',
        distinta_documentoIntestatario: true, distinta_targaAnteriore: true, distinta_targaPosteriore: true,
        noteAggiuntive: 'Test caso 2 - Golf diesel fine vita',
      }
    },
    {
      label: '3 - Piaggio Liberty (Bianchi Lara, Bari) No PRA',
      data: {
        targa: 'LM789NO', telaio: 'ZCFC35A005D123456', numero_telaio: 'ZCFC35A005D123456',
        tipoVeicolo: 'M', marca: 'PIAGGIO', modello: 'Liberty 125', marca_modello: 'PIAGGIO Liberty 125',
        anno: '2018', colore: 'NERO', cilindrata: '124', potenza: '8',
        dataPrimaImmatricolazione: '2018-09-10', flagConsegnaForzeOrdine: 'N',
        canaleNoPra: true, cic: '',
        obbligoIscrizionePRA: 'N', demolizione_causale: 'D',
        demolizione_data: new Date().toISOString().split('T')[0], demolizione_km: '35000',
        demolizione_osservazioni: 'Ciclomotore, gestione senza PRA (canale UMC)',
        proprietario_tipoPersona: 'PF', proprietario_nome: 'LARA', proprietario_cognome: 'BIANCHI',
        proprietario_ragioneSociale: '', proprietario_cf: 'BNCLRA90C43A662Y',
        proprietario_dataNascita: '1990-03-03',
        proprietario_provinciaNascita: 'BA', proprietario_comuneNascita: 'Bari',
        proprietario_codiceComuneNascita: '072006', proprietario_codiceProvinciaNascita: '072',
        proprietario_statoNascita: 'IT',
        proprietario_provinciaResidenza: 'BA', proprietario_comuneResidenza: 'Bari',
        proprietario_codiceComuneResidenza: '072006', proprietario_codiceProvinciaResidenza: '072',
        proprietario_indirizzoResidenza: 'Corso Vittorio Emanuele 88', proprietario_numeroCivicoResidenza: '88',
        proprietario_capResidenza: '70122', proprietario_telefono: '3281112233',
        proprietario_email: 'lara.bianchi@pec.it',
        distinta_du: 'INSERITO', distinta_cdc: 'INSERITO', distinta_cdp: 'ASSENTE',
        distinta_documentoIntestatario: true, distinta_targaAnteriore: true, distinta_targaPosteriore: false,
        noteAggiuntive: 'Test caso 3 - Scooter senza obbligo PRA',
      }
    },
    {
      label: '4 - Renault Clio (Autoricambi SRL, Milano) Azienda',
      data: {
        targa: 'PQ012RS', telaio: 'VF1BB5308Y0654321', numero_telaio: 'VF1BB5308Y0654321',
        tipoVeicolo: 'A', marca: 'RENAULT', modello: 'Clio', marca_modello: 'RENAULT Clio',
        anno: '2012', colore: 'ROSSO', cilindrata: '1149', potenza: '55',
        dataPrimaImmatricolazione: '2012-11-05', flagConsegnaForzeOrdine: 'N',
        canaleNoPra: false, cic: '',
        obbligoIscrizionePRA: 'S', demolizione_causale: 'D',
        demolizione_data: new Date().toISOString().split('T')[0], demolizione_km: '310000',
        demolizione_osservazioni: 'Veicolo aziendale dismesso, elevato chilometraggio',
        proprietario_tipoPersona: 'PG', proprietario_nome: '', proprietario_cognome: '',
        proprietario_ragioneSociale: 'AUTORICAMBI SRL', proprietario_cf: '12345678901',
        proprietario_dataNascita: '',
        proprietario_provinciaNascita: '', proprietario_comuneNascita: '',
        proprietario_codiceComuneNascita: '', proprietario_codiceProvinciaNascita: '',
        proprietario_statoNascita: 'IT',
        proprietario_provinciaResidenza: 'MI', proprietario_comuneResidenza: 'Milano',
        proprietario_codiceComuneResidenza: '015146', proprietario_codiceProvinciaResidenza: '015',
        proprietario_indirizzoResidenza: 'Via Torino 120', proprietario_numeroCivicoResidenza: '120',
        proprietario_capResidenza: '20123', proprietario_telefono: '0212345678',
        proprietario_email: 'info@autoricambi-srl.it',
        distinta_du: 'INSERITO', distinta_cdc: 'INSERITO', distinta_cdp: 'INSERITO',
        distinta_documentoIntestatario: true, distinta_targaAnteriore: true, distinta_targaPosteriore: true,
        noteAggiuntive: 'Test caso 4 - Persona giuridica (azienda)',
      }
    },
    {
      label: '5 - Ford Fiesta (Neri Anna, Roma) Forze Ordine',
      data: {
        targa: 'TU345VZ', telaio: 'WF0XXXGCX5Y987654', numero_telaio: 'WF0XXXGCX5Y987654',
        tipoVeicolo: 'A', marca: 'FORD', modello: 'Fiesta', marca_modello: 'FORD Fiesta',
        anno: '2005', colore: 'BLU', cilindrata: '1388', potenza: '59',
        dataPrimaImmatricolazione: '2005-04-22', flagConsegnaForzeOrdine: 'S',
        canaleNoPra: false, cic: '',
        obbligoIscrizionePRA: 'S', demolizione_causale: 'D',
        demolizione_data: new Date().toISOString().split('T')[0], demolizione_km: '0',
        demolizione_osservazioni: 'Veicolo ritrovato dopo furto, consegnato da Forze Ordine, non riparabile',
        proprietario_tipoPersona: 'PF', proprietario_nome: 'ANNA', proprietario_cognome: 'NERI',
        proprietario_ragioneSociale: '', proprietario_cf: 'NRANNA85D45H501W',
        proprietario_dataNascita: '1985-04-05',
        proprietario_provinciaNascita: 'RM', proprietario_comuneNascita: 'Roma',
        proprietario_codiceComuneNascita: '058091', proprietario_codiceProvinciaNascita: '058',
        proprietario_statoNascita: 'IT',
        proprietario_provinciaResidenza: 'RM', proprietario_comuneResidenza: 'Roma',
        proprietario_codiceComuneResidenza: '058091', proprietario_codiceProvinciaResidenza: '058',
        proprietario_indirizzoResidenza: 'Via Appia Nuova 500', proprietario_numeroCivicoResidenza: '500',
        proprietario_capResidenza: '00179', proprietario_telefono: '3465554433',
        proprietario_email: 'anna.neri@gmail.com',
        distinta_du: 'ASSENTE', distinta_cdc: 'ASSENTE', distinta_cdp: 'ASSENTE',
        distinta_foglioC: 'ASSENTE', distinta_targaDenuncia: true,
        distinta_documentoIntestatario: true, distinta_targaAnteriore: false, distinta_targaPosteriore: false,
        noteAggiuntive: 'Test caso 5 - Consegna Forze Ordine post furto, documenti assenti',
      }
    },
  ];

  const fillTestData = (dataset) => {
    // Garantisce che tutti i campi siano definiti (mai undefined)
    const cleanData = Object.keys(dataset.data).reduce((acc, key) => {
      acc[key] = dataset.data[key] === undefined ? '' : dataset.data[key];
      return acc;
    }, {});
    setFormData(prev => ({ ...prev, ...cleanData }));
    setShowTestMenu(false);
    
    // Carica comuni per le province selezionate nei dati di test
    if (cleanData.proprietario_provinciaNascita) {
      loadComuni(cleanData.proprietario_provinciaNascita, 'nascita-intestatario');
    }
    if (cleanData.proprietario_provinciaResidenza) {
      loadComuni(cleanData.proprietario_provinciaResidenza, 'residenza-intestatario');
    }
    if (cleanData.detentore_provinciaNascita) {
      loadComuni(cleanData.detentore_provinciaNascita, 'nascita-detentore');
    }
    if (cleanData.detentore_provinciaResidenza) {
      loadComuni(cleanData.detentore_provinciaResidenza, 'residenza-detentore');
    }
  };

  const isEdit = Boolean(id);

  useEffect(() => {
    // Carica sempre i dati di lookup (causali, province) all'avvio
    loadLookupData();
    
    if (isEdit) {
      loadCase();
    }
  }, [id, isEdit]);

  const loadCase = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

      if (error) throw error;

      // Sanitizza i dati dal DB: converte null/undefined in stringhe vuote
      const sanitized = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key] === null || data[key] === undefined ? '' : data[key];
        return acc;
      }, {});

      setFormData({
        ...sanitized,
        demolizione_data: data.demolizione_data ? data.demolizione_data.split('T')[0] : '',
        rvfu_documenti: data.rvfu_documenti || []
      });

      if (data.rvfu_documenti) {
        documentManager.setDocuments(data.rvfu_documenti);
      }
    } catch (error) {
      logger.error('Error loading case:', error);
      showError('Errore nel caricamento del caso');
    } finally {
      setLoading(false);
    }
  };

  const loadLookupData = async () => {
    try {
      const [causaliRes, provinceRes] = await Promise.all([
        supabase.from('rvfu_causali').select('*').eq('is_active', true).order('codice'),
        supabase.from('rvfu_province_istat').select('*').eq('is_active', true).order('denominazione')
      ]);

      if (causaliRes.data && causaliRes.data.length > 0) {
        setCausali(causaliRes.data);
      } else {
        // Fallback: usa causali di default se la tabella è vuota
        // (Non logghiamo warning perché il fallback funziona correttamente)
        setCausali([
          { codice: 'D', descrizione: 'Demolizione' },
          { codice: 'SD', descrizione: 'Demolizione (SD)' },
          { codice: 'PA', descrizione: 'Demolizione su provvedimento PA' },
          { codice: 'NN', descrizione: 'Veicoli non riconosciuti' }
        ]);
      }
      if (provinceRes.data) setProvince(provinceRes.data);
    } catch (error) {
      logger.error('Error loading lookup data:', error);
      // Fallback in caso di errore
      setCausali([
        { codice: 'D', descrizione: 'Demolizione' },
        { codice: 'SD', descrizione: 'Demolizione (SD)' },
        { codice: 'PA', descrizione: 'Demolizione su provvedimento PA' },
        { codice: 'NN', descrizione: 'Veicoli non riconosciuti' }
      ]);
    }
  };

  const loadComuni = async (siglaProvincia, type) => {
    if (!siglaProvincia) return;
    
    try {
      const { data, error } = await supabase
        .from('rvfu_comuni_istat')
        .select('*')
        .eq('sigla_provincia', siglaProvincia)
        .eq('is_active', true)
        .order('denominazione');
      
      if (error) throw error;
      
      if (type === 'nascita-intestatario') {
        setComuniNascitaIntestatario(data || []);
      } else if (type === 'residenza-intestatario') {
        setComuniResidenzaIntestatario(data || []);
      } else if (type === 'nascita-detentore') {
        setComuniNascitaDetentore(data || []);
      } else if (type === 'residenza-detentore') {
        setComuniResidenzaDetentore(data || []);
      }
    } catch (error) {
      // rvfu_comuni_istat potrebbe non esistere ancora in Supabase
      if (error?.code === 'PGRST205') {
        logger.warn('Table rvfu_comuni_istat not found - migration not applied yet');
      } else {
        logger.error('Error loading comuni:', error);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === undefined ? '' : value
    }));
    
    // Carica comuni quando cambia la provincia
    if (field === 'proprietario_provinciaNascita') {
      loadComuni(value, 'nascita-intestatario');
    } else if (field === 'proprietario_provinciaResidenza') {
      loadComuni(value, 'residenza-intestatario');
    } else if (field === 'detentore_provinciaNascita') {
      loadComuni(value, 'nascita-detentore');
    } else if (field === 'detentore_provinciaResidenza') {
      loadComuni(value, 'residenza-detentore');
    }
    
    // Aggiorna codice comune quando si seleziona un comune
    if (field.includes('comune') && !field.includes('codice')) {
      const comuniList = field.includes('nascita') && field.includes('intestatario') ? comuniNascitaIntestatario :
                        field.includes('residenza') && field.includes('intestatario') ? comuniResidenzaIntestatario :
                        field.includes('nascita') && field.includes('detentore') ? comuniNascitaDetentore :
                        comuniResidenzaDetentore;
      
      const comune = comuniList.find(c => c.denominazione === value);
      if (comune) {
        const codiceField = field.replace('comune', 'codiceComune');
        setFormData(prev => ({
          ...prev,
          [codiceField]: comune.codice_istat || comune.codice
        }));
      }
    }
  };

  const handleSearchVeicolo = async () => {
    if (isDemo) {
      alert("\u{1F512} Modalit\u00e0 Demo\n\nLa ricerca veicoli tramite API RVFU non \u00e8 disponibile in modalit\u00e0 demo.");
      return;
    }
    // Reset errori precedenti
    setSearchErrors({});

    // Se non autenticato RVFU, usa mock locale
    const useLocalMode = !isAuthenticated || !tokens;

    // Validazione campi obbligatori
    const errors = {};
    
    if (!searchParams.causale) {
      errors.causale = 'La causale è obbligatoria';
    }
    
    if (!searchParams.tipoVeicolo) {
      errors.tipoVeicolo = 'Il tipo veicolo è obbligatorio';
    }

    // Validazione: Targa O Telaio devono essere presenti (almeno uno)
    const hasTarga = searchParams.targa && searchParams.targa.trim().length > 0;
    const hasTelaio = searchParams.telaio && searchParams.telaio.trim().length > 0;
    
    if (!hasTarga && !hasTelaio) {
      errors.ricerca = 'Inserisci almeno la targa O il telaio';
    }

    // Validazione CF
    const cfTrimmed = searchParams.codiceFiscale?.trim() || '';
    const hasCF = cfTrimmed.length > 0;
    if (!hasTarga && !hasCF) {
      errors.codiceFiscale = 'Inserisci il codice fiscale se non specifichi la targa';
    }
    // Validazione formato CF: 16 alfanumerico (PF) o 11 cifre (PG/P.IVA)
    if (hasCF) {
      const cfUpper = cfTrimmed.toUpperCase();
      const isValidPF = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cfUpper);
      const isValidPG = /^\d{11}$/.test(cfUpper);
      if (!isValidPF && !isValidPG) {
        errors.codiceFiscale = 'Codice fiscale non valido. Deve essere 16 caratteri (persona fisica) o 11 cifre (P.IVA)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setSearchErrors(errors);
      // Mostra il primo errore
      const firstError = Object.values(errors)[0];
      showError(firstError);
      return;
    }

    setSearching(true);
    
    try {
      let veicolo;

      if (useLocalMode) {
        // Modalità locale: usa mock
        veicolo = await mockVerificaVeicolo({
          targa: searchParams.targa?.trim() || undefined,
          telaio: searchParams.telaio?.trim() || undefined,
          codiceFiscale: searchParams.codiceFiscale?.trim() || undefined,
        });
        if (veicolo) {
          showSuccess('Veicolo trovato (modalità locale)');
        }
      } else if (authService) {
        // Modalità RVFU: usa API reale
        const rvfuClient = createRVFUClient(authService, 'formation', true);
        veicolo = await rvfuClient.verificaVeicolo({
          causale: searchParams.causale,
          tipoVeicolo: searchParams.tipoVeicolo,
          codiceFiscale: searchParams.codiceFiscale?.trim() || undefined,
          targa: searchParams.targa?.trim() || undefined,
          telaio: searchParams.telaio?.trim() || undefined,
        });
        if (veicolo) {
          const cfFornito = searchParams.codiceFiscale?.trim();
          const intestatarioTrovato = veicolo.proprietario || veicolo.soggettoVeicolo;
          if (cfFornito && !intestatarioTrovato) {
            showInfo('Veicolo trovato, ma il CF inserito non corrisponde all\'intestatario. Compila i dati intestatario manualmente.');
          } else {
            showSuccess('Veicolo trovato!');
          }
        }
      } else {
        showError('Autenticazione RVFU richiesta per ricerca online.');
        return;
      }

      if (veicolo) {
        setVeicoliTrovati([veicolo]);
      } else {
        setVeicoliTrovati([]);
        showInfo('Nessun veicolo trovato');
      }
    } catch (error) {
      logger.error('Error searching veicolo:', error);
      showError(`Errore nella ricerca: ${error.message}`);
      setVeicoliTrovati([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectVeicolo = (veicolo) => {
    // Popola i campi del form con i dati del veicolo trovato
    const isPRA = veicolo.obbligoIscrizionePRA === 'S' || veicolo.obbligoIscrizionePraFlag === true;

    setFormData(prev => ({
      ...prev,
      // Dati veicolo
      targa: veicolo.targa || prev.targa,
      telaio: veicolo.telaio || prev.telaio,
      numero_telaio: veicolo.telaio || prev.numero_telaio,
      marca: veicolo.marca || prev.marca,
      modello: veicolo.modello || prev.modello,
      marca_modello: veicolo.marca_modello || `${veicolo.marca || ''} ${veicolo.modello || ''}`.trim() || prev.marca_modello,
      cilindrata: veicolo.cilindrata?.toString() || prev.cilindrata,
      potenza: veicolo.potenza?.toString() || prev.potenza,
      dataPrimaImmatricolazione: veicolo.dataPrimaImmatricolazione || veicolo.dataImmatricolazione || prev.dataPrimaImmatricolazione,
      tipoVeicolo: veicolo.tipoVeicolo || searchParams.tipoVeicolo || prev.tipoVeicolo,
      demolizione_causale: searchParams.causale || prev.demolizione_causale,
      cic: veicolo.cic || prev.cic,
      // Campo PRA
      obbligoIscrizionePRA: isPRA ? 'S' : 'N',
      canaleNoPra: !isPRA,
      // Dati intestatario (se disponibili dall'API — richiede codiceFiscale nella ricerca)
      proprietario_cf: veicolo.proprietario?.codiceFiscale || searchParams.codiceFiscale || prev.proprietario_cf,
      proprietario_nome: veicolo.proprietario?.nome || prev.proprietario_nome,
      proprietario_cognome: veicolo.proprietario?.cognome || prev.proprietario_cognome,
      proprietario_indirizzoResidenza: veicolo.proprietario?.indirizzo || prev.proprietario_indirizzoResidenza,
      proprietario_dataNascita: veicolo.proprietario?.dataNascita || prev.proprietario_dataNascita,
      proprietario_comuneNascita: veicolo.proprietario?.comuneNascita || prev.proprietario_comuneNascita,
      proprietario_provinciaNascita: veicolo.proprietario?.provinciaNascita || prev.proprietario_provinciaNascita,
    }));

    // Chiudi il modal di ricerca
    setShowSearchModal(false);
    
    // Messaggio informativo
    const hasIntestatario = !!veicolo.proprietario;
    let msg = `Dati veicolo caricati - ${isPRA ? 'Con obbligo PRA' : 'Senza obbligo PRA'}`;
    if (!hasIntestatario) {
      msg += '\n\nNota: dati intestatario non disponibili. Per ottenerli, ripeti la ricerca inserendo anche il Codice Fiscale.';
    }
    showSuccess(msg);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log('[RVFU] handleSubmit called, orgId:', orgId, 'isEdit:', isEdit);
    
    if (!orgId) {
      console.log('[RVFU] No org selected');
      showError('Organizzazione non selezionata');
      return;
    }

    // Controllo duplicati solo per nuovi casi
    if (!isEdit) {
      try {
        const searchConditions = [];
        if (formData.targa) searchConditions.push(`targa.eq.${formData.targa}`);
        if (formData.telaio || formData.numero_telaio) {
          searchConditions.push(`telaio.eq.${formData.telaio || formData.numero_telaio}`);
        }

        if (searchConditions.length > 0) {
          const { data: duplicates, error: dupError } = await supabase
            .from(TABLE)
            .select('id, targa, telaio')
            .eq('org_id', orgId)
            .or(searchConditions.join(','));

          if (dupError) {
            logger.error('Error checking duplicates:', dupError);
          } else if (duplicates && duplicates.length > 0) {
            const dupInfo = duplicates.map(d => {
              const matches = [];
              if (d.targa === formData.targa) matches.push('targa');
              if ((d.telaio === formData.telaio) || (d.telaio === formData.numero_telaio)) matches.push('telaio');
              return `Caso ${d.targa || d.telaio} (${matches.join(', ')})`;
            }).join('\n');

            if (!window.confirm(` Esistono già casi con dati simili:\n\n${dupInfo}\n\nProcedere comunque?`)) {
              return;
            }
          }
        }
      } catch (error) {
        logger.error('Error in duplicate check:', error);
      }
    }

    console.log('[RVFU] Starting save...');
    setSaving(true);
    try {
      // Mappa solo le colonne reali della tabella demolition_cases
      // I dati extra del form vanno nella colonna JSONB 'meta'
      const submitData = {
        org_id: orgId,
        targa: formData.targa || null,
        telaio: formData.telaio || formData.numero_telaio || null,
        marca_modello: formData.marca_modello || `${formData.marca || ''} ${formData.modello || ''}`.trim() || null,
        anno: formData.anno || null,
        note: formData.noteAggiuntive || formData.demolizione_osservazioni || null,
        is_local_only: !isAuthenticated,
        processing_status: 'accettazione',
        meta: {
          rvfu: {
            tipoVeicolo: formData.tipoVeicolo,
            colore: formData.colore,
            cilindrata: formData.cilindrata,
            potenza: formData.potenza,
            dataPrimaImmatricolazione: formData.dataPrimaImmatricolazione,
            flagConsegnaForzeOrdine: formData.flagConsegnaForzeOrdine,
            canaleNoPra: formData.canaleNoPra,
            cic: formData.cic,
            obbligoIscrizionePRA: formData.obbligoIscrizionePRA,
            causale: normalizeCausale(formData.demolizione_causale),
            km: formData.demolizione_km,
            osservazioni: formData.demolizione_osservazioni,
            noteAggiuntive: formData.noteAggiuntive,
            notePartiRifiuti: formData.notePartiRifiuti,
          },
          owner: {
            tipo: formData.proprietario_tipoPersona,
            name: formData.proprietario_tipoPersona === 'PF'
              ? `${formData.proprietario_nome || ''} ${formData.proprietario_cognome || ''}`.trim()
              : formData.proprietario_ragioneSociale,
            cf: formData.proprietario_cf,
            birth_date: formData.proprietario_dataNascita,
            birth_place: formData.proprietario_comuneNascita,
            birth_province: formData.proprietario_provinciaNascita,
            residence_address: formData.proprietario_indirizzoResidenza,
            residence_civic: formData.proprietario_numeroCivicoResidenza,
            residence_city: formData.proprietario_comuneResidenza,
            residence_province: formData.proprietario_provinciaResidenza,
            residence_cap: formData.proprietario_capResidenza,
            phone: formData.proprietario_telefono,
            email: formData.proprietario_email,
          },
          intestatario: {
            codiceFiscale: formData.proprietario_cf,
            nome: formData.proprietario_nome,
            cognome: formData.proprietario_cognome,
            ragioneSociale: formData.proprietario_ragioneSociale,
            tipoPersonaGiuridica: formData.proprietario_tipoPersona,
            dataNascita: formData.proprietario_dataNascita,
            codiceComuneNascita: formData.proprietario_codiceComuneNascita,
            codiceProvinciaNascita: formData.proprietario_codiceProvinciaNascita,
            comuneNascita: formData.proprietario_comuneNascita,
            provinciaNascita: formData.proprietario_provinciaNascita,
            statoNascita: formData.proprietario_statoNascita,
            codiceStatoEsteroNascita: formData.proprietario_codiceStatoEsteroNascita,
            localitaEsteraNascita: formData.proprietario_localitaEsteraNascita,
            codiceComuneResidenza: formData.proprietario_codiceComuneResidenza,
            codiceProvinciaResidenza: formData.proprietario_codiceProvinciaResidenza,
            comuneResidenza: formData.proprietario_comuneResidenza,
            provinciaResidenza: formData.proprietario_provinciaResidenza,
            indirizzoResidenza: formData.proprietario_indirizzoResidenza,
            numeroCivicoResidenza: formData.proprietario_numeroCivicoResidenza,
            capResidenza: formData.proprietario_capResidenza,
            dugResidenza: formData.proprietario_dugResidenza,
            toponimoResidenza: formData.proprietario_toponimoResidenza,
            statoResidenza: formData.proprietario_statoResidenza,
            codiceStatoEsteroResidenza: formData.proprietario_codiceStatoEsteroResidenza,
            localitaEsteraResidenza: formData.proprietario_localitaEsteraResidenza,
          },
          detentore: formData.showDetentore ? {
            tipo: formData.detentore_tipoPersona,
            name: formData.detentore_tipoPersona === 'PF'
              ? `${formData.detentore_nome || ''} ${formData.detentore_cognome || ''}`.trim()
              : formData.detentore_ragioneSociale,
            cf: formData.detentore_cf,
            birth_date: formData.detentore_dataNascita,
            birth_place: formData.detentore_comuneNascita,
            birth_province: formData.detentore_provinciaNascita,
            residence_address: formData.detentore_indirizzoResidenza,
            residence_civic: formData.detentore_numeroCivicoResidenza,
            residence_city: formData.detentore_comuneResidenza,
            residence_province: formData.detentore_provinciaResidenza,
            residence_cap: formData.detentore_capResidenza,
          } : null,
          distinta: {
            du: formData.distinta_du,
            cdc: formData.distinta_cdc,
            cdp: formData.distinta_cdp,
            foglioC: formData.distinta_foglioC,
            documentoIntestatario: formData.distinta_documentoIntestatario,
            documentoDetentore: formData.distinta_documentoDetentore,
            targaAnteriore: formData.distinta_targaAnteriore,
            targaPosteriore: formData.distinta_targaPosteriore,
            targaDenuncia: formData.distinta_targaDenuncia,
            altro: formData.distinta_altro,
          },
          documenti: documentManager.documents,
        },
      };

      if (isEdit) {
        const { error } = await supabase
          .from(TABLE)
          .update(submitData)
          .eq('id', id)
          .eq('org_id', orgId);

        if (error) {
          console.error('[RVFU] Update error:', error);
          throw error;
        }
        showSuccess('Caso RVFU aggiornato con successo');
      } else {
        const { error } = await supabase
          .from(TABLE)
          .insert(submitData);

        if (error) {
          console.error('[RVFU] Insert error:', error);
          throw error;
        }
        showSuccess('Caso RVFU creato con successo');
      }

      navigate('/demolizioni-rvfu');
    } catch (error) {
      console.error('[RVFU] Save error:', error);
      logger.error('Error saving case:', error);
      showError(`Errore nel salvataggio: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Il form principale viene sempre mostrato
  // La ricerca veicolo è disponibile tramite modal

  return (
    <div className="space-y-4">
      {/* Header compatto */}
      <div className="bg-[#1a2536] border-b border-[#243044]">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/demolizioni-rvfu')}
                className="p-2 text-slate-300 hover:text-white hover:bg-[#141c27] rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#1a2536]/5 rounded-lg">
                  <FiShield className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-white">
                  {isEdit ? 'Modifica Caso RVFU' : 'Nuovo Caso RVFU'}
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setShowSearchModal(true)}
                  className="px-3 py-1.5 text-slate-300 bg-[#1a2536] border border-[#243044] hover:bg-[#1e2b3d] rounded-lg text-sm transition-colors"
                >
                  <FiSearch className="w-4 h-4 inline mr-1" />
                  Cerca Veicolo
                </button>
              )}
              {!isEdit && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTestMenu(!showTestMenu)}
                    className="px-3 py-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg text-sm transition-colors"
                  >
                    <FiAlertCircle className="w-4 h-4 inline mr-1" />
                    Dati Test
                  </button>
                  {showTestMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowTestMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-[#1a2536] border border-[#243044] rounded-lg shadow-xl overflow-hidden">
                        <div className="px-3 py-2 border-b border-[#243044] text-xs text-slate-500 uppercase tracking-wide">
                          Seleziona dati di test
                        </div>
                        {TEST_DATASETS.map((ds, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => fillTestData(ds)}
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-blue-500/10 hover:text-blue-400 transition-colors border-b border-[#243044]/50 last:border-b-0"
                          >
                            {ds.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => navigate('/demolizioni-rvfu')}
                className="px-3 py-1.5 text-slate-300 bg-[#1a2536] border border-[#243044] hover:bg-[#1e2b3d] rounded-lg text-sm transition-colors"
              >
                Annulla
              </button>
              <LoadingButton
                onClick={handleSubmit}
                loading={saving}
                className="px-4 py-1.5 bg-[#1a2536] text-blue-400 rounded-lg hover:bg-blue-500/10 text-sm transition-colors font-medium"
              >
                <FiCheck className="w-3 h-3 mr-1" />
                {isEdit ? 'Salva' : 'Crea'}
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>

      {/* Form compatto */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <form id="rvfu-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Card principale */}
          <div className="bg-[#1a2536]/90 backdrop-blur-sm rounded-2xl shadow-xl border border-[#243044] p-6">
            
            {/* Veicolo */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiTruck className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Dati Veicolo</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Targa *</label>
                  <input
                    type="text"
                    value={formData.targa || ''}
                    onChange={(e) => handleInputChange('targa', e.target.value.toUpperCase())}
                    placeholder="AB123CD"
                    maxLength={7}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Telaio *</label>
                  <input
                    type="text"
                    value={formData.telaio || formData.numero_telaio || ''}
                    onChange={(e) => {
                      handleInputChange('telaio', e.target.value.toUpperCase());
                      handleInputChange('numero_telaio', e.target.value.toUpperCase());
                    }}
                    placeholder="ZFA223..."
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tipo Veicolo *</label>
                  <select
                    value={formData.tipoVeicolo || ''}
                    onChange={(e) => handleInputChange('tipoVeicolo', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  >
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
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Marca *</label>
                  <input
                    type="text"
                    value={formData.marca || ''}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    placeholder="FIAT"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modello *</label>
                  <input
                    type="text"
                    value={formData.modello || ''}
                    onChange={(e) => handleInputChange('modello', e.target.value)}
                    placeholder="Panda"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Anno</label>
                  <input
                    type="number"
                    value={formData.anno || ''}
                    onChange={(e) => handleInputChange('anno', e.target.value)}
                    placeholder="2015"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Colore</label>
                  <input
                    type="text"
                    value={formData.colore || ''}
                    onChange={(e) => handleInputChange('colore', e.target.value)}
                    placeholder="Bianco"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cilindrata (cc)</label>
                  <input
                    type="number"
                    value={formData.cilindrata || ''}
                    onChange={(e) => handleInputChange('cilindrata', e.target.value)}
                    placeholder="1400"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Potenza (kW)</label>
                  <input
                    type="number"
                    value={formData.potenza || ''}
                    onChange={(e) => handleInputChange('potenza', e.target.value)}
                    placeholder="75"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Data Prima Immatricolazione</label>
                  <input
                    type="date"
                    value={formData.dataPrimaImmatricolazione || ''}
                    onChange={(e) => handleInputChange('dataPrimaImmatricolazione', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Flag Consegna Forze Ordine *</label>
                  <select
                    value={formData.flagConsegnaForzeOrdine || ''}
                    onChange={(e) => handleInputChange('flagConsegnaForzeOrdine', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  >
                    <option value="N">No</option>
                    <option value="S">Sì</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="canaleNoPra"
                    checked={formData.canaleNoPra}
                    onChange={(e) => handleInputChange('canaleNoPra', e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded bg-[#1a2536]"
                  />
                  <label htmlFor="canaleNoPra" className="ml-2 block text-xs text-slate-400">
                    Canale No PRA
                  </label>
                </div>
                {/* CIC visibile solo per ciclomotori o se valore presente */}
                {(formData.tipoVeicolo === 'C' || formData.cic) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">CIC <span className="text-slate-500">(Ciclomotori)</span></label>
                    <input
                      type="text"
                      value={formData.cic || ''}
                      onChange={(e) => handleInputChange('cic', e.target.value)}
                      placeholder="Codice identificativo ciclomotore"
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Intestatario/Proprietario */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Dati Intestatario</h2>
              </div>
              
              {/* Tipo Persona */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-2">Tipo Persona *</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="proprietario_tipoPersona"
                      value="PF"
                      checked={formData.proprietario_tipoPersona === 'PF'}
                      onChange={(e) => handleInputChange('proprietario_tipoPersona', e.target.value)}
                      className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] bg-[#1a2536]"
                      required
                    />
                    <span className="ml-2 text-sm text-slate-400">Persona Fisica</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="proprietario_tipoPersona"
                      value="PG"
                      checked={formData.proprietario_tipoPersona === 'PG'}
                      onChange={(e) => handleInputChange('proprietario_tipoPersona', e.target.value)}
                      className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] bg-[#1a2536]"
                    />
                    <span className="ml-2 text-sm text-slate-400">Persona Giuridica</span>
                  </label>
                </div>
              </div>

              {/* Dati Persona Fisica o Giuridica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {formData.proprietario_tipoPersona === 'PF' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={formData.proprietario_nome || ''}
                        onChange={(e) => handleInputChange('proprietario_nome', e.target.value)}
                        placeholder="Mario"
                        className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Cognome *</label>
                      <input
                        type="text"
                        value={formData.proprietario_cognome || ''}
                        onChange={(e) => handleInputChange('proprietario_cognome', e.target.value)}
                        placeholder="Rossi"
                        className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Ragione Sociale *</label>
                    <input
                      type="text"
                      value={formData.proprietario_ragioneSociale || ''}
                      onChange={(e) => handleInputChange('proprietario_ragioneSociale', e.target.value)}
                      placeholder="Azienda S.r.l."
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Codice Fiscale *</label>
                  <input
                    type="text"
                    value={formData.proprietario_cf || ''}
                    onChange={(e) => handleInputChange('proprietario_cf', e.target.value.toUpperCase())}
                    placeholder="RSSMRA80A01H501U"
                    maxLength={16}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  />
                </div>
                {formData.proprietario_tipoPersona === 'PF' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Data di Nascita</label>
                    <input
                      type="date"
                      value={formData.proprietario_dataNascita || ''}
                      onChange={(e) => handleInputChange('proprietario_dataNascita', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Luogo di Nascita (solo PF) */}
              {formData.proprietario_tipoPersona === 'PF' && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-slate-500 mb-3">Luogo di Nascita</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Provincia Nascita</label>
                      <select
                        value={formData.proprietario_provinciaNascita || ''}
                        onChange={(e) => handleInputChange('proprietario_provinciaNascita', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                      >
                        <option value="">Seleziona</option>
                        {province.map((prov) => (
                          <option key={prov.sigla} value={prov.sigla}>
                            {prov.denominazione || prov.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Comune Nascita</label>
                      <select
                        value={formData.proprietario_codiceComuneNascita || ''}
                        onChange={(e) => {
                          const comune = comuniNascitaIntestatario.find(c => c.codice_istat === e.target.value || c.codice === e.target.value);
                          handleInputChange('proprietario_codiceComuneNascita', e.target.value);
                          if (comune) {
                            handleInputChange('proprietario_comuneNascita', comune.denominazione);
                            handleInputChange('proprietario_codiceProvinciaNascita', comune.sigla_provincia);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        disabled={!formData.proprietario_provinciaNascita}
                      >
                        <option value="">Seleziona comune</option>
                        {comuniNascitaIntestatario.map((comune) => (
                          <option key={comune.codice_istat || comune.codice} value={comune.codice_istat || comune.codice}>
                            {comune.denominazione}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Residenza */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-500 mb-3">Residenza *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Provincia Residenza *</label>
                    <select
                      value={formData.proprietario_provinciaResidenza || ''}
                      onChange={(e) => handleInputChange('proprietario_provinciaResidenza', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                      required
                    >
                      <option value="">Seleziona</option>
                      {province.map((prov) => (
                        <option key={prov.sigla} value={prov.sigla}>
                          {prov.denominazione || prov.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Comune Residenza *</label>
                    <select
                      value={formData.proprietario_codiceComuneResidenza || ''}
                      onChange={(e) => {
                        const comune = comuniResidenzaIntestatario.find(c => c.codice_istat === e.target.value || c.codice === e.target.value);
                        handleInputChange('proprietario_codiceComuneResidenza', e.target.value);
                        if (comune) {
                          handleInputChange('proprietario_comuneResidenza', comune.denominazione);
                          handleInputChange('proprietario_codiceProvinciaResidenza', comune.sigla_provincia);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                      disabled={!formData.proprietario_provinciaResidenza}
                      required
                    >
                      <option value="">Seleziona comune</option>
                      {comuniResidenzaIntestatario.map((comune) => (
                        <option key={comune.codice_istat || comune.codice} value={comune.codice_istat || comune.codice}>
                          {comune.denominazione}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Indirizzo Residenza *</label>
                    <input
                      type="text"
                      value={formData.proprietario_indirizzoResidenza || formData.proprietario_indirizzo || ''}
                      onChange={(e) => {
                        handleInputChange('proprietario_indirizzoResidenza', e.target.value);
                        handleInputChange('proprietario_indirizzo', e.target.value);
                      }}
                      placeholder="Via Roma"
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Numero Civico</label>
                    <input
                      type="text"
                      value={formData.proprietario_numeroCivicoResidenza || ''}
                      onChange={(e) => handleInputChange('proprietario_numeroCivicoResidenza', e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">CAP Residenza *</label>
                    <input
                      type="text"
                      value={formData.proprietario_capResidenza || formData.proprietario_cap || ''}
                      onChange={(e) => {
                        handleInputChange('proprietario_capResidenza', e.target.value);
                        handleInputChange('proprietario_cap', e.target.value);
                      }}
                      placeholder="00100"
                      maxLength={5}
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">DUG</label>
                    <input
                      type="text"
                      value={formData.proprietario_dugResidenza || ''}
                      onChange={(e) => handleInputChange('proprietario_dugResidenza', e.target.value)}
                      placeholder="Via, Viale, Piazza, ecc."
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Toponimo</label>
                    <input
                      type="text"
                      value={formData.proprietario_toponimoResidenza || ''}
                      onChange={(e) => handleInputChange('proprietario_toponimoResidenza', e.target.value)}
                      placeholder="Toponimo"
                      className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Contatti */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={formData.proprietario_telefono || ''}
                    onChange={(e) => handleInputChange('proprietario_telefono', e.target.value)}
                    placeholder="06 1234567"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.proprietario_email || ''}
                    onChange={(e) => handleInputChange('proprietario_email', e.target.value)}
                    placeholder="mario.rossi@email.com"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Demolizione */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiCalendar className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Dati Demolizione</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Data Demolizione *</label>
                  <input
                    type="date"
                    value={formData.demolizione_data || ''}
                    onChange={(e) => handleInputChange('demolizione_data', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Causale *</label>
                  <select
                    value={formData.demolizione_causale || ''}
                    onChange={(e) => handleInputChange('demolizione_causale', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  >
                    <option value="">Seleziona</option>
                    {causali.map((causale) => (
                      <option key={causale.codice} value={causale.codice}>
                        {causale.descrizione}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Chilometraggio</label>
                  <input
                    type="number"
                    value={formData.demolizione_km || ''}
                    onChange={(e) => handleInputChange('demolizione_km', e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Osservazioni</label>
                <textarea
                  value={formData.demolizione_osservazioni || ''}
                  onChange={(e) => handleInputChange('demolizione_osservazioni', e.target.value)}
                  rows={2}
                  placeholder="Note aggiuntive sul veicolo..."
                  className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Detentore (Opzionale) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Dati Detentore (Opzionale)</h2>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showDetentore}
                    onChange={(e) => handleInputChange('showDetentore', e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded bg-[#1a2536]"
                  />
                  <span className="ml-2 text-sm text-slate-400">Aggiungi Detentore</span>
                </label>
              </div>

              {formData.showDetentore && (
                <>
                  {/* Tipo Persona Detentore */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-400 mb-2">Tipo Persona</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="detentore_tipoPersona"
                          value="PF"
                          checked={formData.detentore_tipoPersona === 'PF'}
                          onChange={(e) => handleInputChange('detentore_tipoPersona', e.target.value)}
                          className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] bg-[#1a2536]"
                        />
                        <span className="ml-2 text-sm text-slate-400">Persona Fisica</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="detentore_tipoPersona"
                          value="PG"
                          checked={formData.detentore_tipoPersona === 'PG'}
                          onChange={(e) => handleInputChange('detentore_tipoPersona', e.target.value)}
                          className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] bg-[#1a2536]"
                        />
                        <span className="ml-2 text-sm text-slate-400">Persona Giuridica</span>
                      </label>
                    </div>
                  </div>

                  {/* Dati Detentore */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {formData.detentore_tipoPersona === 'PF' ? (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
                          <input
                            type="text"
                            value={formData.detentore_nome || ''}
                            onChange={(e) => handleInputChange('detentore_nome', e.target.value)}
                            placeholder="Nome"
                            className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Cognome</label>
                          <input
                            type="text"
                            value={formData.detentore_cognome || ''}
                            onChange={(e) => handleInputChange('detentore_cognome', e.target.value)}
                            placeholder="Cognome"
                            className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Ragione Sociale</label>
                        <input
                          type="text"
                          value={formData.detentore_ragioneSociale || ''}
                          onChange={(e) => handleInputChange('detentore_ragioneSociale', e.target.value)}
                          placeholder="Azienda S.r.l."
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Codice Fiscale</label>
                      <input
                        type="text"
                        value={formData.detentore_cf || ''}
                        onChange={(e) => handleInputChange('detentore_cf', e.target.value.toUpperCase())}
                        placeholder="Codice Fiscale"
                        maxLength={16}
                        className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                      />
                    </div>
                    {formData.detentore_tipoPersona === 'PF' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Data di Nascita</label>
                        <input
                          type="date"
                          value={formData.detentore_dataNascita || ''}
                          onChange={(e) => handleInputChange('detentore_dataNascita', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Luogo di Nascita Detentore (solo PF) */}
                  {formData.detentore_tipoPersona === 'PF' && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-slate-500 mb-3">Luogo di Nascita</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Provincia Nascita</label>
                          <select
                            value={formData.detentore_provinciaNascita || ''}
                            onChange={(e) => handleInputChange('detentore_provinciaNascita', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                          >
                            <option value="">Seleziona</option>
                            {province.map((prov) => (
                              <option key={prov.sigla} value={prov.sigla}>
                                {prov.denominazione || prov.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Comune Nascita</label>
                          <select
                            value={formData.detentore_codiceComuneNascita || ''}
                            onChange={(e) => {
                              const comune = comuniNascitaDetentore.find(c => c.codice_istat === e.target.value || c.codice === e.target.value);
                              handleInputChange('detentore_codiceComuneNascita', e.target.value);
                              if (comune) {
                                handleInputChange('detentore_comuneNascita', comune.denominazione);
                                handleInputChange('detentore_codiceProvinciaNascita', comune.sigla_provincia);
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                            disabled={!formData.detentore_provinciaNascita}
                          >
                            <option value="">Seleziona comune</option>
                            {comuniNascitaDetentore.map((comune) => (
                              <option key={comune.codice_istat || comune.codice} value={comune.codice_istat || comune.codice}>
                                {comune.denominazione}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Residenza Detentore */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-slate-500 mb-3">Residenza</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Provincia Residenza</label>
                        <select
                          value={formData.detentore_provinciaResidenza || ''}
                          onChange={(e) => handleInputChange('detentore_provinciaResidenza', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        >
                          <option value="">Seleziona</option>
                          {province.map((prov) => (
                            <option key={prov.sigla} value={prov.sigla}>
                              {prov.denominazione || prov.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Comune Residenza</label>
                        <select
                          value={formData.detentore_codiceComuneResidenza || ''}
                          onChange={(e) => {
                            const comune = comuniResidenzaDetentore.find(c => c.codice_istat === e.target.value || c.codice === e.target.value);
                            handleInputChange('detentore_codiceComuneResidenza', e.target.value);
                            if (comune) {
                              handleInputChange('detentore_comuneResidenza', comune.denominazione);
                              handleInputChange('detentore_codiceProvinciaResidenza', comune.sigla_provincia);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                          disabled={!formData.detentore_provinciaResidenza}
                        >
                          <option value="">Seleziona comune</option>
                          {comuniResidenzaDetentore.map((comune) => (
                            <option key={comune.codice_istat || comune.codice} value={comune.codice_istat || comune.codice}>
                              {comune.denominazione}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">Indirizzo Residenza</label>
                        <input
                          type="text"
                          value={formData.detentore_indirizzoResidenza}
                          onChange={(e) => handleInputChange('detentore_indirizzoResidenza', e.target.value)}
                          placeholder="Via Roma"
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Numero Civico</label>
                        <input
                          type="text"
                          value={formData.detentore_numeroCivicoResidenza}
                          onChange={(e) => handleInputChange('detentore_numeroCivicoResidenza', e.target.value)}
                          placeholder="123"
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">CAP Residenza</label>
                        <input
                          type="text"
                          value={formData.detentore_capResidenza}
                          onChange={(e) => handleInputChange('detentore_capResidenza', e.target.value)}
                          placeholder="00100"
                          maxLength={5}
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">DUG</label>
                        <input
                          type="text"
                          value={formData.detentore_dugResidenza}
                          onChange={(e) => handleInputChange('detentore_dugResidenza', e.target.value)}
                          placeholder="Via, Viale, Piazza, ecc."
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Toponimo</label>
                        <input
                          type="text"
                          value={formData.detentore_toponimoResidenza}
                          onChange={(e) => handleInputChange('detentore_toponimoResidenza', e.target.value)}
                          placeholder="Toponimo"
                          className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Distinta Documenti */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiFileText className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Distinta Documenti</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">DU (Documento Unico) *</label>
                  <select
                    value={formData.distinta_du}
                    onChange={(e) => handleInputChange('distinta_du', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  >
                    <option value="ASSENTE">Assente</option>
                    <option value="DENUNCIA">Denuncia</option>
                    <option value="DOCUMENTO">Documento</option>
                    <option value="VERBALE">Verbale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CDC (Carta di Circolazione) *</label>
                  <select
                    value={formData.distinta_cdc}
                    onChange={(e) => handleInputChange('distinta_cdc', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  >
                    <option value="ASSENTE">Assente</option>
                    <option value="DENUNCIA">Denuncia</option>
                    <option value="DOCUMENTO">Documento</option>
                    <option value="VERBALE">Verbale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CDP (Carta di Proprietà) *</label>
                  <select
                    value={formData.distinta_cdp}
                    onChange={(e) => handleInputChange('distinta_cdp', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  >
                    <option value="ASSENTE">Assente</option>
                    <option value="DENUNCIA">Denuncia</option>
                    <option value="DOCUMENTO">Documento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Foglio C *</label>
                  <select
                    value={formData.distinta_foglioC}
                    onChange={(e) => handleInputChange('distinta_foglioC', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    required
                  >
                    <option value="ASSENTE">Assente</option>
                    <option value="DENUNCIA">Denuncia</option>
                    <option value="DOCUMENTO">Documento</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="distinta_documentoIntestatario"
                    checked={formData.distinta_documentoIntestatario}
                    onChange={(e) => handleInputChange('distinta_documentoIntestatario', e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded bg-[#1a2536]"
                    required
                  />
                  <label htmlFor="distinta_documentoIntestatario" className="ml-2 block text-xs text-slate-400">
                    Documento Intestatario *
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="distinta_documentoDetentore"
                    checked={formData.distinta_documentoDetentore}
                    onChange={(e) => handleInputChange('distinta_documentoDetentore', e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded bg-[#1a2536]"
                    required
                  />
                  <label htmlFor="distinta_documentoDetentore" className="ml-2 block text-xs text-slate-400">
                    Documento Detentore *
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="distinta_targaAnteriore"
                    checked={formData.distinta_targaAnteriore}
                    onChange={(e) => handleInputChange('distinta_targaAnteriore', e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded bg-[#1a2536]"
                    required
                  />
                  <label htmlFor="distinta_targaAnteriore" className="ml-2 block text-xs text-slate-400">
                    Targa Anteriore *
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="distinta_targaPosteriore"
                    checked={formData.distinta_targaPosteriore}
                    onChange={(e) => handleInputChange('distinta_targaPosteriore', e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded bg-[#1a2536]"
                    required
                  />
                  <label htmlFor="distinta_targaPosteriore" className="ml-2 block text-xs text-slate-400">
                    Targa Posteriore *
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="distinta_targaDenuncia"
                    checked={formData.distinta_targaDenuncia}
                    onChange={(e) => handleInputChange('distinta_targaDenuncia', e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500/40/40 border-[#243044] rounded bg-[#1a2536]"
                    required
                  />
                  <label htmlFor="distinta_targaDenuncia" className="ml-2 block text-xs text-slate-400">
                    Targa Denuncia *
                  </label>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Altro</label>
                <input
                  type="text"
                  value={formData.distinta_altro}
                  onChange={(e) => handleInputChange('distinta_altro', e.target.value)}
                  placeholder="Altri documenti..."
                  className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                />
              </div>
            </div>

            {/* Note */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiFileText className="w-4 h-4 text-yellow-600" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Note</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Note Aggiuntive</label>
                  <textarea
                    value={formData.noteAggiuntive}
                    onChange={(e) => handleInputChange('noteAggiuntive', e.target.value)}
                    rows={3}
                    placeholder="Note aggiuntive..."
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Note Parti Rifiuti</label>
                  <textarea
                    value={formData.notePartiRifiuti}
                    onChange={(e) => handleInputChange('notePartiRifiuti', e.target.value)}
                    rows={3}
                    placeholder="Note sulle parti rifiuti..."
                    className="w-full px-3 py-2 text-sm border border-[#243044] rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Documenti (solo in modalità edit) */}
            {isEdit && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FiFileText className="w-4 h-4 text-orange-600" />
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Documenti</h2>
                </div>
                <DocumentManager />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Modal Ricerca Veicolo */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSearchModal(false)}>
          <div className="bg-[#1a2536] rounded-2xl  border border-[#243044] w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="sticky top-0 bg-[#1a2536] border border-[#243044] p-4 rounded-t-xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <FiSearch className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Cerca Veicolo</h2>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-2 text-slate-300 hover:text-white hover:bg-[#141c27] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Contenuto Modal - Usa lo stesso codice della ricerca esistente ma con ID diversi */}
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-slate-500">Inserisci la targa per trovare il veicolo (CF opzionale per test)</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const testTarghe = ['VA054AJ', 'VA056AJ', 'VA058AJ', 'VA060AJ', 'VA062AJ', 'VA064AJ', 'VA066AJ'];
                      const randomTarga = testTarghe[Math.floor(Math.random() * testTarghe.length)];
                      setSearchParams({
                        codiceFiscale: '',
                        targa: randomTarga,
                        telaio: '',
                        tipoVeicolo: 'A',
                        causale: 'D'
                      });
                      setSearchErrors({});
                    }}
                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                     Targa Test Random
                  </button>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setSearchParams({
                          codiceFiscale: '',
                          targa: e.target.value,
                          telaio: '',
                          tipoVeicolo: 'A',
                          causale: 'D'
                        });
                        setSearchErrors({});
                        e.target.value = '';
                      }
                    }}
                    className="px-2 py-1.5 text-xs bg-[#1a2536] text-white rounded-lg border border-[#243044] hover:border-indigo-500 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors"
                    defaultValue=""
                  >
                    <option value="">Seleziona targa test...</option>
                    <option value="VA054AJ">VA054AJ</option>
                    <option value="VA056AJ">VA056AJ</option>
                    <option value="VA058AJ">VA058AJ</option>
                    <option value="VA060AJ">VA060AJ</option>
                    <option value="VA062AJ">VA062AJ</option>
                    <option value="VA064AJ">VA064AJ</option>
                    <option value="VA066AJ">VA066AJ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="modal-search-cf" className="block text-xs font-medium text-slate-400 mb-1">
                    Codice Fiscale <span className="text-slate-500">(opzionale se hai la targa)</span>
                  </label>
                  <input
                    id="modal-search-cf"
                    type="text"
                    value={searchParams.codiceFiscale}
                    onChange={(e) => {
                      setSearchParams(prev => ({ ...prev, codiceFiscale: e.target.value.toUpperCase() }));
                      setSearchErrors(prev => ({ ...prev, codiceFiscale: undefined }));
                    }}
                    placeholder="RSSMRA80A01H501U"
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors ${
                      searchErrors.codiceFiscale ? 'border-red-500' : 'border-[#243044]'
                    }`}
                  />
                  {searchErrors.codiceFiscale && (
                    <p className="text-xs text-red-400 mt-1">{searchErrors.codiceFiscale}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-search-targa" className="block text-xs font-medium text-slate-400 mb-1">
                    Targa <span className="text-red-400">*</span> <span className="text-slate-500">(oppure telaio)</span>
                  </label>
                  <input
                    id="modal-search-targa"
                    type="text"
                    value={searchParams.targa}
                    onChange={(e) => {
                      setSearchParams(prev => ({ ...prev, targa: e.target.value.toUpperCase() }));
                      setSearchErrors(prev => ({ ...prev, ricerca: undefined, codiceFiscale: undefined }));
                    }}
                    placeholder="AB123CD"
                    maxLength={7}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors ${
                      searchErrors.ricerca ? 'border-red-500' : 'border-[#243044]'
                    }`}
                  />
                  {searchErrors.ricerca && (
                    <p className="text-xs text-red-400 mt-1">{searchErrors.ricerca}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-search-telaio" className="block text-xs font-medium text-slate-400 mb-1">
                    Telaio <span className="text-slate-500">(oppure targa)</span>
                  </label>
                  <input
                    id="modal-search-telaio"
                    type="text"
                    value={searchParams.telaio}
                    onChange={(e) => {
                      setSearchParams(prev => ({ ...prev, telaio: e.target.value.toUpperCase() }));
                      setSearchErrors(prev => ({ ...prev, ricerca: undefined }));
                    }}
                    placeholder="ZFA223..."
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-[#1a2536] text-white placeholder-slate-600 focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors ${
                      searchErrors.ricerca ? 'border-red-500' : 'border-[#243044]'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="modal-search-tipo" className="block text-xs font-medium text-slate-400 mb-1">
                    Tipo Veicolo <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="modal-search-tipo"
                    value={searchParams.tipoVeicolo}
                    onChange={(e) => {
                      setSearchParams(prev => ({ ...prev, tipoVeicolo: e.target.value }));
                      setSearchErrors(prev => ({ ...prev, tipoVeicolo: undefined }));
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors ${
                      searchErrors.tipoVeicolo ? 'border-red-500' : 'border-[#243044]'
                    }`}
                    required
                  >
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
                  {searchErrors.tipoVeicolo && (
                    <p className="text-xs text-red-400 mt-1">{searchErrors.tipoVeicolo}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="modal-search-causale" className="block text-xs font-medium text-slate-400 mb-1">
                    Causale Demolizione <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="modal-search-causale"
                    value={searchParams.causale}
                    onChange={(e) => {
                      setSearchParams(prev => ({ ...prev, causale: e.target.value }));
                      setSearchErrors(prev => ({ ...prev, causale: undefined }));
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-[#1a2536] text-white focus:ring-1 focus:ring-blue-500/40 outline-none/40/40 focus:border-blue-500/40 transition-colors ${
                      searchErrors.causale ? 'border-red-500' : 'border-[#243044]'
                    }`}
                    required
                    disabled={causali.length === 0}
                  >
                    <option value="">
                      {causali.length === 0 ? 'Caricamento causali...' : 'Seleziona'}
                    </option>
                    {causali.map((causale) => (
                      <option key={causale.codice} value={causale.codice}>
                        {causale.descrizione || causale.codice}
                      </option>
                    ))}
                  </select>
                  {searchErrors.causale && (
                    <p className="text-xs text-red-400 mt-1">{searchErrors.causale}</p>
                  )}
                </div>
              </div>

              {/* Messaggi errore */}
              {searchErrors.ricerca && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg">
                  <p className="text-sm text-red-400">{searchErrors.ricerca}</p>
                </div>
              )}
              {searchErrors.auth && (
                <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500 rounded-lg">
                  <p className="text-sm text-yellow-400">{searchErrors.auth}</p>
                </div>
              )}

              <div className="flex gap-3 items-center mb-6">
                <LoadingButton
                  onClick={handleSearchVeicolo}
                  loading={searching}
                  disabled={false}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSearch className="w-4 h-4 mr-2 inline" />
                  Cerca
                </LoadingButton>
                {!isAuthenticated && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">Modalità locale — dati simulati</span>
                )}
              </div>

              {/* Risultati ricerca */}
              {veicoliTrovati.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">Veicolo Trovato</h3>
                  <div className="space-y-3">
                    {veicoliTrovati.map((veicolo, index) => {
                      const hasOstativi = veicolo.vincoloOstativo || 
                                         (veicolo.ostativiEForzature && veicolo.ostativiEForzature.length > 0) ||
                                         veicolo.radiabileFlag === false;
                      const isRadiabile = veicolo.radiabileFlag === true || veicolo.radiabile === 'S';
                      const isPRA = veicolo.obbligoIscrizionePRA === 'S' || veicolo.obbligoIscrizionePraFlag === true;
                      const displayModello = veicolo.marca_modello || `${veicolo.marca || ''} ${veicolo.modello || ''}`.trim();
                      
                      return (
                        <div
                          key={index}
                          className="bg-[#0f1923] rounded-lg p-4 border border-[#243044] hover:border-indigo-500 transition-colors cursor-pointer"
                          onClick={() => handleSelectVeicolo(veicolo)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Targa e Modello */}
                              <div className="flex items-center gap-3 mb-3">
                                <FiTruck className="w-5 h-5 text-blue-400" />
                                <span className="font-bold text-white text-lg tracking-wider">{veicolo.targa || 'N/A'}</span>
                                {displayModello && (
                                  <span className="text-sm text-slate-300">{displayModello}</span>
                                )}
                              </div>
                              
                              {/* Griglia dati veicolo */}
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mb-3">
                                {veicolo.telaio && (
                                  <div className="text-slate-400"><span className="text-slate-500">Telaio:</span> {veicolo.telaio}</div>
                                )}
                                {(veicolo.dataPrimaImmatricolazione || veicolo.dataImmatricolazione) && (
                                  <div className="text-slate-400"><span className="text-slate-500">Immatricolazione:</span> {veicolo.dataPrimaImmatricolazione || veicolo.dataImmatricolazione}</div>
                                )}
                                {veicolo.pesoComplessivo && (
                                  <div className="text-slate-400"><span className="text-slate-500">Peso:</span> {veicolo.pesoComplessivo} kg</div>
                                )}
                                {veicolo.tipoVeicolo && (
                                  <div className="text-slate-400"><span className="text-slate-500">Tipo:</span> {veicolo.tipoVeicolo === 'A' ? 'Autoveicolo' : veicolo.tipoVeicolo === 'M' ? 'Motoveicolo' : veicolo.tipoVeicolo}</div>
                                )}
                              </div>

                              {/* Badge PRA + Intestatario */}
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  isPRA ? 'bg-blue-900/50 text-blue-300' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {isPRA ? 'Con Obbligo PRA' : 'Senza Obbligo PRA'}
                                </span>
                                {veicolo.proprietario ? (
                                  <span className="text-xs text-slate-400">
                                    Intestatario: {veicolo.proprietario.nome} {veicolo.proprietario.cognome} ({veicolo.proprietario.codiceFiscale})
                                  </span>
                                ) : (
                                  <span className="text-xs text-amber-400/70">
                                    Intestatario: da compilare (inserisci CF nella ricerca per precompilare)
                                  </span>
                                )}
                              </div>

                              {/* Fermi Ostativi */}
                              {hasOstativi && (
                                <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FiAlertCircle className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm font-semibold text-yellow-300">Fermi/Vincoli Ostativi</span>
                                  </div>
                                  <div className="text-xs text-yellow-200 space-y-1">
                                    {!isRadiabile && (
                                      <div className="font-medium">Veicolo NON radiabile</div>
                                    )}
                                    {veicolo.vincoloOstativo && (
                                      <div>Vincolo: {veicolo.vincoloOstativo}</div>
                                    )}
                                    {veicolo.ostativiEForzature && veicolo.ostativiEForzature.length > 0 && (
                                      <div>
                                        <div className="font-medium mb-1">Dettagli:</div>
                                        {veicolo.ostativiEForzature.map((ostativo, idx) => (
                                          <div key={idx} className="ml-2">
                                            • {ostativo.descrizione || ostativo.tipo || 'Ostativo non specificato'}
                                            {ostativo.forzabile && (
                                              <span className="text-yellow-400 ml-1">(forzabile)</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Veicolo radiabile */}
                              {!hasOstativi && isRadiabile && (
                                <div className="mt-2 p-2 bg-green-900/20 border border-green-600 rounded-lg">
                                  <div className="flex items-center gap-2 text-xs text-green-300">
                                    <FiCheckCircle className="w-4 h-4" />
                                    <span>Veicolo radiabile - Nessun vincolo ostativo</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectVeicolo(veicolo);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors ml-4 shrink-0"
                            >
                              <FiCheck className="w-4 h-4" />
                              Seleziona
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DemolizioneRVFUForm.propTypes = {
  // No props needed for this component
};

export default DemolizioneRVFUForm;