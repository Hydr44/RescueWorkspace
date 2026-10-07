-- Email dell'autista sulla scheda, presa dall'account quando manca.
--
-- Chi si e' abbinato col codice QR (pair/exchange) ha l'account collegato
-- (auth_user_id) ma la scheda staff_drivers senza email: dal gestionale il
-- titolare non vedeva con quale indirizzo l'autista era entrato. In prod oggi
-- (08/10/2026) e' una scheda su dieci; il gestionale ora ripiega da solo sul
-- profilo, questo allinea anche il dato.
-- Il trigger trg_sync_staff_driver copia il cambiamento sulla tabella legacy
-- `drivers`: voluto.

update public.staff_drivers s
   set email = p.email
  from public.profiles p
 where p.id = s.auth_user_id
   and coalesce(btrim(s.email), '') = ''
   and p.email is not null;
