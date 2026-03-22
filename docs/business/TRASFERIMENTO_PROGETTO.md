# 📦 Guida Trasferimento Progetto da Mac a Windows

## Problema
Il progetto si trova su un Mac e viene eseguito tramite condivisione di rete su Windows. Questo può causare:
- ❌ Problemi di permessi
- ❌ Lentezza nell'esecuzione
- ❌ Errori con npm/node_modules
- ❌ Problemi con percorsi e simboli link

## Soluzione: Copia Locale

### Metodo 1: Script Automatico (Consigliato)

#### PowerShell:
```powershell
# Dalla root del workspace
.\copia-progetto-locale.ps1
```

#### Batch:
```cmd
# Dalla root del workspace
copia-progetto-locale.bat
```

Lo script:
1. ✅ Copia il progetto in `%USERPROFILE%\Projects\rescuemanager-workspace`
2. ✅ Esclude `node_modules`, `.next`, `.git`, ecc.
3. ✅ Installa le dipendenze nella directory locale
4. ✅ Prepara tutto per l'avvio

### Metodo 2: Copia Manuale

1. **Crea una directory locale:**
```powershell
mkdir $env:USERPROFILE\Projects\rescuemanager-workspace
```

2. **Copia il progetto** (escludi queste cartelle):
   - `node_modules/`
   - `.next/`
   - `.vercel/`
   - `.git/`
   - File `.log`

3. **Vai nella directory website:**
```powershell
cd $env:USERPROFILE\Projects\rescuemanager-workspace\website
```

4. **Installa dipendenze:**
```powershell
npm install
```

5. **Avvia il server:**
```powershell
npm run dev
```

### Metodo 3: Usa Robocopy (Windows)

```cmd
robocopy "\\192.168.0.113\Projects\rescuemanager-workspace" "%USERPROFILE%\Projects\rescuemanager-workspace" /E /XD node_modules .next .vercel .git /XF *.log .DS_Store Thumbs.db
```

Poi:
```cmd
cd %USERPROFILE%\Projects\rescuemanager-workspace\website
npm install
npm run dev
```

## Dopo il Trasferimento

1. **Verifica che tutto sia stato copiato:**
```powershell
cd $env:USERPROFILE\Projects\rescuemanager-workspace\website
node test-start.js
```

2. **Crea/Verifica `.env.local`:**
```powershell
# Se non esiste, lo script start-dev.ps1 lo creerà automaticamente
.\start-dev.ps1
```

3. **Avvia il server:**
```powershell
npm run dev
```

## Vantaggi della Copia Locale

- ✅ **Velocità**: Esecuzione molto più veloce
- ✅ **Affidabilità**: Nessun problema di rete o permessi
- ✅ **Compatibilità**: Funziona perfettamente con npm/node_modules
- ✅ **Simboli link**: Funzionano correttamente su Windows locale

## Nota Importante

Dopo aver copiato il progetto localmente:
- ✅ Lavora sempre sulla copia locale
- ✅ Sincronizza le modifiche con il Mac quando necessario
- ✅ Non eseguire `npm install` o `npm run dev` dalla condivisione di rete

## Directory Consigliata

Il progetto verrà copiato in:
```
C:\Users\[TUO_USERNAME]\Projects\rescuemanager-workspace
```

Puoi cambiare la destinazione modificando lo script o specificandola come parametro:
```powershell
.\copia-progetto-locale.ps1 -Destinazione "C:\MiaDirectory\rescuemanager"
```

