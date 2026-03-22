/**
 * Sistema Notifiche Email Unificato
 * Usa Edge Function send-email + Resend API
 * Tutte le email partono da noreply@rescuemanager.eu
 */

import { supabaseBrowser } from './supabase-browser';

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://ienzdgrqalltvkdkuamp.functions.supabase.co';

/**
 * Invia notifica email generica
 * @param {Object} params
 * @param {string} params.to - Email destinatario
 * @param {string} params.title - Titolo/oggetto email
 * @param {string} params.message - Corpo del messaggio
 * @param {string} [params.actionUrl] - URL pulsante azione (opzionale)
 * @param {string} [params.actionLabel] - Testo pulsante azione (opzionale)
 * @param {string} [params.orgName] - Nome organizzazione (opzionale, per personalizzazione)
 */
export async function sendEmailNotification({ to, title, message, actionUrl, actionLabel, orgName, attachmentBase64, attachmentName }) {
  try {
    const supabase = supabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utente non autenticato');
    }

    const response = await fetch(`${EDGE_FUNCTION_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        type: 'notification',
        to,
        data: {
          title,
          message: orgName ? `${message}\n\nOrganizzazione: ${orgName}` : message,
          action_url: actionUrl,
          action_label: actionLabel,
          attachment_base64: attachmentBase64 || null,
          attachment_name: attachmentName || null,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore invio email');
    }

    const result = await response.json();
    console.log(' Email notifica inviata:', result);
    return result;
  } catch (error) {
    console.error(' Errore invio email notifica:', error);
    throw error;
  }
}

/**
 * Invia notifica scadenza (es. revisione, assicurazione, bollo)
 * @param {Object} params
 * @param {string} params.to - Email destinatario
 * @param {string} params.vehiclePlate - Targa veicolo
 * @param {string} params.scadenzaTipo - Tipo scadenza (revisione, assicurazione, bollo)
 * @param {string} params.scadenzaData - Data scadenza
 * @param {number} params.giorniMancanti - Giorni mancanti alla scadenza
 * @param {string} params.orgName - Nome organizzazione
 */
export async function sendScadenzaNotification({ to, vehiclePlate, scadenzaTipo, scadenzaData, giorniMancanti, orgName }) {
  const tipoLabels = {
    revisione: 'Revisione',
    assicurazione: 'Assicurazione',
    bollo: 'Bollo Auto',
  };

  const title = ` Scadenza ${tipoLabels[scadenzaTipo]} - ${vehiclePlate}`;
  const message = `Il veicolo ${vehiclePlate} ha la ${tipoLabels[scadenzaTipo].toLowerCase()} in scadenza tra ${giorniMancanti} giorni (${scadenzaData}).

Si prega di provvedere al rinnovo per evitare sanzioni.`;

  return sendEmailNotification({
    to,
    title,
    message,
    orgName,
    actionUrl: `https://rescuemanager.eu/mezzi?search=${vehiclePlate}`,
    actionLabel: 'Visualizza Veicolo',
  });
}

/**
 * Invia notifica nuovo trasporto assegnato
 * @param {Object} params
 * @param {string} params.to - Email autista
 * @param {string} params.transportId - ID trasporto
 * @param {string} params.pickupAddress - Indirizzo ritiro
 * @param {string} params.dropoffAddress - Indirizzo consegna
 * @param {string} params.customerName - Nome cliente
 * @param {string} params.orgName - Nome organizzazione
 */
export async function sendTransportAssignedNotification({ to, transportId, pickupAddress, dropoffAddress, customerName, orgName }) {
  const title = ` Nuovo Trasporto Assegnato`;
  const message = `Ti è stato assegnato un nuovo trasporto:

Cliente: ${customerName}
Ritiro: ${pickupAddress}
Consegna: ${dropoffAddress}

Controlla l'app per i dettagli completi.`;

  return sendEmailNotification({
    to,
    title,
    message,
    orgName,
    actionUrl: `https://rescuemanager.eu/trasporti/${transportId}`,
    actionLabel: 'Visualizza Trasporto',
  });
}

/**
 * Invia notifica fattura scaduta/sollecito
 * @param {Object} params
 * @param {string} params.to - Email cliente
 * @param {string} params.invoiceNumber - Numero fattura
 * @param {string} params.amount - Importo fattura
 * @param {string} params.dueDate - Data scadenza
 * @param {number} params.daysOverdue - Giorni di ritardo
 * @param {string} params.orgName - Nome organizzazione
 */
export async function sendInvoiceReminderNotification({ to, invoiceNumber, amount, dueDate, daysOverdue, orgName }) {
  const title = daysOverdue > 0 
    ? ` Sollecito Pagamento - Fattura ${invoiceNumber}`
    : ` Promemoria Scadenza - Fattura ${invoiceNumber}`;
  
  const message = daysOverdue > 0
    ? `La fattura n. ${invoiceNumber} del ${dueDate} per un importo di ${amount} risulta scaduta da ${daysOverdue} giorni.

Si prega di provvedere al pagamento con urgenza per evitare ulteriori azioni.`
    : `La fattura n. ${invoiceNumber} scadrà il ${dueDate} per un importo di ${amount}.

Si prega di provvedere al pagamento entro la data indicata.`;

  return sendEmailNotification({
    to,
    title,
    message,
    orgName,
    actionUrl: `https://rescuemanager.eu/fatture/${invoiceNumber}`,
    actionLabel: 'Visualizza Fattura',
  });
}

/**
 * Invia fattura via email al cliente
 * @param {Object} params
 * @param {string} params.to - Email cliente
 * @param {string} params.invoiceNumber - Numero fattura
 * @param {string} params.invoiceDate - Data fattura
 * @param {string} params.amount - Importo totale
 * @param {string} params.pdfUrl - URL PDF fattura
 * @param {string} params.customerName - Nome cliente
 * @param {string} params.orgName - Nome organizzazione
 * @param {string} [params.ccEmail] - Email CC (opzionale)
 */
export async function sendInvoiceEmail({ to, invoiceNumber, invoiceDate, amount, pdfUrl, customerName, orgName, ccEmail, attachmentBase64, attachmentName }) {
  const title = ` Fattura ${invoiceNumber} - ${orgName}`;
  const message = `Gentile ${customerName},

In allegato troverai la fattura n. ${invoiceNumber} del ${invoiceDate} per un importo di ${amount}.

Puoi scaricare il PDF della fattura cliccando sul pulsante qui sotto.

Per qualsiasi domanda o chiarimento, non esitare a contattarci.

Cordiali saluti,
${orgName}`;

  return sendEmailNotification({
    to,
    title,
    message,
    actionUrl: pdfUrl,
    actionLabel: pdfUrl ? 'Scarica Fattura PDF' : undefined,
    orgName,
    attachmentBase64,
    attachmentName,
  });
}

/**
 * Invia preventivo via email al cliente
 * @param {Object} params
 * @param {string} params.to - Email cliente
 * @param {string} params.quoteNumber - Numero preventivo
 * @param {string} params.quoteDate - Data preventivo
 * @param {string} params.amount - Importo totale
 * @param {string} params.pdfUrl - URL PDF preventivo
 * @param {string} params.customerName - Nome cliente
 * @param {string} params.orgName - Nome organizzazione
 * @param {number} [params.validityDays] - Giorni validità preventivo (default 30)
 */
export async function sendQuoteEmail({ to, quoteNumber, quoteDate, amount, pdfUrl, customerName, orgName, validityDays = 30 }) {
  const title = ` Preventivo ${quoteNumber} - ${orgName}`;
  const message = `Gentile ${customerName},

Come richiesto, ti inviamo il preventivo n. ${quoteNumber} del ${quoteDate} per un importo di ${amount}.

Il preventivo è valido per ${validityDays} giorni dalla data di emissione.

Puoi scaricare il PDF del preventivo cliccando sul pulsante qui sotto.

Per qualsiasi domanda o per confermare l'ordine, non esitare a contattarci.

Cordiali saluti,
${orgName}`;

  return sendEmailNotification({
    to,
    title,
    message,
    actionUrl: pdfUrl,
    actionLabel: 'Scarica Preventivo PDF',
    orgName,
  });
}

/**
 * Invia conferma appuntamento via email al cliente
 * @param {Object} params
 * @param {string} params.to - Email cliente
 * @param {string} params.customerName - Nome cliente
 * @param {string} params.eventTitle - Titolo appuntamento
 * @param {string} params.eventDate - Data formattata (es. "07 marzo 2026")
 * @param {string} params.eventTime - Orario (es. "10:00 - 11:00")
 * @param {string} [params.eventLocation] - Luogo (opzionale)
 * @param {string} [params.eventDescription] - Descrizione (opzionale)
 * @param {string} params.orgName - Nome organizzazione
 * @param {string} [params.orgPhone] - Telefono organizzazione (opzionale)
 */
export async function sendAppointmentEmail({ to, customerName, eventTitle, eventDate, eventTime, eventLocation, eventDescription, orgName, orgPhone }) {
  const title = `Conferma Appuntamento - ${eventTitle}`;
  const locationLine = eventLocation ? `\nLuogo: ${eventLocation}` : '';
  const descLine = eventDescription ? `\n\n${eventDescription}` : '';
  const phoneLine = orgPhone ? `\nTelefono: ${orgPhone}` : '';

  const message = `Gentile ${customerName},

Le confermiamo il seguente appuntamento:

Titolo: ${eventTitle}
Data: ${eventDate}
Orario: ${eventTime}${locationLine}${descLine}

In caso di impedimento, La preghiamo di contattarci per riprogrammare.${phoneLine}

Cordiali saluti,
${orgName}`;

  return sendEmailNotification({
    to,
    title,
    message,
    orgName,
  });
}

/**
 * Verifica se le notifiche email sono attive per l'organizzazione
 * @param {string} orgId - ID organizzazione
 * @param {string} settingKey - Chiave impostazione (es. 'invio_fatture_auto')
 * @returns {Promise<boolean>}
 */
export async function isEmailNotificationEnabled(orgId, settingKey) {
  try {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from('org_settings')
      .select('value')
      .eq('org_id', orgId)
      .eq('key', 'email_notifications')
      .maybeSingle();

    if (!data?.value) return false;
    
    return data.value[settingKey] === true;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return false;
  }
}

/**
 * Ottiene email CC per documenti dall'organizzazione
 * @param {string} orgId - ID organizzazione
 * @returns {Promise<string|null>}
 */
export async function getCCEmailForDocuments(orgId) {
  try {
    const supabase = supabaseBrowser();
    const { data } = await supabase
      .from('org_settings')
      .select('value')
      .eq('org_id', orgId)
      .eq('key', 'email_notifications')
      .maybeSingle();

    return data?.value?.email_cc_documenti || null;
  } catch (error) {
    console.error('Error getting CC email:', error);
    return null;
  }
}

/**
 * Invia notifica generica personalizzata
 * @param {Object} params
 * @param {string} params.to - Email destinatario
 * @param {string} params.subject - Oggetto email
 * @param {string} params.htmlContent - Contenuto HTML personalizzato
 * @param {string} params.textContent - Contenuto testo semplice
 */
export async function sendCustomEmail({ to, subject, htmlContent, textContent }) {
  try {
    const supabase = supabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utente non autenticato');
    }

    const response = await fetch(`${EDGE_FUNCTION_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        type: 'custom',
        to,
        subject,
        data: {
          html: htmlContent,
          text: textContent,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Errore invio email');
    }

    const result = await response.json();
    console.log(' Email custom inviata:', result);
    return result;
  } catch (error) {
    console.error(' Errore invio email custom:', error);
    throw error;
  }
}
