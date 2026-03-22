// src/lib/billing/sdi.ts
// Driver per invio diretto a Sistema di Interscambio (SdI)

import type { BillingDriver } from "./types";
import { sendInvoiceToSDI } from "../sdi";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { generateInvoicePdf } from "../invoicePdfGenerator";

export const sdiDriver: BillingDriver = {
  async createDraft(inv) {
    // Salva bozza su Supabase
    // Genera progressivo fattura
    return { id: inv.id };
  },

  async sendToSdi(id, options = {}) {
    // Chiamata API per invio a SdI
    // 1. Genera XML FatturaPA 1.2.2 conforme (lato server)
    // 2. Firma digitalmente (se richiesto)
    // 3. Invia tramite SDICoop tramite web service SOAP
    const testMode = options?.testMode || false;
    const result = await sendInvoiceToSDI(id, { testMode });
    
    if (!result.success) {
      throw new Error(result.error || result.message || "Invio SDI fallito");
    }
    
    return { 
      id, 
      identificativo_sdi: result.identificativo_sdi,
      environment: testMode ? "TEST" : "PRODUCTION",
    };
  },

  async getPdf(id) {
    const supabase = supabaseBrowser();
    
    const { data: inv, error: e1 } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    if (e1 || !inv) throw new Error('Fattura non trovata');
    
    const { data: items, error: e2 } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('id', { ascending: true });
    if (e2) throw new Error('Righe fattura non trovate');
    
    const doc = await generateInvoicePdf(inv, items || []);
    const pdfOutput = doc.output('datauristring');

    // Async backup to R2
    (async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        if (!token || !inv.org_id) return;

        const fileName = `FATTURA_${inv.number || inv.id}.pdf`;
        
        const presignRes = await fetch("https://assist.rescuemanager.eu/api/storage/presign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            filename: fileName, 
            contentType: 'application/pdf', 
            folder: `invoices/${inv.id}`, 
            orgId: inv.org_id 
          })
        });

        if (presignRes.ok) {
          const { presignedUrl, publicUrl } = await presignRes.json();
          const blob = doc.output('blob');
          
          await fetch(presignedUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": 'application/pdf' }
          });
          
          // Aggiorna record fattura con l'URL R2
          await supabase.from('invoices').update({ pdf_url: publicUrl }).eq('id', id);
          console.log(`[R2 Backup] Invoice ${id} backed up to R2`);
        }
      } catch (e) {
        console.warn('[R2 Backup] Failed to backup invoice PDF:', e);
      }
    })();

    return pdfOutput;
  },

  async getXml(id) {
    const supabase = supabaseBrowser();
    
    // Prima controlla se l'XML e' salvato nei meta della fattura
    const { data: inv, error } = await supabase
      .from('invoices')
      .select('meta')
      .eq('id', id)
      .single();
    
    if (error || !inv) return null;
    
    // Se l'XML e' stato salvato nei meta dopo l'invio
    if (inv.meta?.generated_xml) {
      return inv.meta.generated_xml;
    }
    
    // Altrimenti prova a recuperarlo dal server VPS
    try {
      const sdiSftpServerUrl = import.meta.env.VITE_SDI_SFTP_SERVER_URL || 'http://sdi-sftp.rescuemanager.eu';
      const r = await fetch(sdiSftpServerUrl + '/api/sdi-sftp/invoice/' + id + '/xml');
      if (r.ok) {
        const data = await r.json();
        return data.xml || null;
      }
    } catch (e) {
      console.warn('[SDI] Impossibile recuperare XML dal server:', e);
    }
    
    return null;
  }
};
