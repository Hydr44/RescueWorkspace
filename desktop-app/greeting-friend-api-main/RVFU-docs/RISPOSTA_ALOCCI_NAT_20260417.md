Ciao Massimiliano,

abbiamo eseguito la prova come indicato, mappando nel file hosts:

10.139.231.54 ssoformazione.ilportaledeltrasporto.it

La VPN è connessa (Cisco Secure Client, profilo utentiMCTC) e la tabella di routing include entrambe le subnet:

10.139/16      → utun8 (VPN)
10.220.220/24  → utun8 (VPN)

Purtroppo l'IP 10.139.231.54 non è raggiungibile su nessuna porta:

porta 80  → timeout
porta 443 → timeout
porta 8080 → timeout
porta 8443 → timeout

Stesso risultato per 10.220.222.45: nessuna porta risponde.

Potrebbe verificare lato sistemisti se la policy/NAT è effettivamente attiva?

Se può esserle utile per diagnosticare il problema, può provare a connettersi con le nostre credenziali VPN:

Utente: swh.scorazzini
Password: 349172MAa@

Grazie,
Rescue Manager S.R.L.
