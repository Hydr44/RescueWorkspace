/**
 * Persistenza dello stato del monitor su Supabase (service_role, bypassa RLS).
 * Tabelle: regulatory_monitor_state (1 riga per fonte) + regulatory_monitor_events (storico).
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const STATE = 'regulatory_monitor_state';
const EVENTS = 'regulatory_monitor_events';

async function getState(sourceId) {
  const { data, error } = await supabase
    .from(STATE)
    .select('*')
    .eq('source_id', sourceId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Upsert dello stato. I campi non passati restano invariati sul conflitto,
 * così un salvataggio "solo last_checked_at" non azzera items/signature.
 */
async function saveState(row) {
  const { error } = await supabase
    .from(STATE)
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'source_id' });
  if (error) throw error;
}

async function logEvent(evt) {
  const { error } = await supabase.from(EVENTS).insert(evt);
  if (error) console.error('[STORE] logEvent fallito:', error.message);
}

module.exports = { supabase, getState, saveState, logEvent };
