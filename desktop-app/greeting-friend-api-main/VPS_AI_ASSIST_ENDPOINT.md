# Endpoint VPS: AI Assistant

## Endpoint da creare sulla VPS

**URL**: `POST https://rentri-test.rescuemanager.eu/api/ai/assist`

## Request Body

```json
{
  "org_id": "uuid",
  "route": "/fatture/new",
  "question": "Come compilo il codice destinatario?",
  "context": {
    "company": {
      "name": "Azienda SRL",
      "vat": "12345678901",
      "taxCode": "RSSMRA80A01H501U",
      "address": {
        "street": "Via Roma 1",
        "city": "Milano",
        "zip": "20100",
        "province": "MI",
        "country": "IT"
      },
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
        "date": "2026-02-22",
        "rows": []
      },
      "emptyFields": ["customerVat", "rows", "codiceDest"],
      "suggestions": {
        "customerVat": "P.IVA del cliente (11 cifre)",
        "codiceDest": "Codice destinatario SDI (7 caratteri) o 0000000 se PEC"
      }
    },
    "metadata": {
      "tipoDocumento": "TD01",
      "isB2B": true,
      "totaleImponibile": 0,
      "numeroRighe": 0
    }
  }
}
```

## Response Types

### 1. Risposta Testuale (Spiegazione)

```json
{
  "answer": "Il codice destinatario è un codice alfanumerico di 7 caratteri che identifica il canale telematico del destinatario della fattura. Se il cliente non ha un codice destinatario, puoi usare '0000000' e inserire la sua PEC nel campo apposito."
}
```

### 2. Risposta con Azione - Suggerimento Singolo

```json
{
  "action": {
    "type": "suggest_value",
    "field": "codiceDest",
    "value": "0000000",
    "message": "Per fatture B2C senza codice destinatario, usa 0000000 e inserisci la PEC"
  }
}
```

### 3. Risposta con Azione - Compilazione Multipla

```json
{
  "action": {
    "type": "fill_multiple",
    "fields": [
      {
        "name": "customerName",
        "label": "Cliente",
        "value": "ACME SRL"
      },
      {
        "name": "customerVat",
        "label": "P.IVA",
        "value": "IT12345678901"
      },
      {
        "name": "custCity",
        "label": "Città",
        "value": "Milano"
      },
      {
        "name": "custZip",
        "label": "CAP",
        "value": "20121"
      }
    ],
    "message": "Ho trovato i dati del cliente ACME SRL nella rubrica"
  }
}
```

### 4. Risposta con Azione - Creazione Record

```json
{
  "action": {
    "type": "create_record",
    "recordType": "invoice_row",
    "data": {
      "description": "Servizio di consulenza",
      "quantity": 1,
      "price": 100.00,
      "vatPercentage": 22,
      "unit": "PZ"
    },
    "message": "Ho preparato una riga per servizio di consulenza a 100€"
  }
}
```

### 5. Risposta con Errore

```json
{
  "error": "Non ho capito la domanda. Puoi riformularla?"
}
```

## Implementazione Suggerita (Node.js/Express)

```javascript
// /opt/ai-assist-server/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint AI Assist
app.post('/api/ai/assist', async (req, res) => {
  try {
    const { org_id, route, question, context } = req.body;
    
    // Log richiesta
    console.log('[AI-ASSIST] Richiesta:', {
      org_id,
      route,
      question,
      hasContext: !!context
    });
    
    // Analizza la domanda e il context per generare risposta
    const response = await generateAIResponse(question, context, route);
    
    res.json(response);
  } catch (error) {
    console.error('[AI-ASSIST] Errore:', error);
    res.status(500).json({
      error: 'Errore interno del server'
    });
  }
});

async function generateAIResponse(question, context, route) {
  const lowerQuestion = question.toLowerCase();
  
  // Pattern matching per domande comuni
  
  // 1. Codice destinatario
  if (lowerQuestion.includes('codice destinatario') || lowerQuestion.includes('codice dest')) {
    if (context?.metadata?.isB2C) {
      return {
        action: {
          type: 'suggest_value',
          field: 'codiceDest',
          value: '0000000',
          message: 'Per fatture B2C (privati), usa 0000000 e inserisci la PEC del cliente'
        }
      };
    }
    return {
      answer: 'Il codice destinatario è un codice di 7 caratteri che identifica il canale telematico del destinatario. Se non ce l\'hai, usa "0000000" e inserisci la PEC.'
    };
  }
  
  // 2. Compilazione dati cliente
  if (lowerQuestion.includes('compila') && lowerQuestion.includes('cliente')) {
    // Cerca cliente nel database
    const customerName = extractCustomerName(question);
    if (customerName) {
      const { data: customer } = await supabase
        .from('clients')
        .select('*')
        .eq('org_id', context.company.org_id)
        .ilike('name', `%${customerName}%`)
        .limit(1)
        .single();
      
      if (customer) {
        return {
          action: {
            type: 'fill_multiple',
            fields: [
              { name: 'customerName', label: 'Cliente', value: customer.name },
              { name: 'customerVat', label: 'P.IVA', value: customer.vat },
              { name: 'customerTax', label: 'CF', value: customer.tax_code },
              { name: 'custStreet', label: 'Indirizzo', value: customer.address?.street },
              { name: 'custCity', label: 'Città', value: customer.address?.city },
              { name: 'custZip', label: 'CAP', value: customer.address?.zip }
            ].filter(f => f.value),
            message: `Ho trovato ${customer.name} nella rubrica`
          }
        };
      }
    }
  }
  
  // 3. Aggiunta riga fattura
  if (lowerQuestion.includes('aggiungi') && (lowerQuestion.includes('riga') || lowerQuestion.includes('servizio'))) {
    const price = extractPrice(question);
    const description = extractDescription(question);
    
    return {
      action: {
        type: 'create_record',
        recordType: 'invoice_row',
        data: {
          description: description || 'Servizio',
          quantity: 1,
          price: price || 0,
          vatPercentage: 22,
          unit: 'PZ'
        },
        message: `Riga creata: ${description || 'Servizio'} - €${price || 0}`
      }
    };
  }
  
  // 4. Differenza TD01/TD04
  if (lowerQuestion.includes('td01') || lowerQuestion.includes('td04')) {
    return {
      answer: 'TD01 è una fattura ordinaria. TD04 è una Nota di Credito, usata per stornare/annullare una fattura già emessa. Per TD04 devi sempre indicare la fattura originale che stai stornando.'
    };
  }
  
  // 5. IBAN
  if (lowerQuestion.includes('iban')) {
    if (context?.company?.iban) {
      return {
        action: {
          type: 'suggest_value',
          field: 'iban',
          value: context.company.iban,
          message: 'Ho usato l\'IBAN della tua azienda'
        }
      };
    }
    return {
      answer: 'L\'IBAN è il codice bancario internazionale per i bonifici. Formato italiano: IT + 2 cifre controllo + 1 lettera + 10 cifre + 12 cifre (es: IT60X0542811101000000123456)'
    };
  }
  
  // Risposta generica
  return {
    answer: 'Non ho capito bene la domanda. Prova a chiedere: "Come compilo il codice destinatario?", "Compila i dati del cliente X", "Aggiungi una riga per servizio a 100€"'
  };
}

function extractCustomerName(question) {
  const match = question.match(/cliente\s+([A-Za-z\s]+)/i);
  return match ? match[1].trim() : null;
}

function extractPrice(question) {
  const match = question.match(/(\d+(?:[.,]\d{1,2})?)\s*€?/);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
}

function extractDescription(question) {
  const match = question.match(/per\s+(.+?)(?:\s+a\s+|\s*$)/i);
  return match ? match[1].trim() : null;
}

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`[AI-ASSIST] Server running on port ${PORT}`);
});
```

## Deploy su VPS

```bash
# 1. Crea directory
ssh root@217.154.118.37
mkdir -p /opt/ai-assist-server
cd /opt/ai-assist-server

# 2. Crea package.json
cat > package.json << 'EOF'
{
  "name": "ai-assist-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.3.1"
  }
}
EOF

# 3. Installa dipendenze
npm install

# 4. Crea .env
cat > .env << 'EOF'
PORT=3200
SUPABASE_URL=https://ienzdgrqalltvkdkuamp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
EOF

# 5. Copia il file server.js (vedi sopra)

# 6. Configura PM2
pm2 start server.js --name ai-assist-server
pm2 save

# 7. Configura Nginx reverse proxy
cat > /etc/nginx/sites-available/ai-assist << 'EOF'
server {
    listen 80;
    server_name rentri-test.rescuemanager.eu;

    location /api/ai/ {
        proxy_pass http://127.0.0.1:3200/api/ai/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/ai-assist /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 8. Configura SSL (se non già fatto)
certbot --nginx -d rentri-test.rescuemanager.eu
```

## Test

```bash
curl -X POST https://rentri-test.rescuemanager.eu/api/ai/assist \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "test",
    "route": "/fatture/new",
    "question": "Come compilo il codice destinatario?",
    "context": {
      "company": {},
      "page": { "module": "Fatture", "action": "create" },
      "form": { "currentData": {}, "emptyFields": [], "suggestions": {} },
      "metadata": { "isB2C": true }
    }
  }'
```

## Note

- L'endpoint è **stateless** - non mantiene conversazioni
- Ogni richiesta include tutto il context necessario
- Le risposte sono **deterministiche** basate su pattern matching
- Per AI più avanzata, integrare OpenAI/Anthropic API in futuro
- Logging completo per debugging e miglioramenti
