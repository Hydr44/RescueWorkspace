/**
 * Controllo consumo vs limiti per ogni organizzazione + invio avvisi.
 *
 * Fonte limiti effettivi:  rpc get_org_effective_limits(org)  (override org sopra il piano)
 * Fonte consumo:           rpc get_org_usage(org)             (contatori mensili + storage_bytes)
 * Anti-doppione:           tabella usage_alerts (org, period, metric, threshold)
 *
 * L'avviso viene REGISTRATO solo dopo un invio riuscito (o se non c'è email):
 * così un invio fallito viene ritentato al giro successivo, senza spammare.
 */
const { createClient } = require('@supabase/supabase-js');
const { sendEmail, buildUsageAlertEmail } = require('./email');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// consulenze IA ~ per euro di budget (coerente con admin panel / dashboard)
const AI_OPS_PER_EUR = 60;

const METERED = [
  { key: 'storage',     usageKey: 'storage_bytes', limitKey: 'storage_gb',        label: 'Archivio' },
  { key: 'autocompile', usageKey: 'autocompile',   limitKey: 'autocompile_month', label: 'Compilazioni automatiche' },
  { key: 'sms',         usageKey: 'sms',           limitKey: 'sms_month',         label: 'SMS / messaggi' },
  { key: 'ai_eur',      usageKey: 'ai_eur',        limitKey: 'ai_budget_eur',     label: 'Consulente IA' },
];

function fmtBytes(b) {
  if (!(b > 0)) return '0 MB';
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
}

function isValidEmail(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// Email dell'org: prima org_settings.company.email, poi il titolare (org_members → profiles).
// Fallback ristretto a owner/operator: MAI a un 'autista', per non recapitargli avvisi
// di piano/fatturazione. Se nessuno ha email valida → null (l'avviso verrà ritentato).
async function orgEmail(orgId) {
  const { data: cs } = await supabase
    .from('org_settings').select('value').eq('org_id', orgId).eq('key', 'company').maybeSingle();
  const cEmail = cs && cs.value && cs.value.email;
  if (isValidEmail(cEmail)) return cEmail;

  const { data: members } = await supabase
    .from('org_members').select('user_id, role').eq('org_id', orgId);
  const recipient =
    (members || []).find((m) => m.role === 'owner') ||
    (members || []).find((m) => m.role === 'operator');
  if (!recipient || !recipient.user_id) return null;

  const { data: prof } = await supabase
    .from('profiles').select('email').eq('id', recipient.user_id).maybeSingle();
  return prof && isValidEmail(prof.email) ? prof.email : null;
}

async function runCheck({ dry = false } = {}) {
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  console.log(`[USAGE] Avvio controllo (period=${period}, dry=${dry})`);

  const { data: orgs, error: orgsErr } = await supabase.from('orgs').select('id, is_demo, name');
  if (orgsErr) throw orgsErr;
  const targets = (orgs || []).filter((o) => o.is_demo !== true);

  const { data: sent } = await supabase
    .from('usage_alerts').select('org_id, metric, threshold').eq('period', period);
  const already = new Set((sent || []).map((s) => `${s.org_id}|${s.metric}|${s.threshold}`));

  let checked = 0, emails = 0;

  for (const org of targets) {
    checked++;
    let eff, usg;
    try {
      const [r1, r2] = await Promise.all([
        supabase.rpc('get_org_effective_limits', { p_org_id: org.id }),
        supabase.rpc('get_org_usage', { p_org_id: org.id }),
      ]);
      eff = r1.data; usg = r2.data;
    } catch (e) {
      console.error(`[USAGE] rpc fallita per ${org.id}:`, e.message);
      continue;
    }
    if (!eff) continue;
    const usage = usg || {};

    const crossings = [];
    for (const m of METERED) {
      // IA: salta se il piano non include il Consulente IA (anche con budget da override).
      if (m.key === 'ai_eur' && eff.ai_included === false) continue;
      const limit = Number(eff[m.limitKey]);
      if (!limit || limit <= 0) continue;
      const raw = Number(usage[m.usageKey] || 0);
      let usedInUnit, usedStr, maxStr;
      if (m.key === 'storage') {
        usedInUnit = raw / 1024 ** 3; usedStr = fmtBytes(raw); maxStr = `${limit} GB`;
      } else if (m.key === 'ai_eur') {
        usedInUnit = raw;
        usedStr = `~${Math.round(raw * AI_OPS_PER_EUR)} consulenze`;
        maxStr = `~${Math.round(limit * AI_OPS_PER_EUR)} consulenze/mese`;
      } else {
        usedInUnit = raw; usedStr = `${Math.round(raw)}`; maxStr = `${Math.round(limit)} /mese`;
      }
      const pct = (usedInUnit / limit) * 100;
      const threshold = pct >= 100 ? 100 : pct >= 80 ? 80 : 0;
      if (!threshold || already.has(`${org.id}|${m.key}|${threshold}`)) continue;
      crossings.push({ metric: m.key, threshold, label: m.label, usedStr, maxStr, pct: Math.round(pct) });
    }
    if (!crossings.length) continue;

    const email = await orgEmail(org.id);
    for (const c of crossings) {
      if (dry) continue; // dry-run: nessun claim, nessun invio (solo il log sotto)
      // claim-before-send: inseriamo PRIMA la riga; inviamo solo se l'abbiamo creata noi.
      // Così due run sovrapposti non mandano due email (uno solo vince l'insert), e un
      // avviso senza destinatario / con invio fallito viene rilasciato e ritentato.
      const { data: claimed, error: claimErr } = await supabase
        .from('usage_alerts')
        .upsert(
          { org_id: org.id, period, metric: c.metric, threshold: c.threshold },
          { onConflict: 'org_id,period,metric,threshold', ignoreDuplicates: true }
        )
        .select('org_id');
      if (claimErr) {
        console.error(`[USAGE] claim fallito ${org.id}/${c.metric}@${c.threshold}:`, claimErr.message);
        continue;
      }
      if (!claimed || claimed.length === 0) continue; // già gestito da un run precedente

      const release = () =>
        supabase.from('usage_alerts').delete()
          .match({ org_id: org.id, period, metric: c.metric, threshold: c.threshold });

      if (!email) {
        await release(); // nessun destinatario: rilascia così riparte appena c'è un'email
        console.warn(`[USAGE] ${org.name || org.id}: ${c.metric}@${c.threshold}% — nessuna email, non inviato (ritenterà)`);
        continue;
      }
      try {
        const { subject, html, text } = buildUsageAlertEmail(org, c);
        await sendEmail({ to: email, subject, html, text });
        emails++;
      } catch (e) {
        await release(); // invio fallito: rilascia il claim per ritentare al giro successivo
        console.error(`[USAGE] invio fallito ${org.id}/${c.metric}@${c.threshold}:`, e.message);
      }
    }
    const cross = crossings.map((c) => `${c.metric}@${c.threshold}(${c.pct}%)`).join(', ');
    const dest = email || '(nessuna email)';
    console.log(`[USAGE] ${org.name || org.id}: ${cross} → ${dest}${dry ? ' [DRY]' : ''}`);
  }

  console.log(`[USAGE] Fatto. org=${checked}, email inviate=${emails}, dry=${dry}, period=${period}`);
  return { checked, emails, period };
}

module.exports = { runCheck };
