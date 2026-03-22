// ESEMPIO: Come integrare l'AI Assistant in InvoiceNew.jsx
// Questo è un file di esempio che mostra le modifiche necessarie

import { useAIContext } from '@/context/AIContext';
import AiAssistantPanel from '@/components/AiAssistantPanel';

export default function InvoiceNew() {
  // 1. Importa il context AI
  const { updatePageContext, resetPageContext } = useAIContext();
  
  // ... tutti gli altri stati esistenti ...
  
  // 2. Aggiorna il context AI quando cambia lo stato del form
  useEffect(() => {
    updatePageContext({
      moduleName: 'Fatture',
      action: isEditMode ? 'edit' : 'create',
      formData: {
        // Documento
        tipoDoc,
        number,
        date,
        currency,
        
        // Cliente
        customerName,
        customerSurname,
        customerVat,
        customerTax,
        isCompany,
        custStreet,
        custCity,
        custZip,
        custProv,
        custCountry,
        
        // Trasmissione SDI
        codiceDest,
        pecDest,
        
        // Righe fattura
        rows,
        
        // Riepilogo IVA
        riepAliq,
        riepNatura,
        riepEsig,
        
        // Pagamento
        condPag,
        modPag,
        scadenza,
        iban,
        beneficiario,
        
        // Totali
        totals,
      },
      emptyFields: [
        // Campi obbligatori vuoti
        !customerName && 'customerName',
        !isCompany && !customerSurname && 'customerSurname',
        !customerVat && !customerTax && 'customerVatOrTax',
        !custStreet && 'custStreet',
        !custCity && 'custCity',
        !custZip && 'custZip',
        !codiceDest && !pecDest && 'codiceDestOrPec',
        rows.length === 0 && 'rows',
        !date && 'date',
      ].filter(Boolean),
      suggestions: {
        customerName: 'Seleziona un cliente dalla rubrica o inserisci un nuovo cliente',
        customerVat: 'P.IVA del cliente (11 cifre per IT, es: IT12345678901)',
        customerTax: 'Codice Fiscale del cliente (16 caratteri)',
        codiceDest: 'Codice destinatario SDI (7 caratteri alfanumerici) o 0000000 se usi PEC',
        pecDest: 'Indirizzo PEC del destinatario (se non hai codice destinatario)',
        rows: 'Aggiungi almeno una riga con descrizione, quantità e prezzo',
        custStreet: 'Via e numero civico',
        custCity: 'Comune',
        custZip: 'CAP (5 cifre per Italia, 00000 per estero)',
        date: 'Data fattura (formato YYYY-MM-DD)',
        iban: 'IBAN per pagamento bonifico (es: IT60X0542811101000000123456)',
      },
      metadata: {
        // Metadata utili per l'AI
        tipoDocumento: tipoDoc,
        tipoDocumentoLabel: tdOptions.find(o => o.v === tipoDoc)?.l,
        isNotaCredito: tipoDoc === 'TD04',
        isNotaDebito: tipoDoc === 'TD05',
        requiresOriginalInvoice: tipoDoc === 'TD04' || tipoDoc === 'TD05',
        isB2B: isCompany,
        isB2C: !isCompany,
        hasRows: rows.length > 0,
        totaleImponibile: totals.imponibile,
        totaleIVA: totals.iva,
        totaleFattura: totals.totale,
        numeroRighe: rows.length,
        // Dati azienda già caricati dal context
        companyData,
      },
    });
  }, [
    tipoDoc, number, date, currency,
    customerName, customerSurname, customerVat, customerTax, isCompany,
    custStreet, custCity, custZip, custProv, custCountry,
    codiceDest, pecDest,
    rows, riepAliq, riepNatura, riepEsig,
    condPag, modPag, scadenza, iban, beneficiario,
    totals, isEditMode, companyData,
    updatePageContext
  ]);
  
  // 3. Reset context quando si esce dalla pagina
  useEffect(() => {
    return () => resetPageContext();
  }, [resetPageContext]);
  
  // 4. Gestisci le azioni AI
  const handleAIAction = useCallback((action) => {
    console.log('[AI Action]', action);
    
    switch (action.type) {
      case 'suggest_value': {
        // Compila un singolo campo
        const { field, value } = action;
        
        switch (field) {
          case 'customerName':
            setCustomerName(value);
            break;
          case 'customerSurname':
            setCustomerSurname(value);
            break;
          case 'customerVat':
            setCustomerVat(value);
            // Trigger validazione P.IVA
            handleVatChange(value);
            break;
          case 'customerTax':
            setCustomerTax(value);
            break;
          case 'codiceDest':
            setCodiceDest(value);
            break;
          case 'pecDest':
            setPecDest(value);
            break;
          case 'custStreet':
            setCustStreet(value);
            break;
          case 'custCity':
            setCustCity(value);
            break;
          case 'custZip':
            setCustZip(value);
            break;
          case 'custProv':
            setCustProv(value);
            break;
          case 'date':
            setDate(value);
            break;
          case 'iban':
            setIban(value);
            break;
          default:
            console.warn('[AI] Campo non gestito:', field);
        }
        break;
      }
      
      case 'fill_multiple': {
        // Compila più campi contemporaneamente
        action.fields.forEach(({ name, value }) => {
          switch (name) {
            case 'customerName': setCustomerName(value); break;
            case 'customerSurname': setCustomerSurname(value); break;
            case 'customerVat': setCustomerVat(value); break;
            case 'customerTax': setCustomerTax(value); break;
            case 'custStreet': setCustStreet(value); break;
            case 'custCity': setCustCity(value); break;
            case 'custZip': setCustZip(value); break;
            case 'custProv': setCustProv(value); break;
            case 'custCountry': setCustCountry(value); break;
            case 'codiceDest': setCodiceDest(value); break;
            case 'pecDest': setPecDest(value); break;
            case 'iban': setIban(value); break;
            case 'beneficiario': setBeneficiario(value); break;
          }
        });
        break;
      }
      
      case 'create_record': {
        // Crea un nuovo record (es: riga fattura)
        if (action.recordType === 'invoice_row') {
          const newRow = {
            descr: action.data.description || '',
            qty: action.data.quantity || 1,
            price: action.data.price || 0,
            vat_perc: action.data.vatPercentage || 22,
            unit: action.data.unit || 'PZ',
          };
          setRows(prev => [...prev, newRow]);
        }
        break;
      }
      
      case 'load_customer': {
        // Carica dati cliente dalla rubrica
        if (action.customerId) {
          // Qui dovresti caricare il cliente dal DB
          // Per ora è solo un esempio
          console.log('[AI] Caricamento cliente:', action.customerId);
        }
        break;
      }
      
      default:
        console.warn('[AI] Azione non gestita:', action.type);
    }
  }, [handleVatChange]);
  
  return (
    <div className="space-y-5">
      {/* Header con AI Assistant */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/fatture")} className="...">
            <FiArrowLeft />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-500/15 text-blue-400">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100">
                {isEditMode ? 'Modifica Fattura' : 'Nuova Fattura'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                {number && <span className="text-[10px] text-slate-500">#{number}</span>}
                <span className="text-[10px] text-slate-500">{date}</span>
                {totals.totale > 0 && <span className="text-[10px] text-slate-300 font-medium">{EUR(totals.totale)}</span>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottoni azione + AI Assistant */}
        <div className="flex items-center gap-2">
          {/* AI Assistant - Modalità Inline */}
          <AiAssistantPanel 
            inline={true} 
            onActionRequest={handleAIAction} 
          />
          
          <button onClick={() => navigate("/fatture")} className="...">
            Annulla
          </button>
          <button onClick={save} disabled={saving} className="...">
            {saving ? 'Salvataggio...' : (isEditMode ? 'Aggiorna' : 'Crea Fattura')}
          </button>
        </div>
      </div>
      
      {/* Resto del form... */}
    </div>
  );
}

// ESEMPI DI DOMANDE CHE L'UTENTE PUÒ FARE ALL'AI:

// 1. "Come compilo il codice destinatario?"
//    → AI risponde con spiegazione + suggerisce "0000000" se B2C

// 2. "Compila i dati del cliente ACME SRL"
//    → AI cerca nella rubrica e compila nome, P.IVA, indirizzo

// 3. "Aggiungi una riga per servizio di consulenza a 100€"
//    → AI crea una nuova riga con descrizione, qty=1, price=100

// 4. "Qual è la differenza tra TD01 e TD04?"
//    → AI spiega che TD01 è fattura normale, TD04 è nota di credito

// 5. "Compila automaticamente i dati della mia azienda"
//    → AI usa companyData dal context per compilare cedente/prestatore

// 6. "Cosa devo inserire nel campo IBAN?"
//    → AI spiega il formato IBAN italiano e suggerisce un esempio

// 7. "Crea una fattura per Mario Rossi con 3 righe"
//    → AI compila cliente + crea 3 righe di esempio
