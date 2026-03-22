# AI Assistant - Guida Integrazione

## Panoramica

L'AI Assistant è un sistema context-aware che aiuta gli utenti a:
- Compilare campi automaticamente
- Suggerire valori basati sui dati aziendali
- Guidare passo-passo nelle operazioni
- Creare record con conferma utente

## Architettura

### 1. AIContext Provider (`src/context/AIContext.jsx`)
Fornisce il contesto globale AI a tutta l'applicazione:
- Dati azienda (nome, P.IVA, indirizzo, regime fiscale)
- Stato pagina corrente (modulo, azione, form data)
- Campi vuoti che possono essere compilati
- Suggerimenti disponibili
- Metadata aggiuntivi

### 2. AiAssistantPanel (`src/components/AiAssistantPanel.jsx`)
Componente UI dell'assistente:
- Modalità `inline` (nell'header) o `floating` (bottom-right)
- Chat interattiva con l'AI
- Gestione azioni AI (suggerimenti, compilazione)
- Conferma utente prima di applicare modifiche

## Come Integrare in una Pagina

### Step 1: Importare i Context

```jsx
import { useAIContext } from '@/context/AIContext';
import AiAssistantPanel from '@/components/AiAssistantPanel';
```

### Step 2: Aggiornare il Context quando cambia lo stato

```jsx
const { updatePageContext } = useAIContext();

useEffect(() => {
  // Aggiorna context quando cambia il form
  updatePageContext({
    moduleName: 'Fatture',
    action: isEditMode ? 'edit' : 'create',
    formData: {
      customerName,
      customerVat,
      date,
      rows,
      // ... tutti i campi del form
    },
    emptyFields: [
      !customerName && 'customerName',
      !customerVat && 'customerVat',
      rows.length === 0 && 'rows',
    ].filter(Boolean),
    suggestions: {
      customerName: 'Suggerisci un cliente dalla rubrica',
      date: 'Data odierna',
    },
    metadata: {
      availableCustomers: customers,
      companyData: companyData,
    },
  });
}, [customerName, customerVat, date, rows, updatePageContext]);
```

### Step 3: Gestire le Azioni AI

```jsx
const handleAIAction = useCallback((action) => {
  switch (action.type) {
    case 'suggest_value':
      // Compila un singolo campo
      if (action.field === 'customerName') {
        setCustomerName(action.value);
      }
      break;
      
    case 'fill_multiple':
      // Compila più campi
      action.fields.forEach(field => {
        if (field.name === 'customerName') setCustomerName(field.value);
        if (field.name === 'customerVat') setCustomerVat(field.value);
      });
      break;
      
    case 'create_record':
      // Crea un nuovo record (es: nuova riga fattura)
      setRows(prev => [...prev, action.data]);
      break;
  }
}, []);
```

### Step 4: Aggiungere il Componente nell'Header

```jsx
<div className="flex items-center gap-2">
  <AiAssistantPanel 
    inline={true} 
    onActionRequest={handleAIAction} 
  />
  {/* Altri bottoni header */}
</div>
```

## Esempio Completo: InvoiceNew.jsx

```jsx
import { useAIContext } from '@/context/AIContext';
import AiAssistantPanel from '@/components/AiAssistantPanel';

export default function InvoiceNew() {
  const { updatePageContext } = useAIContext();
  
  // ... stati form ...
  
  // Aggiorna context AI quando cambia il form
  useEffect(() => {
    updatePageContext({
      moduleName: 'Fatture',
      action: isEditMode ? 'edit' : 'create',
      formData: {
        tipoDoc,
        customerName,
        customerVat,
        customerTax,
        isCompany,
        date,
        currency,
        rows,
        codiceDest,
        pecDest,
      },
      emptyFields: [
        !customerName && 'customerName',
        !customerVat && !customerTax && 'customerVat',
        rows.length === 0 && 'rows',
        !codiceDest && !pecDest && 'codiceDest',
      ].filter(Boolean),
      suggestions: {
        customerName: 'Seleziona un cliente dalla rubrica o creane uno nuovo',
        codiceDest: 'Codice destinatario SDI (7 caratteri) o 0000000 se PEC',
        rows: 'Aggiungi almeno una riga alla fattura',
      },
      metadata: {
        tipoDocumento: tipoDoc,
        isNotaCredito: tipoDoc === 'TD04' || tipoDoc === 'TD05',
        totale: totals.totale,
      },
    });
  }, [customerName, customerVat, customerTax, date, rows, tipoDoc, codiceDest, pecDest, totals, isEditMode, updatePageContext]);
  
  // Gestisci azioni AI
  const handleAIAction = useCallback((action) => {
    if (action.type === 'suggest_value') {
      switch (action.field) {
        case 'customerName':
          setCustomerName(action.value);
          break;
        case 'customerVat':
          setCustomerVat(action.value);
          break;
        case 'codiceDest':
          setCodiceDest(action.value);
          break;
      }
    }
    
    if (action.type === 'fill_multiple') {
      action.fields.forEach(field => {
        switch (field.name) {
          case 'customerName': setCustomerName(field.value); break;
          case 'customerVat': setCustomerVat(field.value); break;
          case 'customerTax': setCustomerTax(field.value); break;
          case 'custStreet': setCustStreet(field.value); break;
          case 'custCity': setCustCity(field.value); break;
          case 'custZip': setCustZip(field.value); break;
        }
      });
    }
    
    if (action.type === 'create_record' && action.recordType === 'invoice_row') {
      setRows(prev => [...prev, action.data]);
    }
  }, []);
  
  return (
    <div>
      {/* Header con AI Assistant */}
      <div className="flex items-center justify-between">
        <h1>Nuova Fattura</h1>
        <div className="flex items-center gap-2">
          <AiAssistantPanel inline={true} onActionRequest={handleAIAction} />
          <button onClick={save}>Salva</button>
        </div>
      </div>
      
      {/* Form ... */}
    </div>
  );
}
```

## API Backend (VPS)

L'AI Assistant invia richieste a `POST /api/ai/assist` con questo payload:

```json
{
  "org_id": "uuid",
  "route": "/fatture/new",
  "question": "Come compilo il codice destinatario?",
  "context": {
    "company": {
      "name": "Azienda SRL",
      "vat": "12345678901",
      "regimeFiscale": "RF01"
    },
    "page": {
      "module": "Fatture",
      "action": "create"
    },
    "form": {
      "currentData": {
        "customerName": "Mario Rossi",
        "customerVat": "",
        "rows": []
      },
      "emptyFields": ["customerVat", "rows"],
      "suggestions": {
        "customerVat": "P.IVA del cliente"
      }
    },
    "metadata": {
      "tipoDocumento": "TD01"
    }
  }
}
```

### Risposta con Azione

```json
{
  "action": {
    "type": "suggest_value",
    "field": "codiceDest",
    "value": "0000000",
    "message": "Per fatture B2C senza codice destinatario, usa 0000000"
  }
}
```

### Risposta con Compilazione Multipla

```json
{
  "action": {
    "type": "fill_multiple",
    "fields": [
      { "name": "customerName", "label": "Cliente", "value": "ACME SRL" },
      { "name": "customerVat", "label": "P.IVA", "value": "IT12345678901" },
      { "name": "custCity", "label": "Città", "value": "Milano" }
    ]
  }
}
```

## Posizionamento UI

### Modalità Inline (Consigliata)
Nell'header della pagina, accanto ai bottoni di azione:
```jsx
<AiAssistantPanel inline={true} onActionRequest={handleAIAction} />
```

### Modalità Floating
Bottone fisso in basso a destra (default se `inline` non specificato):
```jsx
<AiAssistantPanel onActionRequest={handleAIAction} />
```

## Best Practices

1. **Aggiorna il context frequentemente**: Ogni volta che cambia lo stato del form
2. **Specifica campi vuoti**: Aiuta l'AI a capire cosa può compilare
3. **Fornisci suggerimenti**: Descrizioni chiare per ogni campo
4. **Metadata ricchi**: Più context = risposte migliori
5. **Gestisci tutte le azioni**: Implementa handler per suggest_value, fill_multiple, create_record
6. **Conferma utente**: L'AI mostra sempre i suggerimenti prima di applicarli

## Moduli da Integrare

- ✅ Fatture (InvoiceNew, InvoiceForm)
- ⏳ Clienti (ClientNew, ClientForm)
- ⏳ Trasporti (TransportNew)
- ⏳ Rifiuti (RifiutiMovimentoForm)
- ⏳ Veicoli (VehicleForm)
- ⏳ Contabilità (AccountingEntry)
