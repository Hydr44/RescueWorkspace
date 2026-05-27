'use strict';

/**
 * Middleware Express: blocca operazioni reali (firma / invio SdI / RENTRI /
 * RVFU) se l'org del chiamante è in modalità demo (orgs.is_demo=true).
 *
 * Defense-in-depth: il desktop blocca già lato UI (vedi useDemo.js), ma se
 * qualcuno colpisse direttamente l'API VPS bypasserebbe quel check. Qui
 * fermiamo a livello server.
 *
 * Identificazione `org_id`:
 *   - POST: legge da `req.body.org_id`
 *   - GET/DELETE: legge da `req.query.org_id`
 *   - Fallback header: `x-org-id` (utile per gateway che non passano body)
 *
 * Se non riesce a determinare org_id → passa (NON blocca). La giustizia
 * applicativa qui è "fail-open" per non rompere endpoint che non passano
 * org_id; le rotte sensibili dovrebbero comunque richiedere org_id come
 * parametro obbligatorio.
 *
 * Risposta 403 standard: `{ error: 'demo_mode', message: '...' }`.
 *
 * Uso:
 *   const requireNotDemo = require('./lib/require-not-demo')(getSupabase);
 *   app.use('/api/sdi/send-from-db', requireNotDemo, require('./routes/tx-from-db'));
 *
 * @param {Function} getSupabase  factory che ritorna il client Supabase
 *                                con service-role key (l'auth non passa per
 *                                JWT lato client, solo lookup admin).
 */
module.exports = function createRequireNotDemo(getSupabase) {
  return async function requireNotDemo(req, res, next) {
    try {
      const orgId =
        (req.body && req.body.org_id) ||
        (req.query && req.query.org_id) ||
        req.headers['x-org-id'] ||
        null;

      if (!orgId) {
        // Fail-open: nessun org_id determinabile, lascia passare.
        // Le rotte critiche dovrebbero comunque pretendere org_id come
        // parametro obbligatorio nel body e validarlo subito.
        return next();
      }

      let supabase;
      try { supabase = getSupabase(); }
      catch (e) {
        console.warn('[requireNotDemo] supabase init failed, fail-open:', e.message);
        return next();
      }

      const { data: org, error } = await supabase
        .from('orgs')
        .select('is_demo')
        .eq('id', orgId)
        .maybeSingle();

      if (error) {
        // Errore DB → log e fail-open (preferiamo non bloccare la prod per
        // un blip della rete; il rischio è basso visto il client gating).
        console.warn('[requireNotDemo] lookup error, fail-open:', error.message);
        return next();
      }

      if (org && org.is_demo === true) {
        console.warn('[requireNotDemo] BLOCKED demo org_id=%s path=%s', orgId, req.originalUrl);
        return res.status(403).json({
          error: 'demo_mode',
          message:
            'Operazione non disponibile in modalità demo. ' +
            'Per inviare a SDI/RENTRI/RVFU passa a un account produzione.'
        });
      }

      return next();
    } catch (err) {
      console.error('[requireNotDemo] uncaught error:', err);
      // Fail-open in caso di eccezione: meglio non rompere il flusso prod.
      return next();
    }
  };
};
