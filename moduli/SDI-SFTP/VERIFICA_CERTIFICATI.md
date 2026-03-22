# Verifica Certificati Caricati sulla VPS

## Comando di Verifica

```bash
ssh root@217.154.118.37 "ls -la /opt/sdi-certs/"
```

Dovresti vedere 4 file:
- `EMMAT002.SCZMNL05L21D960T.firma.p12` (-rw-------)
- `EMMAT002.SCZMNL05L21D960T.cifra.p12` (-rw-------)
- `sogeiunicocifra.pem` (-rw-------)
- `CAEntrate.pem` (-rw-------)

Tutti con permessi `-rw-------` (600) e proprietario `root:root`.

## Prossimi Passi

1. ✅ Certificati caricati sulla VPS
2. ⏳ Configurare variabili d'ambiente su Vercel
3. ⏳ Testare connessione SFTP
4. ⏳ Perfezionare generazione XML FatturaPA
5. ⏳ Testare invio prima fattura via SFTP

