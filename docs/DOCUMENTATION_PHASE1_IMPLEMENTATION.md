# 🚀 IMPLEMENTAZIONE FASE 1 - DOCUMENTAZIONE

## 📋 OVERVIEW

Implementazione immediata della documentazione base per RescueManager.

---

## 🎯 OBIETTIVI
- ✅ Creare sezione docs sul sito
- ✅ Help Center nell'app desktop
- ✅ Quick Start guide
- ✅ FAQ base (20 domande)
- ✅ Onboarding interattivo

---

## 📁 FILE DA CREARE

### **A. Sito Web - Documentazione**

#### **1. Landing Page Docs** `/prodotto/docs`
```typescript
// website/src/app/(main)/prodotto/docs/page.tsx
"use client";

import { Book, FileText, Video, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DocsPage() {
  const docSections = [
    {
      title: "Quick Start",
      description: "Inizia subito con RescueManager",
      icon: Book,
      href: "/prodotto/docs/quick-start",
      color: "blue"
    },
    {
      title: "Moduli",
      description: "Guide complete per ogni modulo",
      icon: FileText,
      href: "/prodotto/docs/moduli",
      color: "green"
    },
    {
      title: "Video Tutorial",
      description: "Impara guardando",
      icon: Video,
      href: "/prodotto/docs/video",
      color: "purple"
    },
    {
      title: "FAQ",
      description: "Domande frequenti",
      icon: HelpCircle,
      href: "/prodotto/docs/faq",
      color: "orange"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Documentazione RescueManager
        </h1>
        <p className="text-xl text-gray-600">
          Tutte le risorse per utilizzare al meglio la piattaforma
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {docSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
            >
              <section.icon className={`h-12 w-12 text-${section.color}-600 mb-4`} />
              <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
              <p className="text-gray-600 text-sm">{section.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Popolari */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Guide Popolari
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/prodotto/docs/trasporti" className="hover:underline">
            📚 Creare un trasporto
          </Link>
          <Link href="/prodotto/docs/rvfu" className="hover:underline">
            🚗 Gestione RVFU
          </Link>
          <Link href="/prodotto/docs/fatturazione" className="hover:underline">
            💰 Fatturazione elettronica
          </Link>
        </div>
      </div>
    </div>
  );
}
```

#### **2. Quick Start Guide** `/prodotto/docs/quick-start`
```typescript
// website/src/app/(main)/prodotto/docs/quick-start/page.tsx
"use client";

import { CheckCircle } from "lucide-react";

export default function QuickStartPage() {
  const steps = [
    {
      number: 1,
      title: "Registrati",
      description: "Crea il tuo account su RescueManager",
      action: "/register"
    },
    {
      number: 2,
      title: "Setup Organizzazione",
      description: "Configura la tua azienda e i primi dati",
      action: "/dashboard/settings"
    },
    {
      number: 3,
      title: "Primo Trasporto",
      description: "Crea la tua prima operazione",
      action: "/dashboard/trasporti/new"
    },
    {
      number: 4,
      title: "Esplora Moduli",
      description: "Scopri tutte le funzionalità",
      action: "/dashboard"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-4">Quick Start Guide</h1>
      <p className="text-xl text-gray-600 mb-12">
        Inizia con RescueManager in 4 semplici passaggi
      </p>

      <div className="space-y-8">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              {step.number}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">{step.title}</h2>
              <p className="text-gray-600 mb-4">{step.description}</p>
              <a
                href={step.action}
                className="text-blue-600 hover:underline"
              >
                Vai al passo →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### **3. FAQ** `/prodotto/docs/faq`
```typescript
// website/src/app/(main)/prodotto/docs/faq/page.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: "Setup",
      questions: [
        {
          q: "Come mi registro?",
          a: "Vai su /register e crea il tuo account in pochi secondi."
        },
        {
          q: "Quali dati mi servono per iniziare?",
          a: "Nome azienda, email e numero di telefono. Poi configura i tuoi primi mezzi e autisti."
        }
      ]
    },
    {
      category: "Utilizzo",
      questions: [
        {
          q: "Come creo un trasporto?",
          a: "Vai in 'Trasporti' → 'Nuovo' e compila il form. Seleziona cliente, autista e mezzo."
        },
        {
          q: "Come funziona la fatturazione elettronica?",
          a: "RescueManager si integra con SDI. Configuri una volta i tuoi codici destinatario e poi emetti fatture direttamente dall'app."
        }
      ]
    },
    {
      category: "Billing",
      questions: [
        {
          q: "Quali sono i piani disponibili?",
          a: "Starter (€19.99/mese), Flotta (€98.99/mese), Enterprise (€149.99/mese)."
        },
        {
          q: "Posso cambiare piano?",
          a: "Sì, in qualsiasi momento dalla sezione Billing del tuo account."
        }
      ]
    },
    {
      category: "Tecnico",
      questions: [
        {
          q: "I miei dati sono sicuri?",
          a: "Sì, utilizziamo Supabase con crittografia end-to-end e backup automatici."
        },
        {
          q: "Funziona offline?",
          a: "L'app desktop funziona offline e sincronizza quando hai connessione."
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-4">FAQ</h1>
      <p className="text-xl text-gray-600 mb-12">
        Domande frequenti su RescueManager
      </p>

      {faqs.map((category, catIndex) => (
        <div key={category.category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
          <div className="space-y-4">
            {category.questions.map((faq, qIndex) => {
              const index = `${catIndex}-${qIndex}`;
              const isOpen = openIndex === catIndex * 100 + qIndex;

              return (
                <div key={index} className="bg-white rounded-lg shadow">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : catIndex * 100 + qIndex)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <span className="text-left font-semibold">{faq.q}</span>
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {isOpen && (
                    <div className="p-4 text-gray-600 border-t">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### **B. App Desktop - Help Center**

#### **1. Help Center Component**
```typescript
// desktop-app/greeting-friend-api-main/src/components/HelpCenter.jsx
import { useState } from "react";
import { X, Search, Book, HelpCircle } from "lucide-react";

export default function HelpCenter({ onClose }) {
  const [search, setSearch] = useState("");

  const categories = [
    {
      title: "Primi Passi",
      articles: [
        "Come iniziare",
        "Setup organizzazione",
        "Configurazione iniziale"
      ]
    },
    {
      title: "Trasporti",
      articles: [
        "Creare un trasporto",
        "Gestire clienti",
        "Calendario"
      ]
    },
    {
      title: "RVFU",
      articles: [
        "Gestione demolizioni",
        "Certificati",
        "Radiazioni"
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Centro Assistenza</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca nella documentazione..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {categories.map((category) => (
            <div key={category.title} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
              <div className="space-y-2">
                {category.articles
                  .filter(article => 
                    article.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((article) => (
                    <div
                      key={article}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      {article}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### **2. Integrazione nella Topbar**
```typescript
// desktop-app/greeting-friend-api-main/src/components/Topbar.jsx
// Aggiungere alla Topbar

const [showHelp, setShowHelp] = useState(false);

// Nel return, aggiungere:
<button
  onClick={() => setShowHelp(true)}
  className="p-2 hover:bg-gray-100 rounded"
  title="Centro Assistenza"
>
  <HelpCircle className="h-6 w-6" />
</button>

{showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
```

---

## ✅ TODO IMMEDIATO

### **Oggi**
- [ ] Creare i 3 file per sito web docs
- [ ] Creare HelpCenter component
- [ ] Integrare nella topbar
- [ ] Testare funzionamento

### **Questa Settimana**
- [ ] Scrivere contenuti guide moduli
- [ ] Aggiungere screenshot
- [ ] Implementare search nell'help
- [ ] Mobile responsive

---

## 🚀 PROSSIMI PASSI

1. **Subito**: Implementare file sopra
2. **Settimana prossima**: Guide moduli complete
3. **Mese prossimo**: Video tutorial

**INIZIARE IMPLEMENTAZIONE?** 🚀

