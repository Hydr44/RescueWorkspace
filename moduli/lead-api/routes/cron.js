/**
 * Cron/Manual Routes
 * POST /api/cron/expire-demos
 * POST /api/cron/expire-quotes
 * GET  /api/cron/status
 */

const express = require('express');

module.exports = function createCronRouter(supabase) {
  const router = express.Router();

  /**
   * POST /api/cron/expire-demos
   * Scade demo account manualmente
   */
  router.post('/expire-demos', async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('expire_demo_accounts');
      if (error) throw error;
      const count = data?.[0]?.expired_count || 0;
      res.json({ success: true, expired_count: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/cron/expire-quotes
   * Scade preventivi manualmente
   */
  router.post('/expire-quotes', async (req, res) => {
    try {
      const { data, error } = await supabase.rpc('expire_quotes');
      if (error) throw error;
      const count = data?.[0]?.expired_count || 0;
      res.json({ success: true, expired_count: count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/cron/status
   * Stato cron jobs e statistiche
   */
  router.get('/status', async (req, res) => {
    try {
      // Demo attive
      const { count: activeDemos } = await supabase
        .from('lead_demos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Demo in scadenza (prossime 24h)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { count: expiringDemos } = await supabase
        .from('lead_demos')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('expires_at', tomorrow);

      // Preventivi in scadenza
      const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { count: expiringQuotes } = await supabase
        .from('lead_quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sent', 'viewed'])
        .lt('expiry_date', tomorrowDate);

      // Preventivi pending
      const { count: pendingQuotes } = await supabase
        .from('lead_quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sent', 'viewed']);

      res.json({
        success: true,
        stats: {
          active_demos: activeDemos || 0,
          expiring_demos_24h: expiringDemos || 0,
          pending_quotes: pendingQuotes || 0,
          expiring_quotes_24h: expiringQuotes || 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
