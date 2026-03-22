# Certificati RENTRI (Ambiente Demo)

- Certificato dominio: `SCZMNL05L21D960T.p12`
- Password PKCS#12: `WY6?9xSH`
- Derivati:
  - `SCZMNL05L21D960T.key.pem` – chiave privata senza passphrase (PEM)
  - `SCZMNL05L21D960T.crt.pem` – certificato client
  - `SCZMNL05L21D960T-chain.pem` – eventuale catena CA

## Utilizzo rapido

```bash
# Test handshake MTLS
curl https://demoapi.rentri.gov.it/status \
  --cert SCZMNL05L21D960T.crt.pem \
  --key SCZMNL05L21D960T.key.pem \
  --cacert SCZMNL05L21D960T-chain.pem
```

- Conservare il `.p12` originale come backup.
- Non condividere la password al di fuori del team autorizzato.
