# 🔍 Verifica Contenuto ZIP

## Analisi Codice Attuale

### Nome File XML Interno

**Codice (server.js, riga 229):**
```javascript
const filename = `IT${idNodo}_${invoice.number || invoice.id}.xml`;
```

**Esempio risultante:**
- Se `idNodo = "02166430856"` e `invoice.number = "1"`
- Risultato: `IT02166430856_1.xml`

---

## 📚 Documentazione SDI

Dal manuale SDI (paragrafo 2.2, caso c - file compresso):

### Nomenclatura File XML Interni

> "Nel caso c) il nome del file deve rispettare la stessa nomenclatura e l'estensione del file può essere solo .zip."

**Formato richiesto:**
```
IT{IdCodice}_{progressivo}.xml
```

Dove:
- **IT**: Codice paese (fisso per Italia)
- **IdCodice**: Identificativo fiscale (11-16 caratteri per IT)
- **progressivo**: Stringa alfanumerica, **massimo 5 caratteri**, valori ammessi [a-z], [A-Z], [0-9]
- Separatore: underscore (`_`)
- Estensione: `.xml`

**Esempi dal manuale:**
- `ITAAABBB99T99X999W_00002.xml`
- `IT99999999999_00002.xml`

---

## ⚠️ Possibile Problema

### Progressivo

Il nostro codice usa:
- `invoice.number` (che potrebbe essere un numero generico)
- `invoice.id` (UUID, che è sicuramente troppo lungo e contiene caratteri non validi)

**Problema:**
- Il progressivo deve essere **massimo 5 caratteri**
- Deve essere **alfanumerico** [a-z], [A-Z], [0-9]
- `invoice.id` è un UUID (es: `5f8cba7c-c536-4f0c-a210-5c1e4a3c0d20`) che è:
  - ❌ Troppo lungo (36 caratteri)
  - ❌ Contiene caratteri non validi (`-`)
  - ❌ Non conforme al formato richiesto

---

## 🔍 Verifica Necessaria

1. **Controllare formato progressivo** - Deve essere alfanumerico, max 5 caratteri
2. **Verificare contenuto ZIP reale** - Cosa contiene effettivamente il ZIP generato?
3. **Confrontare con esempi manuale** - I nomi file sono conformi?

