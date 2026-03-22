# 🧪 Test Decifratura File SDI

## Obiettivo

Verificare che dopo la decifratura del file caricato su SDI, si ottenga un ZIP valido contenente i documenti XML.

## Processo

Il file caricato segue questa sequenza:
1. ZIP (con XML) → Firma (PKCS#7 SignedData) → Cifra (PKCS#7 EnvelopedData)

SDI deve:
1. Decifrare il file (PKCS#7 EnvelopedData) → ottiene file firmato
2. Verificare la firma (PKCS#7 SignedData) → ottiene ZIP
3. Estrarre il ZIP → ottiene XML

Se SDI non riesce a trovare i documenti, potrebbe essere:
- Problema nella decifratura
- Problema nella verifica firma
- Problema nell'estrazione ZIP
- Contenuto ZIP non valido

