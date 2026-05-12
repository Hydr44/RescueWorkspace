// src/pages/SparePartNewMVP.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FiSave, FiPackage, FiMapPin, FiSearch,
  FiArrowLeft, FiLoader, FiDollarSign, FiCamera, FiTrash2, FiStar,
  FiTruck, FiShield, FiGlobe, FiPlus, FiBox, FiInfo, FiCreditCard, FiCheck
} from 'react-icons/fi';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/context/OrgContext';
import { useToastContext } from '@/context/ToastContext';
import { logger } from '@/lib/logger';
import { uploadPartImage, getPartImages, deletePartImage, setPrimaryImage } from '@/lib/sparePartImages';
import { PLATFORMS, getConnections } from '@/lib/marketplace';
import { publishSparePartToMarketplace } from '@/lib/marketplace-sync';
import MarketplacePublishToggle from '@/components/MarketplacePublishToggle';
import { calculatePriceSuggestion, getDefaultMarkupByCategory } from '@/lib/pricingSuggestions';
import { initPiloterr } from '@/lib/piloterr';
import { generateAftermarketDescription } from '@/lib/aiDescriptions';
import { getPriceSuggestion } from '@/lib/ebayPricing';
import { lookupByOEM, applyLookupDataToForm } from '@/lib/oem-lookup';
import AILookupResultsModal from '@/components/spare-parts/AILookupResultsModal';
import { useSubscription } from '@/hooks/useSubscription';

export default function SparePartNewMVP() {
  const { orgId } = useOrg();
  const { isFeatureEnabled } = useSubscription();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError, showWarning } = useToastContext();
  const isEditing = Boolean(id);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('essentials');
  const [categories, setCategories] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [marketplaceConns, setMarketplaceConns] = useState([]);
  const [pricingSuggestion, setPricingSuggestion] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [markupPercent, setMarkupPercent] = useState(30);
  const [publishToMarketplaceB2B, setPublishToMarketplaceB2B] = useState(false);
  const [publishingPlatform, setPublishingPlatform] = useState(null);
  
  // Scanner e AI Lookup
  const [scannerCode, setScannerCode] = useState('');
  const [searchingTecDoc, setSearchingTecDoc] = useState(false);
  const [tecdocResults, setTecdocResults] = useState([]);
  const [aiCandidates, setAiCandidates] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [existingParts, setExistingParts] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const scannerInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // Info base
    name: '', description: '', oem_code: '', internal_code: '', ean_code: '',
    cross_references: '',
    // Classificazione
    category_id: '', condition: 'used', status: 'available',
    // Veicolo origine
    source_vehicle_make: '', source_vehicle_model: '', source_vehicle_year: '',
    source_vehicle_fuel: '', source_vehicle_engine_code: '', source_vehicle_vin: '',
    source_vehicle_plate: '', source_vehicle_km: '', source_vehicle_color: '',
    // Posizione sul veicolo
    vehicle_side: '', vehicle_position: '',
    // Fisico
    weight_kg: '', length_cm: '', width_cm: '', height_cm: '',
    color: '', material: '',
    // Magazzino
    warehouse_location: '', quantity: 1,
    // Prezzi
    price_buy: '', price_sell: '', auto_price: true,
    // Garanzia
    warranty_months: 0, warranty_notes: '',
    // Spedizione
    shipping_weight_kg: '', shipping_cost: '', free_shipping: false,
    // Vendita online
    is_published: false, published_title: '', published_description: '',
    // Note
    search_terms: '', compatibility_notes: '', notes: '',
  });

  const TABS = [
    { id: 'essentials', label: 'Dati Essenziali', icon: FiPackage, count: images.length },
    { id: 'warehouse', label: 'Magazzino', icon: FiMapPin },
    { id: 'technical', label: 'Dettagli Tecnici', icon: FiBox },
  ];

  // Carica dati iniziali
  useEffect(() => {
    if (!orgId) return;
    loadInitialData();
    if (isEditing) loadPartData();
    // Inizializza Piloterr
    const apiKey = import.meta.env.VITE_PILOTERR_API_KEY;
    if (apiKey) initPiloterr(apiKey);
  }, [orgId, id]);

  // Parametri da URL (scanner)
  useEffect(() => {
    if (!isEditing) {
      const name = searchParams.get('name');
      const oemCode = searchParams.get('oem_code');
      const code = searchParams.get('code');
      if (name || oemCode || code) {
        setFormData(prev => ({
          ...prev,
          name: name || prev.name,
          oem_code: oemCode || prev.oem_code,
          ...(code && code.length === 13 && /^\d+$/.test(code) ? { ean_code: code } : {}),
          ...(code && code.length <= 20 && /^[A-Z0-9-]+$/i.test(code) ? { oem_code: code } : {}),
        }));
        showSuccess(name ? `Ricambio "${name}" precompilato` : `Codice "${code}" precompilato`);
      }
    }
  }, [searchParams, isEditing, showSuccess]);

  const loadInitialData = async () => {
    try {
      const { data: cats } = await supabase.from('spare_parts_categories').select('id, name, code').order('name');
      setCategories(cats || []);
    } catch (e) { logger.error('Error loading categories:', e); }

    try {
      const { data: sh, error } = await supabase.from('shelves').select('id, code, area, section').eq('org_id', orgId).order('code');
      if (!error) setShelves(sh || []);
    } catch (e) { logger.warn('Shelves not available:', e); }

    try {
      const { data: conns } = await getConnections(orgId);
      setMarketplaceConns(conns || []);
    } catch (e) { logger.warn('Marketplace connections not available:', e); }
  };

  const loadPartData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('spare_parts').select('*').eq('id', id).eq('org_id', orgId).single();
      if (error) { showError('Errore nel caricamento'); navigate('/ricambi-mvp'); return; }
      setFormData({
        name: data.name || '', description: data.description || '',
        oem_code: data.oem_code || '', internal_code: data.internal_code || '', ean_code: data.ean_code || '',
        cross_references: (data.cross_references || []).join(', '),
        category_id: data.category_id || '', condition: data.condition || 'used', status: data.status || 'available',
        source_vehicle_make: data.source_vehicle_make || '', source_vehicle_model: data.source_vehicle_model || '',
        source_vehicle_year: data.source_vehicle_year || '', source_vehicle_fuel: data.source_vehicle_fuel || '',
        source_vehicle_engine_code: data.source_vehicle_engine_code || '', source_vehicle_vin: data.source_vehicle_vin || '',
        source_vehicle_plate: data.source_vehicle_plate || '', source_vehicle_km: data.source_vehicle_km || '',
        source_vehicle_color: data.source_vehicle_color || '',
        vehicle_side: data.vehicle_side || '', vehicle_position: data.vehicle_position || '',
        weight_kg: data.weight_kg || '', length_cm: data.length_cm || '', width_cm: data.width_cm || '', height_cm: data.height_cm || '',
        color: data.color || '', material: data.material || '',
        warehouse_location: data.warehouse_location || '', quantity: data.quantity || 1,
        price_buy: data.price_buy || '', price_sell: data.price_sell || '', auto_price: data.auto_price ?? true,
        warranty_months: data.warranty_months || 0, warranty_notes: data.warranty_notes || '',
        shipping_weight_kg: data.shipping_weight_kg || '', shipping_cost: data.shipping_cost || '', free_shipping: data.free_shipping || false,
        is_published: data.is_published || false, published_title: data.published_title || '', published_description: data.published_description || '',
        search_terms: data.search_terms || '', compatibility_notes: data.compatibility_notes || '', notes: data.notes || '',
      });
      // Carica immagini
      const { data: imgs } = await getPartImages(id);
      setImages(imgs || []);
    } catch (e) { logger.error('Error loading part:', e); showError('Errore nel caricamento'); }
    finally { setLoading(false); }
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Cerca ricambio con AI (OEM Lookup unificato)
  const handleScannerSearch = async () => {
    const code = scannerCode.trim();
    if (!code) return;

    setSearchingTecDoc(true);
    setTecdocResults([]);

    try {
      logger.info(`[AI Lookup] Ricerca per codice: ${code}`);
      
      // Usa il nuovo servizio OEM Lookup con AI (passa orgId per eBay OAuth)
      const lookupData = await lookupByOEM(code, { orgId });
      
      if (!lookupData) {
        showWarning(`Codice ${code} non trovato`);
        setSearchingTecDoc(false);
        return;
      }

      // Se sono candidati multipli, mostra modale di selezione
      if (lookupData._type === 'multiple_candidates') {
        logger.info(`[AI Lookup] Trovati ${lookupData.candidates.length} candidati - mostra modale`);
        setAiCandidates(lookupData.candidates);
        setShowAIModal(true);
        setSearchingTecDoc(false);
        return;
      }

      // Altrimenti applica dati direttamente al form
      const updatedForm = applyLookupDataToForm(lookupData, formData);
      setFormData(updatedForm);
      
      // Feedback successo
      showSuccess(` Dati trovati: ${lookupData.name}`);
      
      // Pulisci scanner
      setScannerCode('');
      
      // Log dettagli
      logger.info('[AI Lookup] Dati applicati:', {
        name: lookupData.name,
        category: lookupData.category,
        vehicle: lookupData.vehicle_compatibility
      });

    } catch (error) {
      logger.error('[AI Lookup] Errore ricerca:', error);
      showError('Errore durante la ricerca AI');
    } finally {
      setSearchingTecDoc(false);
    }
  };

  // Handler selezione candidato da modale AI
  const handleAICandidateSelect = async (candidate) => {
    logger.info('[AI Lookup] Candidato selezionato:', candidate.name);
    
    // Applica dati al form
    const updatedForm = applyLookupDataToForm(candidate, formData);
    setFormData(updatedForm);
    
    // Carica foto se presente
    if (candidate.image && !isEditing) {
      try {
        logger.info('[AI Lookup] Caricamento foto da URL:', candidate.image);
        const response = await fetch(candidate.image);
        const blob = await response.blob();
        const file = new File([blob], 'oem-image.jpg', { type: 'image/jpeg' });
        await handleImageUpload({ target: { files: [file] } });
        showSuccess('Foto caricata dall\'OEM lookup');
      } catch (err) {
        logger.warn('[AI Lookup] Errore caricamento foto:', err);
      }
    }
    
    // Cerca ricambi duplicati con stesso OEM code
    if (candidate.oem_code && !isEditing) {
      try {
        const { data: existing } = await supabase
          .from('spare_parts')
          .select('id, name, oem_code, quantity, warehouse_location, price_sell, color')
          .eq('org_id', orgId)
          .eq('oem_code', candidate.oem_code)
          .limit(5);
        
        if (existing && existing.length > 0) {
          setExistingParts(existing);
          setShowDuplicateWarning(true);
          logger.info('[AI Lookup] Trovati ricambi duplicati:', existing.length);
        }
      } catch (err) {
        logger.warn('[AI Lookup] Errore ricerca duplicati:', err);
      }
    }
    
    // Chiudi modale
    setShowAIModal(false);
    setAiCandidates(null);
    
    // Pulisci scanner
    setScannerCode('');
    
    // Feedback
    showSuccess(` Ricambio selezionato: ${candidate.name}`);
  };

  // Seleziona ricambio dalla lista TecDoc
  const handleSelectTecDocPart = async (article) => {
    setSearchingTecDoc(true);

    try {
      const partName = article.articleName || article.name || article.genericArticleName || 'Ricambio';
      const brand = article.brandName || article.supplier || article.mfrName || '';
      const eanCode = article.eanNumber || article.ean || article.eanCode || '';
      const description = article.articleDescription || article.description || '';

      // IA - Descrizione (solo se feature abilitata da admin)
      let aiDescription = null;
      if (isFeatureEnabled('ai_descriptions')) {
        try {
          aiDescription = await generateAftermarketDescription({
            name: partName,
            brand: brand,
            oem_code: scannerCode,
            description: description,
            compatible_vehicles: article.vehicles || [],
          });
        } catch (err) {
          console.warn('[Scanner] AI description failed:', err);
        }
      } else {
        console.info('[Scanner] AI descriptions disabled by admin (feature flag off)');
      }

      // Pricing
      let pricing = null;
      try {
        pricing = await getPriceSuggestion({
          name: partName,
          brand: brand,
          oem_code: scannerCode,
          category: null,
          condition: 'used',
        });
      } catch (err) {
        console.warn('[Scanner] Pricing failed:', err);
      }

      // Aggiorna form
      setFormData(prev => ({
        ...prev,
        oem_code: scannerCode,
        ean_code: eanCode,
        name: aiDescription?.title || partName,
        description: aiDescription?.description || description,
        published_description: aiDescription?.description || description,
        search_terms: aiDescription?.keywords?.join(', ') || '',
        price_sell: pricing?.suggestedPrice || '',
      }));

      setPricingSuggestion(pricing);
      setTecdocResults([]);
      setScannerCode('');
      showSuccess(`Ricambio "${partName}" caricato`);

    } catch (error) {
      logger.error('[Scanner] Select error:', error);
      showError('Errore nel caricamento dati');
    } finally {
      setSearchingTecDoc(false);
    }
  };

  // Auto-focus scanner on tab change
  useEffect(() => {
    if (activeTab === 'essentials' && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [activeTab]);


  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !id) {
      if (!id) showWarning('Salva il ricambio prima di aggiungere foto');
      return;
    }
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const isPrimary = images.length === 0 && i === 0;
      const { data, error } = await uploadPartImage(files[i], orgId, id, { isPrimary, sortOrder: images.length + i });
      if (error) { showError(`Errore upload ${files[i].name}: ${error.message}`); }
      else if (data) { setImages(prev => [...prev, data]); }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [id, orgId, images.length, showError, showWarning]);

  const handleDeleteImage = useCallback(async (img) => {
    const { error } = await deletePartImage(img.id, img.storage_path);
    if (error) { showError('Errore eliminazione immagine'); return; }
    setImages(prev => prev.filter(i => i.id !== img.id));
    showSuccess('Immagine eliminata');
  }, [showError, showSuccess]);

  const handleSetPrimary = useCallback(async (img) => {
    const { error } = await setPrimaryImage(img.id, img.spare_part_id, orgId);
    if (error) { showError('Errore'); return; }
    setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === img.id })));
  }, [orgId, showError]);

  const fetchPriceSuggestion = async () => {
    if (!formData.oem_code && !formData.ean_code) {
      showWarning('Inserisci un codice OEM o EAN per ottenere suggerimenti prezzo');
      return;
    }
    setLoadingPrice(true);
    try {
      const category = categories.find(c => c.id === formData.category_id);
      const defaultMarkup = category ? getDefaultMarkupByCategory(category.name) : 30;
      setMarkupPercent(defaultMarkup);

      const suggestion = await calculatePriceSuggestion(
        {
          id: id || null,
          oem_code: formData.oem_code,
          ean_code: formData.ean_code,
          category: category?.name,
          current_price: formData.price_sell,
        },
        { markupPercent: defaultMarkup, forceRefresh: true }
      );

      setPricingSuggestion(suggestion);
      if (suggestion.suggestedPrice) {
        showSuccess(`Prezzo suggerito: €${suggestion.suggestedPrice}`);
      } else {
        showWarning('Nessun prezzo trovato per questo ricambio');
      }
    } catch (error) {
      logger.error('Error fetching price suggestion:', error);
      showError('Errore nel recupero prezzi');
    } finally {
      setLoadingPrice(false);
    }
  };

  const applyPriceSuggestion = () => {
    if (!pricingSuggestion?.suggestedPrice) return;
    set('price_sell', pricingSuggestion.suggestedPrice);
    showSuccess('Prezzo applicato');
  };

  const handleSave = async (skipDuplicateCheck = false) => {
    if (!formData.name.trim()) { showWarning('Il nome del ricambio è obbligatorio'); return; }
    
    // Controlla duplicati OEM prima di salvare (solo per nuovi ricambi)
    if (!isEditing && !skipDuplicateCheck && formData.oem_code.trim()) {
      try {
        const { data: duplicates } = await supabase
          .from('spare_parts')
          .select('id, name, oem_code, quantity, warehouse_location, color')
          .eq('org_id', orgId)
          .eq('oem_code', formData.oem_code.trim())
          .limit(5);
        
        if (duplicates && duplicates.length > 0) {
          setExistingParts(duplicates);
          setShowDuplicateWarning(true);
          return; // Ferma il salvataggio e mostra warning
        }
      } catch (err) {
        logger.warn('[Save] Errore controllo duplicati:', err);
      }
    }
    
    setSaving(true);
    try {
      // DEBUG: log auth state per capire RLS
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      logger.info('[Save DEBUG] orgId:', orgId);
      logger.info('[Save DEBUG] session:', session ? 'YES' : 'NO');
      logger.info('[Save DEBUG] session.user.id:', session?.user?.id || 'NULL');
      logger.info('[Save DEBUG] user.id:', user?.id || 'NULL');
      logger.info('[Save DEBUG] access_token:', session?.access_token ? session.access_token.substring(0, 20) + '...' : 'NULL');
      
      const crossRefs = formData.cross_references ? formData.cross_references.split(',').map(s => s.trim()).filter(Boolean) : [];
      const payload = {
        org_id: orgId,
        name: formData.name.trim(), description: formData.description.trim(),
        oem_code: formData.oem_code.trim(), internal_code: formData.internal_code.trim(), ean_code: formData.ean_code.trim(),
        cross_references: crossRefs,
        category_id: formData.category_id || null, condition: formData.condition, status: formData.status,
        source_vehicle_make: formData.source_vehicle_make || null, source_vehicle_model: formData.source_vehicle_model || null,
        source_vehicle_year: Number(formData.source_vehicle_year) || null, source_vehicle_fuel: formData.source_vehicle_fuel || null,
        source_vehicle_engine_code: formData.source_vehicle_engine_code || null, source_vehicle_vin: formData.source_vehicle_vin || null,
        source_vehicle_plate: formData.source_vehicle_plate || null, source_vehicle_km: Number(formData.source_vehicle_km) || null,
        source_vehicle_color: formData.source_vehicle_color || null,
        vehicle_side: formData.vehicle_side || null, vehicle_position: formData.vehicle_position || null,
        weight_kg: Number(formData.weight_kg) || null, length_cm: Number(formData.length_cm) || null,
        width_cm: Number(formData.width_cm) || null, height_cm: Number(formData.height_cm) || null,
        color: formData.color || null, material: formData.material || null,
        warehouse_location: formData.warehouse_location || null, quantity: Number(formData.quantity) || 1,
        price_buy: Number(formData.price_buy) || null, price_sell: Number(formData.price_sell) || null, auto_price: formData.auto_price,
        warranty_months: Number(formData.warranty_months) || 0, warranty_notes: formData.warranty_notes || null,
        shipping_weight_kg: Number(formData.shipping_weight_kg) || null, shipping_cost: Number(formData.shipping_cost) || null,
        free_shipping: formData.free_shipping,
        is_published: formData.is_published, published_title: formData.published_title || null,
        published_description: formData.published_description || null,
        search_terms: formData.search_terms || null, compatibility_notes: formData.compatibility_notes || null,
      };

      let savedPartId = id;
      
      if (isEditing) {
        const { error } = await supabase.from('spare_parts').update(payload).eq('id', id).eq('org_id', orgId);
        if (error) throw error;
        showSuccess('Ricambio aggiornato');
      } else {
        const { data: newPart, error } = await supabase.from('spare_parts').insert(payload).select('id').single();
        if (error) throw error;
        savedPartId = newPart.id;
        showSuccess('Ricambio creato');
      }

      // Pubblica su Marketplace B2B se richiesto
      if (publishToMarketplaceB2B && savedPartId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const sparePartData = isEditing ? { id: savedPartId, ...formData } : { id: savedPartId, ...payload };
          
          const result = await publishSparePartToMarketplace(orgId, sparePartData, {
            auto_publish: true,
            created_by: user?.id,
            price: payload.price_sell || 0,
            quality_grade: payload.condition === 'new' ? 'A' : 'B'
          });
          
          if (result.success) {
            showSuccess('Ricambio pubblicato anche sul Marketplace B2B!');
          } else {
            showWarning('Ricambio salvato ma non pubblicato su marketplace: ' + result.error);
          }
        } catch (err) {
          logger.error('Errore pubblicazione marketplace:', err);
          showWarning('Ricambio salvato ma errore pubblicazione marketplace');
        }
      }

      if (!isEditing) {
        navigate(`/ricambi/${savedPartId}`);
        return;
      }
      navigate('/ricambi-mvp');
    } catch (e) { logger.error('Error saving part:', e); showError('Errore nel salvataggio'); }
    finally { setSaving(false); }
  };

  // ─── Style helpers ───
  const inputCls = "w-full h-8 px-3 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none transition";
  const labelCls = "text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1.5 block";
  const selectCls = "w-full h-8 px-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 outline-none";
  const textareaCls = "w-full px-3 py-2 text-xs border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none resize-none transition";
  const cardCls = "bg-[#1a2536] rounded-xl border border-[#243044] overflow-hidden";
  const cardHeaderCls = "flex items-center gap-2.5 px-5 py-3 border-b border-[#243044]";
  const sectionTitle = "text-xs font-semibold text-slate-400 uppercase tracking-wider";

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 bg-[#1a2536] rounded-lg" />
        <div className="h-10 bg-[#1a2536] rounded-xl border border-[#243044]" />
        <div className="grid grid-cols-2 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="bg-[#1a2536] rounded-xl border border-[#243044] h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ricambi-mvp')} className="h-8 px-3 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition">
            <FiArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Ricambi
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">{isEditing ? 'Modifica Ricambio' : 'Nuovo Ricambio'}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{isEditing ? `ID: ${id}` : 'Compila tutti i dati del ricambio'}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 disabled:opacity-50 inline-flex items-center gap-1.5">
          {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
          {isEditing ? 'Aggiorna' : 'Salva'}
        </button>
      </div>


      {/* Tabs */}
      <div className={cardCls}>
        <div className="px-3">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-400">{tab.count}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ═══ TAB: Dati Essenziali ═══ */}
      {activeTab === 'essentials' && (
        <>
          {/* Scanner Codice */}
          <div className="bg-[#1a2536] rounded-xl border border-[#243044] p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <FiCreditCard className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-300">Scansiona Codice Ricambio</h3>
            </div>
            <div className="flex gap-2">
              <input
                ref={scannerInputRef}
                type="text"
                value={scannerCode}
                onChange={e => setScannerCode(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleScannerSearch()}
                placeholder="Scansiona o inserisci codice OEM/EAN..."
                className="flex-1 h-10 px-3 text-sm border border-[#243044] rounded-lg bg-[#141c27] text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500/30 outline-none"
                disabled={searchingTecDoc}
              />
              <button
                onClick={handleScannerSearch}
                disabled={!scannerCode.trim() || searchingTecDoc}
                className="h-10 px-4 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-lg shadow-blue-500/20"
                title="Ricerca intelligente con AI - Compila automaticamente tutti i dati"
              >
                {searchingTecDoc ? (
                  <><FiLoader className="w-4 h-4 animate-spin" /> Ricerca AI...</>
                ) : (
                  <><FiSearch className="w-4 h-4" /> Cerca con AI</>
                )}
              </button>
            </div>

            {/* Risultati TecDoc */}
            {tecdocResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Risultati trovati ({tecdocResults.length})</p>
                {tecdocResults.map((article, idx) => {
                  const partName = article.articleName || article.name || article.genericArticleName || 'Ricambio';
                  const brand = article.brandName || article.supplier || article.mfrName || '';
                  const eanCode = article.eanNumber || article.ean || '';
                  const vehicleCount = article.vehicles?.length || 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectTecDocPart(article)}
                      className="p-3 bg-[#141c27] border border-[#243044] rounded-lg hover:border-blue-500/50 cursor-pointer transition group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition">{partName}</h4>
                            {brand && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{brand}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>OEM: <span className="font-mono text-slate-400">{scannerCode}</span></span>
                            {eanCode && <span>EAN: <span className="font-mono text-slate-400">{eanCode}</span></span>}
                            {vehicleCount > 0 && (
                              <span className="flex items-center gap-1">
                                <FiTruck className="w-3 h-3" />
                                {vehicleCount} veicoli
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="h-8 px-3 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5">
                          <FiCheck className="w-3.5 h-3.5" />
                          Seleziona
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dati Essenziali - Solo campi critici */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Colonna SX: Info Base */}
            <div className={cardCls}>
              <div className={cardHeaderCls}><FiPackage className="w-3.5 h-3.5 text-blue-400" /><h2 className={sectionTitle}>Informazioni Base</h2></div>
              <div className="p-5 space-y-4">
                <div><label className={labelCls}>Nome Ricambio *</label><input type="text" value={formData.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Es. Motore 2.0 TDI" /></div>
                <div><label className={labelCls}>Descrizione</label><textarea value={formData.description} onChange={e => set('description', e.target.value)} rows={3} className={textareaCls} placeholder="Descrizione dettagliata del ricambio..." /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Codice OEM</label><input type="text" value={formData.oem_code} onChange={e => set('oem_code', e.target.value)} className={inputCls} placeholder="03L130277B" /></div>
                  <div><label className={labelCls}>Codice EAN</label><input type="text" value={formData.ean_code} onChange={e => set('ean_code', e.target.value)} className={inputCls} placeholder="8012345678901" /></div>
                  <div><label className={labelCls}>Codice Interno</label><input type="text" value={formData.internal_code} onChange={e => set('internal_code', e.target.value)} className={inputCls} placeholder="RIC-001" /></div>
                </div>
                <div><label className={labelCls}>Categoria</label><select value={formData.category_id} onChange={e => set('category_id', e.target.value)} className={selectCls}><option value="">Seleziona categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
            </div>

            {/* Colonna DX: Prezzo & Disponibilità */}
            <div className="space-y-5">
              <div className={cardCls}>
                <div className={cardHeaderCls}><FiDollarSign className="w-3.5 h-3.5 text-emerald-400" /><h2 className={sectionTitle}>Prezzo & Disponibilità</h2></div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Prezzo Acquisto (€)</label><input type="number" step="0.01" value={formData.price_buy} onChange={e => set('price_buy', e.target.value)} className={inputCls} placeholder="0.00" /></div>
                    <div><label className={labelCls}>Prezzo Vendita (€) *</label><input type="number" step="0.01" value={formData.price_sell} onChange={e => set('price_sell', e.target.value)} className={inputCls} placeholder="0.00" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Quantità Disponibile</label><input type="number" min="0" value={formData.quantity} onChange={e => set('quantity', e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Condizione</label><select value={formData.condition} onChange={e => set('condition', e.target.value)} className={selectCls}><option value="used">Usato</option><option value="new">Nuovo</option><option value="refurbished">Rigenerato</option><option value="damaged">Danneggiato</option></select></div>
                  </div>
                  <div><label className={labelCls}>Stato Magazzino</label><select value={formData.status} onChange={e => set('status', e.target.value)} className={selectCls}><option value="available">Disponibile</option><option value="reserved">Riservato</option><option value="sold">Venduto</option><option value="damaged">Danneggiato</option></select></div>
                </div>
              </div>

              <div className={cardCls}>
                <div className={cardHeaderCls}><FiTruck className="w-3.5 h-3.5 text-blue-400" /><h2 className={sectionTitle}>Veicolo Origine</h2></div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className={labelCls}>Marca</label><input type="text" value={formData.source_vehicle_make} onChange={e => set('source_vehicle_make', e.target.value)} className={inputCls} placeholder="Fiat" /></div>
                    <div><label className={labelCls}>Modello</label><input type="text" value={formData.source_vehicle_model} onChange={e => set('source_vehicle_model', e.target.value)} className={inputCls} placeholder="Punto" /></div>
                    <div><label className={labelCls}>Anno</label><input type="number" min="1950" max="2030" value={formData.source_vehicle_year} onChange={e => set('source_vehicle_year', e.target.value)} className={inputCls} placeholder="2015" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Alimentazione</label><select value={formData.source_vehicle_fuel} onChange={e => set('source_vehicle_fuel', e.target.value)} className={selectCls}><option value="">-</option><option value="benzina">Benzina</option><option value="diesel">Diesel</option><option value="gpl">GPL</option><option value="metano">Metano</option><option value="ibrido">Ibrido</option><option value="elettrico">Elettrico</option></select></div>
                    <div><label className={labelCls}>Codice Motore</label><input type="text" value={formData.source_vehicle_engine_code} onChange={e => set('source_vehicle_engine_code', e.target.value)} className={inputCls} placeholder="199A4000" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>VIN / Telaio</label><input type="text" value={formData.source_vehicle_vin} onChange={e => set('source_vehicle_vin', e.target.value)} className={inputCls} placeholder="ZFA19900000123456" /></div>
                    <div><label className={labelCls}>Targa</label><input type="text" value={formData.source_vehicle_plate} onChange={e => set('source_vehicle_plate', e.target.value)} className={inputCls} placeholder="AB123CD" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sezione Foto */}
          <div className={cardCls}>
            <div className={cardHeaderCls}>
              <FiCamera className="w-3.5 h-3.5 text-blue-400" />
              <h2 className={sectionTitle}>Foto Ricambio ({images.length})</h2>
              <div className="ml-auto">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || !id}
                  className="h-7 px-3 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-1 disabled:opacity-50">
                  {uploading ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiPlus className="w-3 h-3" />}
                  {uploading ? 'Caricamento...' : 'Aggiungi Foto'}
                </button>
              </div>
            </div>
            <div className="p-5">
              {!id && (
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-400"><FiInfo className="w-3.5 h-3.5 inline mr-1" />Salva il ricambio prima di aggiungere le foto.</p>
                </div>
              )}
              {images.length === 0 && id && (
                <div className="text-center py-8">
                  <FiCamera className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-xs text-slate-500">Nessuna foto. Clicca "Aggiungi Foto" per caricare.</p>
                </div>
              )}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map(img => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[#243044] bg-[#141c27]">
                      <img src={img.url} alt={img.alt_text || 'Ricambio'} className="w-full h-32 object-cover" />
                      {img.is_primary && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-medium bg-blue-600 text-white rounded">Principale</span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        {!img.is_primary && (
                          <button onClick={() => handleSetPrimary(img)} className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-700" title="Imposta come principale">
                            <FiStar className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteImage(img)} className="p-1.5 bg-red-600 rounded-lg text-white hover:bg-red-700" title="Elimina">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB: Magazzino ═══ */}
      {activeTab === 'warehouse' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardCls}>
            <div className={cardHeaderCls}><FiMapPin className="w-3.5 h-3.5 text-emerald-400" /><h2 className={sectionTitle}>Ubicazione Magazzino</h2></div>
            <div className="p-5 space-y-4">
              <div><label className={labelCls}>Ubicazione / Scaffale</label><input type="text" value={formData.warehouse_location} onChange={e => set('warehouse_location', e.target.value)} className={inputCls} placeholder="Scaffale A-12" /></div>
              {shelves.length > 0 && (
                <>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Scaffali Disponibili</p>
                  <div className="flex flex-wrap gap-1.5">
                    {shelves.map(s => (
                      <button key={s.id} type="button" onClick={() => set('warehouse_location', `${s.code} - ${s.area}/${s.section}`)}
                        className="px-2 py-0.5 text-[10px] rounded bg-[#141c27] border border-[#243044] text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition">
                        {s.code}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="space-y-5">

            {/* Pricing Suggestions */}
            <div className={cardCls}>
              <div className={cardHeaderCls}>
                <FiDollarSign className="w-3.5 h-3.5 text-amber-400" />
                <h2 className={sectionTitle}>Suggerimenti Prezzo</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Piloterr AutoDoc</span>
              </div>
              <div className="p-5 space-y-4">
                <button
                  type="button"
                  onClick={fetchPriceSuggestion}
                  disabled={loadingPrice || (!formData.oem_code && !formData.ean_code)}
                  className="w-full h-9 px-4 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPrice ? (
                    <><FiLoader className="w-3.5 h-3.5 animate-spin" /> Ricerca prezzi in corso...</>
                  ) : (
                    <><FiSearch className="w-3.5 h-3.5" /> Cerca Prezzi AutoDoc</>
                  )}
                </button>

                {pricingSuggestion && (
                  <div className="space-y-3">
                    {pricingSuggestion.autodocPrice && (
                      <div className="bg-[#141c27] rounded-lg p-3 border border-[#243044]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Prezzo AutoDoc</span>
                          <span className="text-sm font-semibold text-emerald-400">€ {pricingSuggestion.autodocPrice.toFixed(2)}</span>
                        </div>
                        {pricingSuggestion.availability && (
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className={pricingSuggestion.availability.inStock ? 'text-emerald-400' : 'text-red-400'}>
                              {pricingSuggestion.availability.inStock ? ' Disponibile' : ' Non disponibile'}
                            </span>
                            {pricingSuggestion.deliveryDays && (
                              <span>Consegna: {pricingSuggestion.deliveryDays}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {pricingSuggestion.suggestedPrice && (
                      <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-[10px] text-blue-400 uppercase tracking-wider block">Prezzo Suggerito</span>
                            <span className="text-[9px] text-slate-500">con markup {markupPercent}%</span>
                          </div>
                          <span className="text-lg font-bold text-blue-400">€ {pricingSuggestion.suggestedPrice.toFixed(2)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={applyPriceSuggestion}
                          className="w-full h-7 px-3 text-[10px] font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition"
                        >
                          Applica questo prezzo
                        </button>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-[#141c27] rounded-lg p-2.5 border border-[#243044]">
                      <FiInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <p>I prezzi sono aggiornati da AutoDoc.de e includono un markup automatico basato sulla categoria del ricambio. Puoi modificare il prezzo finale manualmente.</p>
                    </div>
                  </div>
                )}

                {!pricingSuggestion && !loadingPrice && (
                  <div className="text-center py-6 text-xs text-slate-500">
                    <FiDollarSign className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p>Inserisci un codice OEM o EAN e clicca su "Cerca Prezzi"</p>
                    <p className="text-[10px] mt-1">per ottenere suggerimenti automatici da AutoDoc</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: Dettagli Tecnici ═══ */}
      {activeTab === 'technical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Colonna SX: Dimensioni & Fisico */}
          <div className="space-y-5">
            <div className={cardCls}>
              <div className={cardHeaderCls}><FiBox className="w-3.5 h-3.5 text-blue-400" /><h2 className={sectionTitle}>Dimensioni & Peso</h2></div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div><label className={labelCls}>Peso (kg)</label><input type="number" step="0.1" value={formData.weight_kg} onChange={e => set('weight_kg', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Lungh. (cm)</label><input type="number" step="0.1" value={formData.length_cm} onChange={e => set('length_cm', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Larg. (cm)</label><input type="number" step="0.1" value={formData.width_cm} onChange={e => set('width_cm', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Alt. (cm)</label><input type="number" step="0.1" value={formData.height_cm} onChange={e => set('height_cm', e.target.value)} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Colore</label><input type="text" value={formData.color} onChange={e => set('color', e.target.value)} className={inputCls} placeholder="Nero, Grigio..." /></div>
                  <div><label className={labelCls}>Materiale</label><input type="text" value={formData.material} onChange={e => set('material', e.target.value)} className={inputCls} placeholder="Acciaio, Plastica..." /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Lato Veicolo</label><select value={formData.vehicle_side} onChange={e => set('vehicle_side', e.target.value)} className={selectCls}><option value="">-</option><option value="left">Sinistro (SX)</option><option value="right">Destro (DX)</option><option value="front">Anteriore</option><option value="rear">Posteriore</option><option value="center">Centrale</option></select></div>
                  <div><label className={labelCls}>Posizione</label><input type="text" value={formData.vehicle_position} onChange={e => set('vehicle_position', e.target.value)} className={inputCls} placeholder="Vano motore..." /></div>
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <div className={cardHeaderCls}><FiTruck className="w-3.5 h-3.5 text-blue-400" /><h2 className={sectionTitle}>Spedizione</h2></div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Peso spedizione (kg)</label><input type="number" step="0.1" value={formData.shipping_weight_kg} onChange={e => set('shipping_weight_kg', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Costo spedizione (€)</label><input type="number" step="0.01" value={formData.shipping_cost} onChange={e => set('shipping_cost', e.target.value)} className={inputCls} /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.free_shipping} onChange={e => set('free_shipping', e.target.checked)} className="w-3.5 h-3.5 rounded border-[#243044] bg-[#141c27] text-blue-500" />
                  <span className="text-xs text-slate-400">Spedizione gratuita</span>
                </label>
              </div>
            </div>
          </div>

          {/* Colonna DX: Garanzia & Note */}
          <div className="space-y-5">
            <div className={cardCls}>
              <div className={cardHeaderCls}><FiShield className="w-3.5 h-3.5 text-emerald-400" /><h2 className={sectionTitle}>Garanzia</h2></div>
              <div className="p-5 space-y-4">
                <div><label className={labelCls}>Durata garanzia (mesi)</label><input type="number" min="0" value={formData.warranty_months} onChange={e => set('warranty_months', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Note garanzia</label><textarea value={formData.warranty_notes} onChange={e => set('warranty_notes', e.target.value)} rows={3} className={textareaCls} placeholder="Condizioni garanzia, esclusioni..." /></div>
              </div>
            </div>

            <div className={cardCls}>
              <div className={cardHeaderCls}><FiInfo className="w-3.5 h-3.5 text-slate-400" /><h2 className={sectionTitle}>Note & Ricerca</h2></div>
              <div className="p-5 space-y-4">
                <div><label className={labelCls}>Note interne</label><textarea value={formData.notes} onChange={e => set('notes', e.target.value)} rows={2} className={textareaCls} placeholder="Note interne..." /></div>
                <div><label className={labelCls}>Termini di ricerca</label><input type="text" value={formData.search_terms} onChange={e => set('search_terms', e.target.value)} className={inputCls} placeholder="Parole chiave aggiuntive..." /></div>
                <div><label className={labelCls}>Note compatibilità</label><textarea value={formData.compatibility_notes} onChange={e => set('compatibility_notes', e.target.value)} rows={2} className={textareaCls} placeholder="Compatibile con..." /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: Marketplace ═══ */}
      {activeTab === 'marketplace' && (
        <div className="space-y-5">
          {/* Riepilogo Annuncio Marketplace */}
          <div className={cardCls}>
            <div className={cardHeaderCls}>
              <FiPackage className="w-3.5 h-3.5 text-emerald-400" />
              <h2 className={sectionTitle}>Riepilogo Annuncio Marketplace</h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Anteprima</span>
            </div>
            <div className="p-5">
              <div className="bg-[#141c27] border border-[#243044] rounded-xl p-4">
                <div className="flex gap-4">
                  {/* Immagine placeholder */}
                  <div className="w-24 h-24 rounded-lg bg-[#1a2536] border border-[#243044] flex items-center justify-center flex-shrink-0">
                    {images.length > 0 ? (
                      <img src={images[0].url} alt={formData.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <FiCamera className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  
                  {/* Dati annuncio */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-200 mb-2 line-clamp-1">
                      {formData.name || 'Nome ricambio non inserito'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Prezzo</p>
                        <p className="text-base font-bold text-emerald-400">
                          {formData.price_sell ? `€ ${parseFloat(formData.price_sell).toFixed(2)}` : '€ 0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Disponibilità</p>
                        <p className="text-sm text-slate-300">{formData.quantity || 0} pz</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Condizione</p>
                        <p className="text-sm text-slate-300">
                          {formData.condition === 'new' ? 'Nuovo' : formData.condition === 'used' ? 'Usato' : formData.condition === 'refurbished' ? 'Rigenerato' : 'Danneggiato'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Veicolo</p>
                        <p className="text-sm text-slate-300 line-clamp-1">
                          {formData.source_vehicle_make && formData.source_vehicle_model 
                            ? `${formData.source_vehicle_make} ${formData.source_vehicle_model}${formData.source_vehicle_year ? ` (${formData.source_vehicle_year})` : ''}`
                            : 'Non specificato'}
                        </p>
                      </div>
                    </div>
                    {formData.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{formData.description}</p>
                    )}
                  </div>
                </div>
                
                {/* Alert se mancano dati critici */}
                {(!formData.name || !formData.price_sell || formData.quantity === 0) && (
                  <div className="mt-3 pt-3 border-t border-[#243044]">
                    <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5">
                      <FiInfo className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">Dati mancanti per pubblicazione:</p>
                        <ul className="text-[10px] space-y-0.5">
                          {!formData.name && <li>• Nome ricambio obbligatorio</li>}
                          {!formData.price_sell && <li>• Prezzo vendita obbligatorio</li>}
                          {formData.quantity === 0 && <li>• Quantità deve essere maggiore di 0</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Marketplace B2B tra Demolitori */}
          <MarketplacePublishToggle
            orgId={orgId}
            sparePartId={id}
            value={publishToMarketplaceB2B}
            onChange={setPublishToMarketplaceB2B}
          />

          <div className={cardCls}>
            <div className={cardHeaderCls}><FiGlobe className="w-3.5 h-3.5 text-blue-400" /><h2 className={sectionTitle}>Pubblicazione Online</h2></div>
            <div className="p-5 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_published} onChange={e => set('is_published', e.target.checked)} className="w-3.5 h-3.5 rounded border-[#243044] bg-[#141c27] text-blue-500" />
                <span className="text-xs text-slate-200 font-medium">Pubblica questo ricambio sui marketplace</span>
              </label>
              {formData.is_published && (
                <>
                  <div><label className={labelCls}>Titolo annuncio (per marketplace)</label><input type="text" value={formData.published_title} onChange={e => set('published_title', e.target.value)} className={inputCls} placeholder={formData.name || 'Titolo annuncio...'} /></div>
                  <div><label className={labelCls}>Descrizione annuncio</label><textarea value={formData.published_description} onChange={e => set('published_description', e.target.value)} rows={4} className={textareaCls} placeholder="Descrizione per eBay, Shopify..." /></div>
                </>
              )}
            </div>
          </div>

          {/* Connessioni marketplace */}
          <div className={cardCls}>
            <div className={cardHeaderCls}><FiGlobe className="w-3.5 h-3.5 text-emerald-400" /><h2 className={sectionTitle}>Marketplace Collegati</h2></div>
            <div className="p-5">
              {marketplaceConns.length === 0 ? (
                <div className="text-center py-6">
                  <FiGlobe className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-xs text-slate-500 mb-2">Nessun marketplace collegato</p>
                  <p className="text-[10px] text-slate-600">Vai in Impostazioni per collegare eBay o Shopify</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {marketplaceConns.map(conn => {
                    const platform = PLATFORMS[conn.platform];
                    if (!platform) return null;
                    
                    const isPublishing = publishingPlatform === conn.platform;
                    
                    const handlePublishToMarketplace = async () => {
                      if (!id) {
                        showWarning('Salva prima il ricambio');
                        return;
                      }
                      
                      setPublishingPlatform(conn.platform);
                      try {
                        const sparePartData = { id, ...formData };
                        
                        // eBay: usa endpoint VPS dedicato
                        if (conn.platform === 'ebay') {
                          const { data: imgs } = await supabase
                            .from('spare_part_images')
                            .select('url')
                            .eq('spare_part_id', id)
                            .order('is_primary', { ascending: false });
                          
                          const imageUrls = (imgs || []).map(i => i.url).filter(Boolean);
                          
                          const res = await fetch('https://api.rescuemanager.eu/api/ebay/publish', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              org_id: orgId,
                              spare_part: { ...sparePartData, images: imageUrls }
                            })
                          });
                          
                          const data = await res.json();
                          
                          if (data.success) {
                            showSuccess(`Pubblicato su eBay! Listing: ${data.listingId}`);
                            logger.info(`[eBay] Published: ${data.ebayUrl}`);
                          } else {
                            logger.error('[eBay] Publish error:', data);
                            const detail = data.details?.[0]?.message || data.error || 'Pubblicazione fallita';
                            showError(`Errore eBay: ${detail}`);
                          }
                          return;
                        }
                        
                        // Altre piattaforme: marketplace B2B interno
                        const result = await publishSparePartToMarketplace(orgId, sparePartData, {
                          auto_publish: true,
                          marketplace_id: conn.id,
                          platform: conn.platform
                        });
                        
                        if (result.success) {
                          showSuccess(`Pubblicato su ${platform.name}!`);
                        } else {
                          showError(`Errore pubblicazione su ${platform.name}`);
                        }
                      } catch (err) {
                        logger.error(`Error publishing to ${platform.name}:`, err);
                        showError(`Errore: ${err.message}`);
                      } finally {
                        setPublishingPlatform(null);
                      }
                    };
                    
                    return (
                      <div key={conn.id} className="flex items-center justify-between bg-[#141c27] border border-[#243044] rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${platform.bgColor} ${platform.color}`}>{platform.name}</span>
                          <span className={`text-[10px] ${conn.status === 'connected' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {conn.status === 'connected' ? 'Connesso' : conn.status === 'expired' ? 'Scaduto' : 'Disconnesso'}
                          </span>
                        </div>
                        <button 
                          type="button"
                          disabled={conn.status !== 'connected' || !id || isPublishing}
                          onClick={handlePublishToMarketplace}
                          className="h-7 px-3 text-[10px] font-medium bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] hover:text-blue-400 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5">
                          {isPublishing ? (
                            <>
                              <FiLoader className="w-3 h-3 animate-spin" />
                              <span>Pubblicando...</span>
                            </>
                          ) : (
                            <span className="text-slate-400">Pubblica</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale AI Lookup Results */}
      {showAIModal && aiCandidates && (
        <AILookupResultsModal
          candidates={aiCandidates}
          onSelect={handleAICandidateSelect}
          onClose={() => {
            setShowAIModal(false);
            setAiCandidates(null);
          }}
        />
      )}

      {/* Modale Warning Duplicati */}
      {showDuplicateWarning && existingParts.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2536] rounded-xl border border-amber-500/30 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-500/20 bg-amber-500/5">
              <FiInfo className="w-5 h-5 text-amber-400" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-100">Ricambi simili già presenti</h3>
                <p className="text-xs text-amber-200/70 mt-0.5">Trovati {existingParts.length} ricambi con lo stesso codice OEM: <span className="font-mono font-semibold">{formData.oem_code}</span></p>
              </div>
            </div>

            {/* Lista ricambi esistenti */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {existingParts.map((part, idx) => (
                <div key={part.id} className="bg-[#141c27] rounded-lg border border-[#243044] p-4 hover:border-blue-500/30 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-200 truncate">{part.name}</h4>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <FiBox className="w-3 h-3" />
                          Qtà: {part.quantity || 0}
                        </span>
                        {part.warehouse_location && (
                          <span className="flex items-center gap-1">
                            <FiMapPin className="w-3 h-3" />
                            {part.warehouse_location}
                          </span>
                        )}
                        {part.color && (
                          <span className="flex items-center gap-1">
                            Colore: {part.color}
                          </span>
                        )}
                        {part.price_sell && (
                          <span className="flex items-center gap-1">
                            <FiDollarSign className="w-3 h-3" />
                            €{part.price_sell}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDuplicateWarning(false);
                        navigate(`/ricambi/${part.id}`);
                      }}
                      className="h-7 px-3 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition whitespace-nowrap"
                    >
                      Modifica
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con azioni */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#243044] bg-[#141c27]/50">
              <p className="text-xs text-slate-400">Vuoi creare un nuovo ricambio o modificare uno esistente?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setExistingParts([]);
                  }}
                  className="h-8 px-4 text-xs font-medium text-slate-400 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#1e2b3d] transition"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setExistingParts([]);
                    handleSave(true); // Skip duplicate check
                  }}
                  className="h-8 px-4 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-600/20"
                >
                  Crea Nuovo Comunque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
