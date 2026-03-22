# Caricamento Certificati SDI sulla VPS

## File da Caricare

I seguenti file devono essere caricati sulla VPS in `/opt/sdi-certs/`:

1. `EMMAT002.SCZMNL05L21D960T.firma.p12` - Certificato per firma
2. `EMMAT002.SCZMNL05L21D960T.cifra.p12` - Certificato per decifratura
3. `sogeiunicocifra.pem` - Certificato pubblico Sogei per cifratura
4. `CAEntrate.pem` - Certificato CA per verifica firma

**Password certificati**: `IBVvOZqq`

## Metodo 1: Usando SCP Manualmente

```bash
cd /Users/sign.rascozzarini/Projects/rescuemanager-workspace/moduli/SDI-SFTP

# Carica i file uno per uno (ti chiederà la password)
scp "Chiavi erogate con istruzioni/EMMAT002.SCZMNL05L21D960T.firma.p12" root@217.154.118.37:/opt/sdi-certs/
scp "Chiavi erogate con istruzioni/EMMAT002.SCZMNL05L21D960T.cifra.p12" root@217.154.118.37:/opt/sdi-certs/
scp "Chiavi erogate con istruzioni/sogeiunicocifra.pem" root@217.154.118.37:/opt/sdi-certs/
scp "Chiavi erogate con istruzioni/CAEntrate.pem" root@217.154.118.37:/opt/sdi-certs/

# Password VPS: 1x9Wa2eW
```

## Metodo 2: Usando SSH e cat (se SCP non funziona)

```bash
# Crea directory sulla VPS
ssh root@217.154.118.37 "mkdir -p /opt/sdi-certs && chmod 700 /opt/sdi-certs"

# Carica file usando base64 (per evitare problemi di encoding)
cd "Chiavi erogate con istruzioni"

cat EMMAT002.SCZMNL05L21D960T.firma.p12 | base64 | ssh root@217.154.118.37 "base64 -d > /opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.firma.p12"
cat EMMAT002.SCZMNL05L21D960T.cifra.p12 | base64 | ssh root@217.154.118.37 "base64 -d > /opt/sdi-certs/EMMAT002.SCZMNL05L21D960T.cifra.p12"
cat sogeiunicocifra.pem | ssh root@217.154.118.37 "cat > /opt/sdi-certs/sogeiunicocifra.pem"
cat CAEntrate.pem | ssh root@217.154.118.37 "cat > /opt/sdi-certs/CAEntrate.pem"

# Password VPS: 1x9Wa2eW
```

## Impostazione Permessi

Dopo il caricamento, connettiti alla VPS e imposta i permessi:

```bash
ssh root@217.154.118.37
# Password: 1x9Wa2eW

# Imposta permessi
chmod 600 /opt/sdi-certs/*
chown root:root /opt/sdi-certs/*

# Verifica
ls -la /opt/sdi-certs/

# Dovresti vedere:
# -rw------- 1 root root 4508 Jan 12 ... EMMAT002.SCZMNL05L21D960T.cifra.p12
# -rw------- 1 root root 4508 Jan 12 ... EMMAT002.SCZMNL05L21D960T.firma.p12
# -rw------- 1 root root 2224 Jan 12 ... sogeiunicocifra.pem
# -rw------- 1 root root 1976 Jan 12 ... CAEntrate.pem
```

## Verifica Finale

```bash
ssh root@217.154.118.37 "ls -la /opt/sdi-certs/ && echo '✅ Certificati caricati correttamente'"
```

## Note

- I certificati `.p12` contengono chiavi private - mantenere sempre sicuri (permessi 600)
- La password per estrarre le chiavi dai file `.p12` è: `IBVvOZqq`
- I certificati sono già nella directory: `moduli/SDI-SFTP/Chiavi erogate con istruzioni/`

