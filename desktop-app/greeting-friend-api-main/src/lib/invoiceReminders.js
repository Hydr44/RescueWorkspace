// src/lib/invoiceReminders.js
// Logica solleciti automatici per fatture scadute
// Conforme normativa italiana — solleciti progressivi

import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Controlla fatture scadute e genera solleciti automatici
 * @param {string} orgId - ID organizzazione
 * @returns {Promise<{created: number, overdue: number, invoices: Array}>}
 */
export async function checkOverdueInvoices(orgId) {
  const supabase = supabaseBrowser();
  const today = new Date().toISOString().split('T')[0];

  // Trova fatture con scadenza passata e non ancora pagate
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, number, date, total, customer_name, payment_status, meta')
    .eq('org_id', orgId)
    .in('payment_status', ['pending', 'partial'])
    .not('sdi_status', 'in', '("draft","rejected")');

  if (error) throw error;

  const overdue = [];
  for (const inv of (invoices || [])) {
    const scadenza = inv.meta?.sdi?.pagamento?.scadenza;
    if (scadenza && scadenza < today) {
      overdue.push(inv);

      // Aggiorna stato a overdue se non lo è già
      if (inv.payment_status !== 'overdue') {
        // Verifica che non sia partial (partial resta partial)
        if (inv.payment_status === 'pending') {
          await supabase
            .from('invoices')
            .update({ payment_status: 'overdue' })
            .eq('id', inv.id);
        }
      }
    }
  }

  return { overdue: overdue.length, invoices: overdue };
}

/**
 * Genera un sollecito per una fattura scaduta
 * @param {string} invoiceId - ID fattura
 * @param {string} orgId - ID organizzazione
 * @param {object} options
 * @param {string} options.type - Tipo sollecito: 'first', 'second', 'third', 'legal'
 * @param {string} options.notes - Note aggiuntive
 * @returns {Promise<{success: boolean, reminder_id?: string}>}
 */
export async function createReminder(invoiceId, orgId, options = {}) {
  const supabase = supabaseBrowser();
  const { type = 'first', notes = '' } = options;

  // Verifica solleciti esistenti per questa fattura
  const { data: existing } = await supabase
    .from('invoice_reminders')
    .select('id, reminder_type, status')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  // Determina tipo automatico basato su solleciti precedenti
  let autoType = type;
  if (type === 'first' && existing?.length > 0) {
    const lastType = existing[0].reminder_type;
    if (lastType === 'first') autoType = 'second';
    else if (lastType === 'second') autoType = 'third';
    else if (lastType === 'third') autoType = 'legal';
  }

  const { data, error } = await supabase
    .from('invoice_reminders')
    .insert({
      invoice_id: invoiceId,
      org_id: orgId,
      reminder_date: new Date().toISOString().split('T')[0],
      reminder_type: autoType,
      status: 'pending',
      notes: notes || getDefaultReminderText(autoType),
    })
    .select('id')
    .single();

  if (error) throw error;
  return { success: true, reminder_id: data?.id, type: autoType };
}

/**
 * Recupera solleciti per una fattura
 * @param {string} invoiceId - ID fattura
 * @returns {Promise<Array>}
 */
export async function getReminders(invoiceId) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from('invoice_reminders')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Segna un sollecito come inviato
 * @param {string} reminderId - ID sollecito
 * @returns {Promise<void>}
 */
export async function markReminderSent(reminderId) {
  const supabase = supabaseBrowser();
  const { error } = await supabase
    .from('invoice_reminders')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', reminderId);
  if (error) throw error;
}

/**
 * Testo predefinito per tipo sollecito
 */
function getDefaultReminderText(type) {
  switch (type) {
    case 'first':
      return 'Gentile Cliente, Le ricordiamo che la fattura indicata risulta scaduta. La preghiamo di provvedere al pagamento entro 15 giorni dalla presente.';
    case 'second':
      return 'Gentile Cliente, facciamo seguito alla nostra precedente comunicazione per ricordarLe che la fattura indicata risulta ancora insoluta. La preghiamo di provvedere al saldo con urgenza.';
    case 'third':
      return 'Gentile Cliente, nonostante i precedenti solleciti, la fattura indicata risulta ancora non pagata. La informiamo che, in assenza di pagamento entro 10 giorni, saremo costretti ad adire le vie legali.';
    case 'legal':
      return 'DIFFIDA DI PAGAMENTO — La presente vale come formale messa in mora ai sensi dell\'art. 1219 c.c. In assenza di pagamento entro 10 giorni dal ricevimento, si procederà al recupero del credito nelle sedi competenti.';
    default:
      return '';
  }
}
