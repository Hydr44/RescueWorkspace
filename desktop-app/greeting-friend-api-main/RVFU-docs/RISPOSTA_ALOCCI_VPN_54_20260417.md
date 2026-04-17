Gentile Massimiliano,

abbiamo aggiornato il file hosts come indicato:

10.139.231.54 ssoformazione.ilportaledeltrasporto.it

La nostra VPN è connessa (Cisco Secure Client 5.1.14.145, profilo utentiMCTC).

Purtroppo l'IP 10.139.231.54 non risulta raggiungibile. Di seguito i test eseguiti:

---

Test eseguiti il 17/04/2026 ore 12:38 CEST

1. Connessione TCP porta 443:

   $ nc -z -w 5 10.139.231.54 443
   → Timeout, nessuna risposta

2. Chiamata curl authenticate:

   $ curl -sk --connect-timeout 10 \
     --resolve 'ssoformazione.ilportaledeltrasporto.it:443:10.139.231.54' \
     -X POST 'https://ssoformazione.ilportaledeltrasporto.it/sso/json/realms/root/realms/pdtusers/authenticate' \
     -H 'Content-Type: application/json' \
     -H 'X-OpenAM-Username: DETO003001' \
     -H 'X-OpenAM-Password: TEST.030' \
     -H 'Accept-API-Version: resource=2.0, protocol=1.0'
   → Timeout dopo 10 secondi (HTTP code 000)

3. Verifica routing VPN:

   $ netstat -rn | grep 10.139
   10.139/16  10.180.0.249  UGSc  utun8
   → La rotta per la subnet 10.139/16 è presente nel tunnel VPN

4. Stato VPN:

   $ /opt/cisco/secureclient/bin/vpn state
   >> state: Connesso
   >> notice: Connesso a anyvpn.ilportaledellautomobilista.it/utentiMCTC

---

La VPN è attiva e la rotta verso 10.139/16 c'è, ma l'IP 10.139.231.54 non risponde sulla porta 443. Potrebbe verificare che il servizio sia in ascolto su quell'indirizzo?

Grazie,
Rescue Manager S.R.L.
