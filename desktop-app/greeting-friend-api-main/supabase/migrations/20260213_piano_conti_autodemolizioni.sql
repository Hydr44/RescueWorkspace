-- Migration: Piano dei Conti completo per Autodemolizioni
-- Created: 2026-02-13
-- Description: Aggiorna la funzione init_chart_of_accounts_for_org con un piano dei conti
--              professionale e specifico per il settore autodemolizioni.
--              Mantiene i codici esistenti (120, 200, 401, 600, 1001, 1002, 2001, 2002)
--              e aggiunge conti specifici per: vendita ricambi, rottami, demolizioni,
--              CONAI, trasporti, costi ambientali, ammortamenti, personale, ecc.
--
-- Struttura codici:
--   1xx  = Attività correnti (cassa, banca, crediti)
--   2xx  = Passività correnti (debiti, IVA, contributi)
--   3xx  = Patrimonio netto
--   4xx  = Ricavi
--   5xx  = Costi del personale
--   6xx  = Costi per acquisti e servizi
--   7xx  = Costi operativi e generali
--   8xx  = Ammortamenti e accantonamenti
--   9xx  = Oneri/proventi finanziari e straordinari

CREATE OR REPLACE FUNCTION public.init_chart_of_accounts_for_org(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.chart_of_accounts (org_id, code, name, category, subcategory, is_system)
  VALUES
    -- ══════════════════════════════════════════
    -- 1xx - ATTIVITÀ (asset)
    -- ══════════════════════════════════════════

    -- Liquidità
    (p_org_id, '1001', 'Banca c/c principale', 'asset', 'bank', true),
    (p_org_id, '1002', 'Cassa contanti', 'asset', 'cash', true),
    (p_org_id, '1003', 'Banca c/c secondario', 'asset', 'bank', false),
    (p_org_id, '1004', 'Carta di credito aziendale', 'asset', 'bank', false),
    (p_org_id, '1005', 'Conto PayPal / POS', 'asset', 'bank', false),

    -- Crediti
    (p_org_id, '120',  'Crediti verso clienti', 'asset', 'receivables', true),
    (p_org_id, '121',  'Crediti verso clienti - ricambi', 'asset', 'receivables', false),
    (p_org_id, '122',  'Crediti verso clienti - rottami', 'asset', 'receivables', false),
    (p_org_id, '123',  'Crediti verso clienti - demolizioni', 'asset', 'receivables', false),
    (p_org_id, '124',  'Crediti verso clienti - trasporti', 'asset', 'receivables', false),
    (p_org_id, '130',  'Crediti verso Erario (IVA)', 'asset', 'tax_receivables', false),
    (p_org_id, '131',  'Crediti tributari diversi', 'asset', 'tax_receivables', false),
    (p_org_id, '140',  'Anticipi a fornitori', 'asset', 'advances', false),
    (p_org_id, '150',  'Cauzioni attive', 'asset', 'deposits', false),

    -- IVA a credito
    (p_org_id, '2002', 'IVA a credito', 'asset', 'tax_receivables', true),

    -- Rimanenze
    (p_org_id, '160',  'Magazzino ricambi usati', 'asset', 'inventory', false),
    (p_org_id, '161',  'Magazzino rottami ferrosi', 'asset', 'inventory', false),
    (p_org_id, '162',  'Magazzino rottami non ferrosi', 'asset', 'inventory', false),
    (p_org_id, '163',  'Magazzino pneumatici usati', 'asset', 'inventory', false),
    (p_org_id, '164',  'Magazzino batterie esauste', 'asset', 'inventory', false),
    (p_org_id, '165',  'Magazzino catalizzatori', 'asset', 'inventory', false),
    (p_org_id, '166',  'Magazzino oli esausti', 'asset', 'inventory', false),

    -- Immobilizzazioni
    (p_org_id, '170',  'Terreni e fabbricati', 'asset', 'fixed_assets', false),
    (p_org_id, '171',  'Impianti e macchinari', 'asset', 'fixed_assets', false),
    (p_org_id, '172',  'Attrezzature (pressa, cesoie, muletti)', 'asset', 'fixed_assets', false),
    (p_org_id, '173',  'Automezzi (carri attrezzi, bisarche)', 'asset', 'fixed_assets', false),
    (p_org_id, '174',  'Mobili e arredi ufficio', 'asset', 'fixed_assets', false),
    (p_org_id, '175',  'Hardware e software', 'asset', 'fixed_assets', false),
    (p_org_id, '176',  'Impianti ambientali (depurazione, aspirazione)', 'asset', 'fixed_assets', false),

    -- ══════════════════════════════════════════
    -- 2xx - PASSIVITÀ (liability)
    -- ══════════════════════════════════════════

    -- Debiti commerciali
    (p_org_id, '200',  'Debiti verso fornitori', 'liability', 'payables', true),
    (p_org_id, '201',  'Debiti verso fornitori - materiali', 'liability', 'payables', false),
    (p_org_id, '202',  'Debiti verso fornitori - servizi', 'liability', 'payables', false),

    -- IVA e tributi
    (p_org_id, '2001', 'IVA a debito', 'liability', 'tax_payables', true),
    (p_org_id, '210',  'Erario c/ritenute dipendenti', 'liability', 'tax_payables', false),
    (p_org_id, '211',  'Erario c/ritenute professionisti', 'liability', 'tax_payables', false),
    (p_org_id, '212',  'Debiti tributari diversi', 'liability', 'tax_payables', false),
    (p_org_id, '213',  'Debiti IRES/IRPEF', 'liability', 'tax_payables', false),
    (p_org_id, '214',  'Debiti IRAP', 'liability', 'tax_payables', false),

    -- Debiti verso enti
    (p_org_id, '220',  'Debiti verso INPS', 'liability', 'social_payables', false),
    (p_org_id, '221',  'Debiti verso INAIL', 'liability', 'social_payables', false),
    (p_org_id, '222',  'Debiti verso dipendenti', 'liability', 'social_payables', false),
    (p_org_id, '223',  'TFR (Trattamento Fine Rapporto)', 'liability', 'provisions', false),

    -- Debiti specifici settore
    (p_org_id, '230',  'Debiti verso CONAI', 'liability', 'environmental', false),
    (p_org_id, '231',  'Debiti verso consorzi rifiuti', 'liability', 'environmental', false),
    (p_org_id, '232',  'Debiti per contributi ambientali', 'liability', 'environmental', false),
    (p_org_id, '240',  'Ratei e risconti passivi', 'liability', 'accruals', false),
    (p_org_id, '250',  'Mutui e finanziamenti', 'liability', 'long_term_debt', false),
    (p_org_id, '251',  'Leasing macchinari', 'liability', 'long_term_debt', false),

    -- ══════════════════════════════════════════
    -- 3xx - PATRIMONIO NETTO (equity)
    -- ══════════════════════════════════════════
    (p_org_id, '300',  'Capitale sociale', 'equity', 'capital', true),
    (p_org_id, '310',  'Riserva legale', 'equity', 'reserves', false),
    (p_org_id, '311',  'Riserva straordinaria', 'equity', 'reserves', false),
    (p_org_id, '320',  'Utile/Perdita esercizio', 'equity', 'result', false),
    (p_org_id, '321',  'Utili/Perdite esercizi precedenti', 'equity', 'retained', false),

    -- ══════════════════════════════════════════
    -- 4xx - RICAVI (revenue)
    -- ══════════════════════════════════════════

    -- Ricavi core autodemolizione
    (p_org_id, '401',  'Ricavi vendita ricambi usati', 'revenue', 'sales', true),
    (p_org_id, '402',  'Ricavi vendita rottami ferrosi', 'revenue', 'sales', false),
    (p_org_id, '403',  'Ricavi vendita rottami non ferrosi', 'revenue', 'sales', false),
    (p_org_id, '404',  'Ricavi vendita catalizzatori', 'revenue', 'sales', false),
    (p_org_id, '405',  'Ricavi servizio demolizione', 'revenue', 'services', false),
    (p_org_id, '406',  'Ricavi servizio trasporto/soccorso', 'revenue', 'services', false),
    (p_org_id, '407',  'Ricavi servizio custodia veicoli', 'revenue', 'services', false),
    (p_org_id, '408',  'Ricavi pratiche PRA/radiazione', 'revenue', 'services', false),
    (p_org_id, '409',  'Ricavi vendita veicoli interi', 'revenue', 'sales', false),

    -- Ricavi accessori
    (p_org_id, '420',  'Ricavi contributo CONAI', 'revenue', 'contributions', false),
    (p_org_id, '421',  'Ricavi contributi ambientali', 'revenue', 'contributions', false),
    (p_org_id, '430',  'Ricavi diversi e sopravvenienze attive', 'revenue', 'other', false),
    (p_org_id, '431',  'Abbuoni e arrotondamenti attivi', 'revenue', 'other', false),
    (p_org_id, '440',  'Rimborsi assicurativi', 'revenue', 'other', false),

    -- ══════════════════════════════════════════
    -- 5xx - COSTI DEL PERSONALE (expense)
    -- ══════════════════════════════════════════
    (p_org_id, '500',  'Salari e stipendi', 'expense', 'personnel', false),
    (p_org_id, '501',  'Oneri sociali (INPS)', 'expense', 'personnel', false),
    (p_org_id, '502',  'INAIL', 'expense', 'personnel', false),
    (p_org_id, '503',  'TFR maturato', 'expense', 'personnel', false),
    (p_org_id, '504',  'Buoni pasto e benefit', 'expense', 'personnel', false),
    (p_org_id, '505',  'Formazione personale', 'expense', 'personnel', false),
    (p_org_id, '506',  'Lavoro interinale / collaboratori', 'expense', 'personnel', false),

    -- ══════════════════════════════════════════
    -- 6xx - COSTI PER ACQUISTI (expense)
    -- ══════════════════════════════════════════
    (p_org_id, '600',  'Acquisto veicoli da demolire', 'expense', 'purchases', true),
    (p_org_id, '601',  'Acquisto ricambi per rivendita', 'expense', 'purchases', false),
    (p_org_id, '602',  'Acquisto materiali di consumo', 'expense', 'purchases', false),
    (p_org_id, '603',  'Acquisto carburante e lubrificanti', 'expense', 'purchases', false),
    (p_org_id, '604',  'Acquisto pneumatici', 'expense', 'purchases', false),
    (p_org_id, '605',  'Acquisto DPI e materiale sicurezza', 'expense', 'purchases', false),

    -- ══════════════════════════════════════════
    -- 7xx - COSTI OPERATIVI E GENERALI (expense)
    -- ══════════════════════════════════════════

    -- Costi ambientali (specifici settore)
    (p_org_id, '700',  'Smaltimento rifiuti pericolosi', 'expense', 'environmental', false),
    (p_org_id, '701',  'Smaltimento rifiuti non pericolosi', 'expense', 'environmental', false),
    (p_org_id, '702',  'Contributi CONAI', 'expense', 'environmental', false),
    (p_org_id, '703',  'Analisi e certificazioni ambientali', 'expense', 'environmental', false),
    (p_org_id, '704',  'Bonifica e messa in sicurezza', 'expense', 'environmental', false),
    (p_org_id, '705',  'Costi RENTRI (registro rifiuti)', 'expense', 'environmental', false),
    (p_org_id, '706',  'Costi MUD annuale', 'expense', 'environmental', false),

    -- Costi trasporto
    (p_org_id, '710',  'Costi trasporto veicoli', 'expense', 'transport', false),
    (p_org_id, '711',  'Manutenzione carri attrezzi', 'expense', 'transport', false),
    (p_org_id, '712',  'Assicurazione automezzi', 'expense', 'transport', false),
    (p_org_id, '713',  'Bollo e tasse automezzi', 'expense', 'transport', false),
    (p_org_id, '714',  'Pedaggi autostradali', 'expense', 'transport', false),

    -- Costi generali
    (p_org_id, '720',  'Affitto capannone / piazzale', 'expense', 'rent', false),
    (p_org_id, '721',  'Utenze (elettricità, acqua, gas)', 'expense', 'utilities', false),
    (p_org_id, '722',  'Telefonia e internet', 'expense', 'utilities', false),
    (p_org_id, '723',  'Assicurazioni generali', 'expense', 'insurance', false),
    (p_org_id, '724',  'Assicurazione RC ambientale', 'expense', 'insurance', false),
    (p_org_id, '725',  'Manutenzione impianti e attrezzature', 'expense', 'maintenance', false),
    (p_org_id, '726',  'Consulenze (commercialista, legale)', 'expense', 'professional', false),
    (p_org_id, '727',  'Consulenze ambientali', 'expense', 'professional', false),
    (p_org_id, '728',  'Software e licenze (RescueManager, ecc.)', 'expense', 'technology', false),
    (p_org_id, '729',  'Cancelleria e materiale ufficio', 'expense', 'office', false),
    (p_org_id, '730',  'Spese postali e bancarie', 'expense', 'banking', false),
    (p_org_id, '731',  'Commissioni bancarie e POS', 'expense', 'banking', false),
    (p_org_id, '732',  'Pubblicità e marketing', 'expense', 'marketing', false),
    (p_org_id, '733',  'Spese di rappresentanza', 'expense', 'marketing', false),
    (p_org_id, '734',  'Imposte e tasse diverse', 'expense', 'taxes', false),
    (p_org_id, '735',  'Sanzioni e penalità', 'expense', 'penalties', false),
    (p_org_id, '736',  'Abbuoni e arrotondamenti passivi', 'expense', 'other', false),
    (p_org_id, '737',  'Sopravvenienze passive', 'expense', 'other', false),

    -- ══════════════════════════════════════════
    -- 8xx - AMMORTAMENTI E ACCANTONAMENTI (expense)
    -- ══════════════════════════════════════════
    (p_org_id, '800',  'Ammortamento fabbricati', 'expense', 'depreciation', false),
    (p_org_id, '801',  'Ammortamento impianti e macchinari', 'expense', 'depreciation', false),
    (p_org_id, '802',  'Ammortamento attrezzature', 'expense', 'depreciation', false),
    (p_org_id, '803',  'Ammortamento automezzi', 'expense', 'depreciation', false),
    (p_org_id, '804',  'Ammortamento mobili e arredi', 'expense', 'depreciation', false),
    (p_org_id, '805',  'Ammortamento hardware e software', 'expense', 'depreciation', false),
    (p_org_id, '810',  'Accantonamento fondo rischi ambientali', 'expense', 'provisions', false),
    (p_org_id, '811',  'Accantonamento fondo svalutazione crediti', 'expense', 'provisions', false),

    -- ══════════════════════════════════════════
    -- 9xx - ONERI/PROVENTI FINANZIARI (revenue/expense)
    -- ══════════════════════════════════════════
    (p_org_id, '900',  'Interessi attivi bancari', 'revenue', 'financial', false),
    (p_org_id, '910',  'Interessi passivi bancari', 'expense', 'financial', false),
    (p_org_id, '911',  'Interessi passivi su mutui', 'expense', 'financial', false),
    (p_org_id, '912',  'Interessi passivi su leasing', 'expense', 'financial', false),
    (p_org_id, '920',  'Plusvalenze da cessione beni', 'revenue', 'extraordinary', false),
    (p_org_id, '930',  'Minusvalenze da cessione beni', 'expense', 'extraordinary', false)

  ON CONFLICT (org_id, code) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.init_chart_of_accounts_for_org IS 'Inizializza piano dei conti completo per autodemolizioni. I conti esistenti non vengono sovrascritti (ON CONFLICT DO NOTHING).';
