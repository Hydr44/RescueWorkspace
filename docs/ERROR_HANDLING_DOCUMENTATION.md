# 🚨 GESTIONE ERRORI - DOCUMENTAZIONE

## 🎯 OBIETTIVO

Implementare un sistema completo di gestione errori con:
- ✅ Codici errore univoci
- ✅ Documentazione risoluzione
- ✅ Auto-help nell'app
- ✅ Report errori automatico

---

## 📋 SISTEMA CODICI ERRORE

### **Struttura Codice**
```
TIPO-FASE-CODICE_NUMERO

Esempio:
- DB-SYNC-1001 (Database Sync Error #1001)
- OAUTH-AUTH-2003 (OAuth Authentication Error #2003)
- RVFU-IMPORT-3005 (RVFU Import Error #3005)
- FATT-SDI-4002 (Fatturazione SDI Error #4002)
```

---

## 🗄️ DATABASE ERRORI

### **Tabella `error_codes`**
```sql
CREATE TABLE public.error_codes (
  code TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  solution TEXT,
  related_docs TEXT[], -- Links to documentation
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Categorie Errori**

#### **1. Database Errors (DB-*)**
| Codice | Titolo | Severità | Soluzione |
|--------|--------|----------|-----------|
| DB-SYNC-1001 | Errore connessione database | High | Verifica connessione internet |
| DB-SYNC-1002 | Timeout query database | Medium | Riprova, se persiste contatta supporto |
| DB-QUERY-1003 | Query non valida | High | Aggiorna app all'ultima versione |
| DB-PERM-1004 | Permessi insufficienti | Critical | Contatta amministratore |

#### **2. OAuth Errors (OAUTH-*)**
| Codice | Titolo | Severità | Soluzione |
|--------|--------|----------|-----------|
| OAUTH-AUTH-2001 | Token scaduto | Medium | Effettua di nuovo il login |
| OAUTH-AUTH-2002 | Token non valido | High | Logout e login |
| OAUTH-AUTH-2003 | Errore server OAuth | High | Riprova tra qualche minuto |
| OAUTH-CALL-2004 | Callback fallito | Medium | Rimuovi cache browser |

#### **3. Sync Errors (SYNC-*)**
| Codice | Titolo | Severità | Soluzione |
|--------|--------|----------|-----------|
| SYNC-PULL-3001 | Errore download dati | Medium | Verifica connessione |
| SYNC-PUSH-3002 | Errore upload dati | High | Riprova, dati salvati localmente |
| SYNC-CONF-3003 | Conflitto dati | High | Richiedi sincronizzazione manuale |
| SYNC-NET-3004 | Timeout sincronizzazione | Medium | Riprova più tardi |

#### **4. RVFU Errors (RVFU-*)**
| Codice | Titolo | Severità | Soluzione |
|--------|--------|----------|-----------|
| RVFU-AUTH-4001 | Credenziali RVFU non valide | Critical | Verifica credenziali MIT |
| RVFU-IMPORT-4002 | Errore import dati | High | Controlla formato dati |
| RVFU-DOC-4003 | Documento non valido | High | Verifica formato secondo MIT |
| RVFU-SYNC-4004 | Errore sincronizzazione MIT | High | Riprova, se persiste contatta MIT |

#### **5. Fatturazione Errors (FATT-*)**
| Codice | Titolo | Severità | Soluzione |
|--------|--------|----------|-----------|
| FATT-SDI-5001 | Errore invio SDI | High | Verifica connessione SDI |
| FATT-XML-5002 | XML non valido | High | Correggi dati fattura |
| FATT-CF-5003 | Codice fiscale non valido | High | Verifica CF destinatario |
| FATT-SIGN-5004 | Errore firma digitale | Critical | Riconfigura firma digitale |

---

## 🎨 COMPONENTE ERROR OVERLAY

### **ErrorDisplay Component**
```typescript
// desktop-app/greeting-friend-api-main/src/components/ErrorDisplay.jsx

interface ErrorInfo {
  code: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  solution?: string;
  docLink?: string;
}

export default function ErrorDisplay({ error }: { error: ErrorInfo }) {
  const getSeverityColor = () => {
    switch(error.severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      default: return 'blue';
    }
  };

  const getSeverityIcon = () => {
    switch(error.severity) {
      case 'critical': return '⚠️';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-white shadow-2xl rounded-lg p-6 max-w-md border-l-4 border-${getSeverityColor()}-500`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{getSeverityIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">{error.title}</h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {error.code}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{error.message}</p>
          
          {error.solution && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
              <p className="text-sm text-blue-800">
                <strong>Soluzione:</strong> {error.solution}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            {error.docLink && (
              <a
                href={error.docLink}
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                📖 Vedi documentazione
              </a>
            )}
            <button
              onClick={() => {/* Report error */}}
              className="text-sm text-gray-600 hover:underline"
            >
              📧 Segnala errore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📄 PAGINA DOCUMENTAZIONE ERRORI

### **ErrorDocs Page**
```typescript
// website/src/app/(main)/prodotto/docs/errori/page.tsx
"use client";

import { useState } from "react";
import { AlertCircle, Search } from "lucide-react";

const errorCategories = [
  {
    id: "database",
    name: "Database",
    prefix: "DB",
    errors: [
      {
        code: "DB-SYNC-1001",
        title: "Errore connessione database",
        severity: "high",
        solution: "Verifica la connessione internet. Se il problema persiste, contatta il supporto.",
        related: ["connettività", "sincronizzazione"]
      },
      {
        code: "DB-QUERY-1003",
        title: "Query database non valida",
        severity: "high",
        solution: "Aggiorna l'app all'ultima versione disponibile.",
        related: ["aggiornamenti", "versioni"]
      }
    ]
  },
  {
    id: "oauth",
    name: "OAuth",
    prefix: "OAUTH",
    errors: [
      {
        code: "OAUTH-AUTH-2001",
        title: "Token scaduto",
        severity: "medium",
        solution: "Effettua di nuovo il login dal menu utente.",
        related: ["login", "autenticazione"]
      },
      {
        code: "OAUTH-AUTH-2002",
        title: "Token non valido",
        severity: "high",
        solution: "Esegui logout e rieffettua il login.",
        related: ["logout", "login"]
      }
    ]
  }
  // ... altre categorie
];

export default function ErroriPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Gestione Errori</h1>
        <p className="text-xl text-gray-600">
          Trova la soluzione ai problemi più comuni
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per codice errore o parola chiave..."
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="mb-8">
        {errorCategories.map((category) => (
          <div key={category.id} className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
            
            <div className="space-y-4">
              {category.errors.map((error) => (
                <div
                  key={error.code}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className={`h-5 w-5 text-${
                          error.severity === 'high' ? 'orange' : 'blue'
                        }-500`} />
                        <h3 className="font-semibold">{error.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {error.solution}
                      </p>
                    </div>
                    <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {error.code}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Tags: {error.related.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* How to report */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Come segnalare un errore</h3>
        <p className="text-sm text-gray-700 mb-4">
          Se non trovi la soluzione, segnala l'errore con:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Il <strong>codice errore</strong> (es: OAUTH-AUTH-2001)</li>
          <li>Descrizione del problema</li>
          <li>Screenshot (se possibile)</li>
          <li>Timestamp dell'errore</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 🔧 INTEGRAZIONE NELL'APP

### **Error Service**
```typescript
// desktop-app/greeting-friend-api-main/src/lib/errorService.ts

interface ErrorInfo {
  code: string;
  title: string;
  message: string;
  severity: string;
  solution?: string;
  docLink: string;
}

class ErrorService {
  private errorDatabase: Map<string, ErrorInfo> = new Map();

  constructor() {
    this.loadErrorDatabase();
  }

  private loadErrorDatabase() {
    // Carica da API o file locale
    this.errorDatabase.set('DB-SYNC-1001', {
      code: 'DB-SYNC-1001',
      title: 'Errore connessione database',
      message: 'Impossibile sincronizzare con il database',
      severity: 'high',
      solution: 'Verifica la connessione internet',
      docLink: 'https://rescuemanager.eu/prodotto/docs/errori#DB-SYNC-1001'
    });
  }

  getErrorInfo(code: string): ErrorInfo | null {
    return this.errorDatabase.get(code) || null;
  }

  showError(error: Error): void {
    const errorInfo = this.getErrorInfo(error.code);
    
    if (errorInfo) {
      // Mostra ErrorDisplay
      window.errorOverlay?.show(errorInfo);
    } else {
      // Errore generico
      window.errorOverlay?.show({
        code: error.code || 'UNKNOWN',
        title: 'Errore',
        message: error.message,
        severity: 'medium',
        docLink: 'https://rescuemanager.eu/prodotto/docs/errori'
      });
    }
  }
}

export const errorService = new ErrorService();
```

---

## 📊 METRICHE

### **Tracking Errori**
```typescript
// Traccia automaticamente errori per analytics
const trackError = (error: ErrorInfo) => {
  analytics.track('error_occurred', {
    code: error.code,
    severity: error.severity,
    category: error.code.split('-')[0],
    timestamp: new Date().toISOString()
  });
};
```

---

## ✅ TODO IMPLEMENTAZIONE

### **Immediato**
- [ ] Creare tabella `error_codes` nel database
- [ ] Popolare database errori (50+ codici principali)
- [ ] Creare ErrorDisplay component
- [ ] Creare pagina `/prodotto/docs/errori`
- [ ] Integrare ErrorService nell'app

### **Questa Settimana**
- [ ] Auto-help basato su codice
- [ ] Report errori automatico
- [ ] Analytics errori
- [ ] Testing error scenarios

---

**Sistema completato = Grande valore** ✨

