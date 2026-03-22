# Come Funziona il Prelievo SDI-SFTP

## 📖 Dal Manuale (Sezione 2.1 e 2.3)

### Modalità di Connessione
- **SDI è il CLIENT** che si collega al server SFTP del Nodo
- **Il colloquio avviene su iniziativa del client SDI** (non del Nodo)
- SDI gestisce i flussi accedendo direttamente al server SFTP del Nodo
- SDI effettua azioni di **"get"** (prelievo) e **"put"** (invio)

### Calendario di Connessione
- Modalità **H24 – 365 giorni**
- SDI si collega periodicamente per gestire i flussi
- Durante una connessione, SDI può prelevare/inviare file

## 🔍 Cosa Significa "SDI Si È Collegato"?

### Il Semaforo (`semaforodaSogei.log`)
- Indica che **SDI si è collegato** al server SFTP
- **NON indica** necessariamente che ha prelevato file

### Possibili Scenari Quando SDI Si Collega

1. **SDI controlla la directory**
   - Lista i file presenti in `DatiVersoSdITest`
   - Verifica nomenclatura, formato, presenza

2. **SDI valida i file (prima del prelievo?)**
   - Potrebbe verificare:
     - Nomenclatura corretta
     - Dimensione file
     - Presenza file
     - (Possibilmente) validazione preliminare formato/cifratura

3. **SDI preleva i file validi**
   - Se il file passa i controlli, SDI lo preleva (operazione "get")
   - Il file scompare dalla directory `DatiVersoSdITest`

4. **SDI non preleva file non validi**
   - Se il file NON passa i controlli, SDI potrebbe:
     - Non prelevarlo (file rimane in directory)
     - Generare file di errore ER (ma potrebbe farlo dopo elaborazione)

## ⚠️ Il Nostro Caso

### Situazione
- File caricato alle 00:50
- SDI collegato alle 00:55 (5 minuti dopo)
- **File ancora presente** (non prelevato)

### Possibili Cause

1. **File non valido (più probabile)**
   - SDI ha controllato il file ma ha riscontrato problemi
   - Problemi possibili:
     - Nomenclatura non conforme
     - Formato PKCS#7 non valido
     - Firma/cifratura non valida
     - Certificati non corretti
     - Formato XML interno non conforme

2. **Logica di prelievo separata**
   - SDI potrebbe prelevare in un momento successivo
   - Potrebbe esserci una coda di elaborazione

3. **Ambiente di test**
   - In ambiente di test, SDI potrebbe avere logiche diverse
   - Prelievo più lento/differito

## 🎯 Conclusione

**No, il collegamento NON garantisce il prelievo immediato.**

SDI si collega periodicamente e:
- **Controlla** i file disponibili
- **Valida** i file (probabilmente)
- **Preleva** solo i file validi
- **Non preleva** file non validi (rimangono in directory)

Se il file è ancora presente dopo il collegamento, è probabile che:
- SDI ha controllato ma ha trovato problemi
- Il file non è conforme alle specifiche
- SDI non può prelevarlo/elaborarlo

## 📝 Prossimi Passi

1. **Verificare se il file viene prelevato in un secondo momento**
2. **Controllare se arrivano file ER (errore)**
3. **Verificare formato/cifratura del file**
4. **Contattare SDI se il problema persiste**

