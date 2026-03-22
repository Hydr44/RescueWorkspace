import { jsPDF } from 'jspdf';
import { CompanySettingsService } from './companySettingsService';
import { ExportTemplateService } from './exportTemplateService';
import { supabaseBrowser } from '../supabase-browser';

export interface DocumentGenerationOptions {
  templateId: string;
  orgId: string;
  data: any[];
  filters?: any;
  fileName?: string;
  includeLogo?: boolean;
  includeCompanyInfo?: boolean;
  includeLegalNotes?: boolean;
  // Dati azienda dalla tab "Company" (opzionali, fallback su companySettings)
  companyName?: string;
  companyAddress?: string;
  companyZip?: string;
  companyCity?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyVat?: string;
}

export interface GeneratedDocument {
  blob: Blob;
  fileName: string;
  mimeType: string;
  size: number;
}

export class DocumentGenerationService {
  /**
   * Genera documento PDF
   */
  static async generatePDF(options: DocumentGenerationOptions): Promise<GeneratedDocument> {
    try {
      const template = await ExportTemplateService.getById(options.templateId);
      if (!template) throw new Error('Template non trovato');

      const companySettings = await CompanySettingsService.getForExport(options.orgId);
      
      const doc = new jsPDF({
        orientation: template.layout_config?.orientation || 'portrait',
        unit: 'mm',
        format: template.layout_config?.pageSize || 'a4',
        compress: true
      });
      
      // Rimuovi eventuali margini predefiniti impostando margini a 0
      // Nota: jsPDF potrebbe comunque avere un margine minimo per la stampa

      // Setup documento
      this.setupDocument(doc, template, companySettings);

      // Genera header
      // Genera header e ottiene la posizione Y finale per il contenuto
      const headerEndY = await this.generateHeader(doc, template, companySettings, options);
      const contentStartY = headerEndY || 70;

      // Genera contenuto (passa la posizione Y calcolata dall'header)
      await this.generateContent(doc, template, options.data, contentStartY);

      // Genera footer
      this.generateFooter(doc, template, companySettings);

      // Genera blob
      const blob = doc.output('blob');
      const fileName = options.fileName || this.generateFileName(template, options.orgId);

      // Async backup to R2 in background
      this.backupDocumentToR2(blob, fileName, options.orgId, 'application/pdf').catch(err => 
        console.warn('[R2 Backup] Failed to backup PDF:', err)
      );

      return {
        blob,
        fileName,
        mimeType: 'application/pdf',
        size: blob.size
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Genera documento CSV
   */
  static async generateCSV(options: DocumentGenerationOptions): Promise<GeneratedDocument> {
    try {
      const template = await ExportTemplateService.getById(options.templateId);
      if (!template) throw new Error('Template non trovato');

      const config = template.template_config;
      const columns = config.columns || [];
      
      // Genera header
      const headers = this.generateCSVHeaders(columns);
      
      // Genera righe dati
      const rows = options.data.map(row => this.generateCSVRow(row, columns));
      
      // Combina header e dati
      const csvContent = [headers, ...rows]
        .map(row => this.escapeCSVRow(row))
        .join('\n');
      
      // Aggiungi BOM per UTF-8
      const bom = '\uFEFF';
      const finalContent = bom + csvContent;
      
      const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
      const fileName = options.fileName || this.generateFileName(template, options.orgId);

      // Async backup to R2 in background
      this.backupDocumentToR2(blob, fileName, options.orgId, 'text/csv').catch(err => 
        console.warn('[R2 Backup] Failed to backup CSV:', err)
      );

      return {
        blob,
        fileName,
        mimeType: 'text/csv',
        size: blob.size
      };
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  }

  /**
   * Genera documento Excel
   */
  static async generateExcel(options: DocumentGenerationOptions): Promise<GeneratedDocument> {
    try {
      // Per ora generiamo CSV, in futuro implementeremo Excel con SheetJS
      return await this.generateCSV(options);
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw error;
    }
  }

  /**
   * Backup silente del documento su Cloudflare R2 tramite Presigned URL
   */
  private static async backupDocumentToR2(blob: Blob, fileName: string, orgId: string, contentType: string) {
    if (!orgId) return;
    try {
      const supabase = supabaseBrowser();
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      
      if (!token) return;

      const folder = contentType.includes('pdf') ? 'exports/pdf' : 'exports/csv';

      // 1. Chiedi URL firmato alla VPS
      const presignRes = await fetch("https://assist.rescuemanager.eu/api/storage/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ filename: fileName, contentType, folder, orgId })
      });

      if (!presignRes.ok) throw new Error("Presign failed");
      const { presignedUrl } = await presignRes.json();

      // 2. Upload HTTP PUT a R2
      await fetch(presignedUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": contentType }
      });
      
      console.log(`[R2 Backup] Successfully backed up ${fileName} to R2`);
    } catch (err) {
      // Ignora errori, e' un backup asincrono al meglio sforzo
      console.warn('[R2 Backup] Failed to backup:', err instanceof Error ? err.message : String(err));
      // Non lanciare errore - il PDF è già stato generato con successo
    }
  }

  /**
   * Setup documento PDF
   */
  private static setupDocument(doc: jsPDF, template: any, companySettings: any) {
    // Applica colori aziendali
    doc.setProperties({
      title: template.name,
      subject: template.description,
      author: companySettings.company_name,
      creator: 'RescueManager'
    });

    // Imposta font di default (jsPDF supporta solo: helvetica, times, courier)
    // Se il font richiesto non è supportato, usa helvetica come fallback
    const supportedFonts = ['helvetica', 'times', 'courier'];
    const fontFamily = supportedFonts.includes(companySettings.font_family?.toLowerCase()) 
      ? companySettings.font_family.toLowerCase() 
      : 'helvetica';
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(companySettings.font_size_base || 12);
  }

  /**
   * Genera header PDF
   */
  private static async generateHeader(doc: jsPDF, template: any, companySettings: any, options: DocumentGenerationOptions) {
    const config = template.template_config?.header;
    
    // Se non c'è configurazione header, usa un header di default con layout migliorato
    if (!config) {
      let startY = 15; // Inizia più in alto
      let actualLogoHeight = 0; // Altezza effettiva del logo calcolata
      let companyNameY = startY + 8; // Y della denominazione (default se non c'è box info)
      
      // Informazioni azienda a destra (se richieste) - PRIMA per calcolare Y denominazione
      if (options.includeCompanyInfo !== false) {
        const rightX = doc.internal.pageSize.width - 20;
        const infoY = startY;
        
        // Box informazioni azienda con sfondo grigio chiaro
        const infoBoxWidth = 70;
        const infoBoxHeight = 35;
        const infoBoxX = rightX - infoBoxWidth;
        
        // Sfondo box
        doc.setFillColor(249, 250, 251); // #F9FAFB grigio molto chiaro
        doc.rect(infoBoxX, infoY, infoBoxWidth, infoBoxHeight, 'F');
        
        // Bordo box
        doc.setDrawColor(229, 231, 235); // #E5E7EB grigio chiaro
        doc.setLineWidth(0.5);
        doc.rect(infoBoxX, infoY, infoBoxWidth, infoBoxHeight);
        
        // Contenuto box (parte dall'interno del box) - ABBASSATO
        let contentY = infoY + 8; // Padding interno aumentato per abbassare il contenuto
        const contentX = infoBoxX + 4; // Padding sinistro
        companyNameY = contentY; // Salva Y della denominazione per allineare il logo
        
        // Nome azienda (PRENDE DA TAB COMPANY - denominazione)
        const companyName = options.companyName || companySettings.company_name;
        if (companyName) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55); // #1F2937 grigio scuro
          // Usa splitText per gestire testi lunghi
          const nameLines = doc.splitTextToSize(companyName, infoBoxWidth - 8);
          nameLines.forEach((line: string) => {
            doc.text(line, contentX, contentY);
            contentY += 3.5;
          });
        }
        
        // Indirizzo completo (una sola riga)
        const addressParts = [];
        if (options.companyAddress || companySettings.address_street) {
          addressParts.push(options.companyAddress || companySettings.address_street);
        }
        if ((options.companyZip || companySettings.address_postal_code) && (options.companyCity || companySettings.address_city)) {
          addressParts.push(`${options.companyZip || companySettings.address_postal_code || ''} ${options.companyCity || companySettings.address_city || ''}`.trim());
        } else if (options.companyCity || companySettings.address_city) {
          addressParts.push(options.companyCity || companySettings.address_city);
        }
        
        if (addressParts.length > 0) {
          contentY += 1; // Spazio extra dopo nome
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128); // #6B7280 grigio
          const fullAddress = addressParts.join(', ');
          const addressLines = doc.splitTextToSize(fullAddress, infoBoxWidth - 8);
          addressLines.forEach((line: string) => {
            doc.text(line, contentX, contentY);
            contentY += 3;
          });
        }
        
        // P.IVA (se disponibile)
        const vat = options.companyVat || companySettings.vat_number;
        if (vat) {
          contentY += 1;
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128); // #6B7280 grigio
          doc.text(`P.IVA: ${vat}`, contentX, contentY);
          contentY += 3;
        }
        
        // Contatti
        const phone = options.companyPhone || companySettings.phone;
        const email = options.companyEmail || companySettings.email;
        if (phone || email) {
          contentY += 1;
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175); // #9CA3AF grigio chiaro
          if (phone) {
            doc.text(`Tel: ${phone}`, contentX, contentY);
            contentY += 3;
          }
          if (email) {
            doc.text(`Email: ${email}`, contentX, contentY);
          }
        }
      }
      
      // Logo aziendale - ALLINEATO ALLA DENOMINAZIONE E AL TITOLO
      if (companySettings.logo_base64 && options.includeLogo !== false) {
        try {
          // Carica immagine per ottenere dimensioni reali
          const img = new Image();
          img.src = `data:image/png;base64,${companySettings.logo_base64}`;
          
          await new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(() => resolve(), 100);
            }
          });
          
          // Logo in ALTO A SINISTRA (senza margine superiore e più a sinistra)
          const marginX = 5; // Margine sinistro ridotto (5mm invece di 20mm) - come versione precedente
          const logoX = marginX;
          
          // Logo posizionato in alto a sinistra - MARGINE MINIMO
          // jsPDF potrebbe avere margini predefiniti, usiamo un valore negativo minimo per compensare
          const logoY = -2; // In alto a sinistra, compensando eventuali margini jsPDF - come versione precedente
          
          // Logo un po' più piccolo (ridotto rispetto alla versione precedente)
          let logoWidth = 80; // Logo più piccolo (80mm invece di 100mm)
          let logoHeight = 40; // Altezza iniziale, verrà calcolata
          
          // Calcola dimensioni logo mantenendo aspect ratio
          if (img.naturalWidth && img.naturalHeight) {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            logoHeight = logoWidth / aspectRatio;
            
            // Limita altezza massima per non uscire dalla pagina
            const maxHeight = 70; // Altezza massima ridotta (70mm invece di 100mm per logo più piccolo)
            if (logoHeight > maxHeight) {
              logoHeight = maxHeight;
              logoWidth = logoHeight * aspectRatio;
            }
          }
          
          // Salva altezza effettiva per calcoli successivi
          actualLogoHeight = logoHeight;
          
          // Debug log per verificare posizionamento
          console.log('[PDF Logo] DEBUG - Posizione logo:', { 
            logoX, 
            logoY, 
            logoWidth, 
            logoHeight, 
            companyNameY,
            startY,
            'infoBoxPresent': options.includeCompanyInfo !== false
          });
          
          // Aggiungi logo direttamente senza box
          doc.addImage(
            `data:image/png;base64,${companySettings.logo_base64}`,
            'PNG',
            logoX,
            logoY,
            logoWidth,
            logoHeight,
            undefined,
            'FAST'
          );
          
        } catch (error) {
          console.warn('Error adding logo to PDF:', error);
        }
      }
      
      // Titolo documento (sotto logo/info azienda) - ALLINEATO ALLA TABELLA
      const marginX = 20; // Margine sinistro allineato alla tabella (stesso della tabella: 20mm)
      // Calcola Y del titolo: se c'è il logo, parte da sotto il logo, altrimenti sotto info box
      let titleY: number;
      if (actualLogoHeight > 0) {
        // Il titolo parte sotto il logo (logoY è ora -2mm, quindi compensiamo)
        titleY = Math.max(2, -2 + actualLogoHeight + 8); // Spazio dopo logo in alto a sinistra (minimo 2mm)
      } else {
        // Se non c'è logo, usa info box come riferimento
        const infoBoxHeight = options.includeCompanyInfo !== false ? 35 : 0;
        titleY = startY + infoBoxHeight + 8;
      }
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // #1F2937 grigio scuro
      doc.text(template.name || 'Documento', marginX, titleY);
      
      // Sottotitolo con categoria e data
      if (template.category) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128); // #6B7280 grigio
        const categoryLabel = template.category.charAt(0).toUpperCase() + template.category.slice(1).replace(/_/g, ' ');
        const dateLabel = new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`${categoryLabel} • ${dateLabel}`, marginX, titleY + 5);
      }
      
      // Linea separatrice sottile singola - ALLINEATA ALLA TABELLA
      doc.setDrawColor(229, 231, 235); // #E5E7EB grigio chiaro
      doc.setLineWidth(0.3);
      const separatorY = titleY + 10;
      doc.line(marginX, separatorY, doc.internal.pageSize.width - marginX, separatorY);
      
      // Restituisce l'altezza totale dell'header per il posizionamento della tabella
      return separatorY + 5; // Y finale dopo la linea separatrice
    }

    // Se c'è configurazione custom, usa quella (non ritorna Y, sarà calcolato dopo)
    // Logo aziendale
    if (config.logo?.enabled && companySettings.logo_base64 && options.includeLogo !== false) {
      await this.addLogo(doc, config.logo, companySettings);
    }
    
    // Informazioni azienda
    if (config.companyInfo?.enabled && options.includeCompanyInfo !== false) {
      this.addCompanyInfo(doc, config.companyInfo, companySettings);
    }
    
    // Titolo documento
    if (config.title) {
      this.addTitle(doc, config.title, companySettings);
    }
  }

  /**
   * Aggiunge logo al PDF
   */
  private static async addLogo(doc: jsPDF, logoConfig: any, companySettings: any) {
    if (!companySettings.logo_base64) return;

    const logoWidth = logoConfig.size === 'large' ? 60 : 
                     logoConfig.size === 'medium' ? 40 : 20;
    
    // Posiziona logo
    let x = 20; // default left
    if (logoConfig.position === 'center') {
      x = (doc.internal.pageSize.width - logoWidth) / 2;
    }
    if (logoConfig.position === 'right') {
      x = doc.internal.pageSize.width - logoWidth - 20;
    }
    
    try {
      doc.addImage(
        `data:image/png;base64,${companySettings.logo_base64}`,
        'PNG',
        x,
        20,
        logoWidth,
        logoWidth * 0.5
      );
    } catch (error) {
      console.warn('Error adding logo to PDF:', error);
    }
  }

  /**
   * Aggiunge informazioni azienda al PDF
   */
  private static addCompanyInfo(doc: jsPDF, companyConfig: any, companySettings: any) {
    const fields = companyConfig.fields || ['name', 'address', 'phone', 'email'];
    let y = 25;
    
    fields.forEach((field: string) => {
      const value = this.getCompanyFieldValue(field, companySettings);
      if (value) {
        doc.setFontSize(10);
        doc.setTextColor(companySettings.text_color);
        doc.text(value, doc.internal.pageSize.width - 20, y, { align: 'right' });
        y += 5;
      }
    });
  }

  /**
   * Aggiunge titolo al PDF
   */
  private static addTitle(doc: jsPDF, titleConfig: any, companySettings: any) {
    doc.setFontSize(titleConfig.fontSize || companySettings.font_size_heading);
    // Usa font supportato (helvetica, times, courier) o fallback a helvetica
    const supportedFonts = ['helvetica', 'times', 'courier'];
    const fontFamily = supportedFonts.includes(companySettings.font_family?.toLowerCase()) 
      ? companySettings.font_family.toLowerCase() 
      : 'helvetica';
    doc.setFont(fontFamily, titleConfig.fontWeight || 'bold');
    doc.setTextColor(companySettings.primary_color);
    
    const x = titleConfig.alignment === 'center' ? 
      doc.internal.pageSize.width / 2 : 20;
    
    doc.text(titleConfig.text, x, 60, { 
      align: titleConfig.alignment || 'left' 
    });
  }

  /**
   * Genera contenuto PDF
   */
  private static async generateContent(doc: jsPDF, template: any, data: any[], contentStartY?: number) {
    // Se non ci sono dati, non generare nulla
    if (!data || data.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor('#6B7280');
      doc.text('Nessun dato disponibile', 20, 80);
      return;
    }

    const config = template.template_config?.content;
    
    // Se non c'è configurazione, usa un template di default basato sulla categoria
    if (!config) {
      await this.generateDefaultContent(doc, template, data, contentStartY);
      return;
    }

    if (config.table) {
      await this.generateTable(doc, data, config.table);
    } else if (config.list) {
      await this.generateList(doc, data, config.list);
    }
  }

  /**
   * Genera contenuto di default quando il template non ha configurazione
   */
  private static async generateDefaultContent(doc: jsPDF, template: any, data: any[], contentStartY?: number) {
    const category = template.category;
    
    if (category === 'transports') {
      await this.generateRichTransportTable(doc, data, contentStartY);
      return;
    }

    // Per altre categorie, usa il sistema di colonne esistente
    let columns: any[] = [];
    
    if (category === 'clients') {
      columns = [
        { field: 'name', label: 'Nome', width: 60 },
        { field: 'email', label: 'Email', width: 60 },
        { field: 'phone', label: 'Telefono', width: 40 },
        { field: 'address', label: 'Indirizzo', width: 70 }
      ];
    } else if (category === 'quotes') {
      columns = [
        { field: 'number', label: 'Numero', width: 40 },
        { field: 'client_name', label: 'Cliente', width: 50 },
        { field: 'amount', label: 'Importo', width: 40 },
        { field: 'status', label: 'Stato', width: 30 },
        { field: 'date', label: 'Data', width: 40 }
      ];
    } else if (category === 'invoices') {
      columns = [
        { field: 'number', label: 'Numero', width: 40 },
        { field: 'client_name', label: 'Cliente', width: 50 },
        { field: 'amount', label: 'Importo', width: 40 },
        { field: 'status', label: 'Stato', width: 30 },
        { field: 'date', label: 'Data', width: 40 }
      ];
    } else {
      // Per altre categorie, usa i primi campi disponibili nei dati
      const firstRow = data[0];
      if (firstRow) {
        const keys = Object.keys(firstRow).slice(0, 6);
        const totalWidth = doc.internal.pageSize.width - 40;
        const columnWidth = totalWidth / keys.length;
        
        columns = keys.map((key, index) => ({
          field: key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          width: columnWidth
        }));
      }
    }

    // Se non ci sono colonne definite, esci
    if (columns.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor('#6B7280');
      doc.text('Dati non formattabili', 20, 80);
      return;
    }

    // Genera tabella con configurazione di default
    const defaultTableConfig = {
      columns,
      styling: {
        headerBackground: '#F3F4F6',
        headerTextColor: '#374151',
        alternateRowColor: '#F9FAFB'
      }
    };

    await this.generateTable(doc, data, defaultTableConfig);
  }

  /**
   * Genera tabella trasporti pulita e professionale (scala di grigi)
   */
  private static async generateRichTransportTable(doc: jsPDF, data: any[], headerEndY?: number) {
    // Usa la posizione Y calcolata dall'header, o un default se non fornita
    const startY = headerEndY || 65;
    let currentY = startY;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Calcola totale per footer
    const totalPrice = data.reduce((sum, t) => sum + (t.price_cents || 0), 0);
    
    // ============ TABELLA TRASPORTI ============
    // Header tabella con sfondo grigio scuro
    doc.setFillColor(31, 41, 55); // #1F2937 grigio scuro
    doc.rect(margin, currentY, contentWidth, 10, 'F');
    
    // Linea sotto header
    doc.setDrawColor(55, 65, 81); // #374151 grigio scuro
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 10, margin + contentWidth, currentY + 10);
    
    // Colonne tabella ottimizzate - ridotte per evitare overflow
    const columnWidths = {
      id: 20,
      date: 25,
      status: 22,
      pickup: 50,
      dropoff: 50,
      price: 20,
      notes: contentWidth - (20 + 25 + 22 + 50 + 50 + 20) - 10
    };
    
    let headerX = margin + 2;
    
    // Header: ID
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255); // Bianco
    doc.text('ID', headerX, currentY + 7);
    headerX += columnWidths.id;
    
    // Header: Data/Ora
    doc.text('Data/Ora', headerX, currentY + 7);
    headerX += columnWidths.date;
    
    // Header: Stato
    doc.text('Stato', headerX, currentY + 7);
    headerX += columnWidths.status;
    
    // Header: Partenza
    doc.text('Partenza', headerX, currentY + 7);
    headerX += columnWidths.pickup;
    
    // Header: Destinazione
    doc.text('Destinazione', headerX, currentY + 7);
    headerX += columnWidths.dropoff;
    
    // Header: Prezzo
    doc.text('Prezzo', headerX, currentY + 7);
    headerX += columnWidths.price;
    
    // Header: Note
    doc.text('Note', headerX, currentY + 7);
    
    currentY += 12;
    
    // Righe dati
    data.forEach((transport, index) => {
      // Controlla se serve nuova pagina
      if (currentY > doc.internal.pageSize.height - 30) {
        doc.addPage();
        currentY = 20;
        
        // Re-disegna header su nuova pagina
        doc.setFillColor(55, 65, 81); // #374151 grigio scuro
        doc.rect(margin, currentY, contentWidth, 10, 'F');
        doc.setDrawColor(55, 65, 81); // #374151 grigio scuro
        doc.line(margin, currentY + 10, margin + contentWidth, currentY + 10);
        
        headerX = margin + 2;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // Bianco
        doc.text('ID', headerX, currentY + 7);
        headerX += columnWidths.id;
        doc.text('Data/Ora', headerX, currentY + 7);
        headerX += columnWidths.date;
        doc.text('Stato', headerX, currentY + 7);
        headerX += columnWidths.status;
        doc.text('Partenza', headerX, currentY + 7);
        headerX += columnWidths.pickup;
        doc.text('Destinazione', headerX, currentY + 7);
        headerX += columnWidths.dropoff;
        doc.text('Prezzo', headerX, currentY + 7);
        headerX += columnWidths.price;
        doc.text('Note', headerX, currentY + 7);
        currentY += 12;
      }
      
      // Colore riga alternato (grigio chiaro)
      if (index % 2 === 1) {
        doc.setFillColor(249, 250, 251); // #F9FAFB grigio molto chiaro
        doc.rect(margin, currentY - 2, contentWidth, 8, 'F');
      }
      
      // Bordo inferiore riga
      doc.setDrawColor(229, 231, 235); // #E5E7EB grigio chiaro
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + 6, margin + contentWidth, currentY + 6);
      
      let cellX = margin + 2;
      
      // ID - usa numero invece di UUID
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // #1F2937 grigio scuro
      const transportNumber = transport.number ? `TR${String(transport.number).padStart(4, '0')}` : `#${transport.id.slice(0, 6)}`;
      doc.text(transportNumber, cellX, currentY + 5);
      cellX += columnWidths.id;
      
      // Data/Ora
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81); // #374151 grigio medio
      if (transport.created_at) {
        const date = new Date(transport.created_at);
        const dateStr = date.toLocaleDateString('it-IT');
        const timeStr = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        doc.text(`${dateStr}`, cellX, currentY + 3);
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128); // #6B7280 grigio
        doc.text(`${timeStr}`, cellX, currentY + 5.5);
        doc.setFontSize(8);
      } else {
        doc.setTextColor(156, 163, 175); // #9CA3AF grigio chiaro
        doc.text('-', cellX, currentY + 5);
      }
      cellX += columnWidths.date;
      
      // Stato (tutto grigio)
      const status = transport.status || 'new';
      const statusLabels: Record<string, string> = {
        'new': 'Nuovo',
        'assigned': 'Assegnato',
        'enroute': 'In Viaggio',
        'done': 'Completato'
      };
      const statusText = statusLabels[status] || status;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81); // #374151 grigio medio
      doc.text(statusText, cellX, currentY + 5);
      cellX += columnWidths.status;
      
      // Partenza
      doc.setTextColor(55, 65, 81); // #374151 grigio medio
      const pickup = transport.pickup_address || '-';
      const pickupTruncated = pickup.length > 35 ? pickup.substring(0, 32) + '...' : pickup;
      doc.text(pickupTruncated, cellX, currentY + 5);
      cellX += columnWidths.pickup;
      
      // Destinazione
      doc.setTextColor(55, 65, 81); // #374151 grigio medio
      const dropoff = transport.dropoff_address || '-';
      const dropoffTruncated = dropoff.length > 35 ? dropoff.substring(0, 32) + '...' : dropoff;
      doc.text(dropoffTruncated, cellX, currentY + 5);
      cellX += columnWidths.dropoff;
      
      // Prezzo
      if (transport.price_cents) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // #1F2937 grigio scuro
        const price = (transport.price_cents / 100).toFixed(2).replace('.', ',');
        doc.text(`€ ${price}`, cellX, currentY + 5);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setTextColor(156, 163, 175); // #9CA3AF grigio chiaro
        doc.text('-', cellX, currentY + 5);
      }
      cellX += columnWidths.price;
      
      // Note (con ellipsis se troppo lunghe)
      if (transport.notes) {
        doc.setTextColor(107, 114, 128); // #6B7280 grigio
        doc.setFontSize(7);
        const notes = transport.notes.length > 40 ? transport.notes.substring(0, 37) + '...' : transport.notes;
        doc.text(notes, cellX, currentY + 5);
        doc.setFontSize(8);
      } else {
        doc.setTextColor(209, 213, 219); // #D1D5DB grigio molto chiaro
        doc.text('-', cellX, currentY + 5);
      }
      
      currentY += 8;
    });
    
    // Footer tabella con somma totale
    if (data.length > 0) {
      currentY += 2;
      doc.setDrawColor(229, 231, 235); // #E5E7EB grigio chiaro
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, margin + contentWidth, currentY);
      currentY += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // #1F2937 grigio scuro
      const totalCellX = margin + contentWidth - columnWidths.price - 2;
      // Formatta il totale con spaziatura corretta tra simbolo € e numero per evitare sovrapposizione
      const totalFormatted = (totalPrice / 100).toFixed(2).replace('.', ',');
      doc.text(`TOTALE: € ${totalFormatted}`, totalCellX, currentY);
    }
  }

  /**
   * Genera tabella PDF
   */
  private static async generateTable(doc: jsPDF, data: any[], tableConfig: any) {
    const columns = tableConfig.columns;
    const startY = 75; // Inizia più in alto se header è più compatto
    let currentY = startY;
    
    // Header tabella
    doc.setFillColor(tableConfig.styling?.headerBackground || '#F3F4F6');
    doc.rect(20, currentY, doc.internal.pageSize.width - 40, 10, 'F');
    
    let x = 20;
    columns.forEach((column: any) => {
      doc.setFontSize(10);
      doc.setTextColor(tableConfig.styling?.headerTextColor || '#374151');
      doc.text(column.label, x + 2, currentY + 7);
      x += column.width;
    });
    
    currentY += 10;
    
    // Righe dati
    data.forEach((row, index) => {
      // Controlla se serve nuova pagina
      if (currentY > doc.internal.pageSize.height - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      // Colore riga alternato
      if (index % 2 === 1 && tableConfig.styling?.alternateRowColor) {
        doc.setFillColor(tableConfig.styling.alternateRowColor);
        doc.rect(20, currentY, doc.internal.pageSize.width - 40, 8, 'F');
      }
      
      // Dati riga
      x = 20;
      columns.forEach((column: any) => {
        const rawValue = row[column.field];
        const value = this.formatFieldValue(rawValue, column.type || 'string');
        const displayValue = value || '-'; // Mostra '-' se il valore è vuoto
        
        // Tronca il testo se è troppo lungo per la colonna (circa 1mm per carattere)
        const maxChars = Math.floor(column.width / 2);
        const truncatedValue = displayValue.length > maxChars 
          ? displayValue.substring(0, maxChars - 3) + '...' 
          : displayValue;
        
        doc.setFontSize(9);
        doc.setTextColor('#374151');
        doc.text(truncatedValue, x + 2, currentY + 6);
        x += column.width;
      });
      
      currentY += 8;
    });
  }

  /**
   * Genera lista PDF
   */
  private static async generateList(doc: jsPDF, data: any[], listConfig: any) {
    let currentY = 80;
    
    data.forEach((item, index) => {
      // Controlla se serve nuova pagina
      if (currentY > doc.internal.pageSize.height - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      // Titolo elemento
      if (listConfig.showTitle !== false) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${item.title || item.name || 'Elemento'}`, 20, currentY);
        currentY += 8;
      }
      
      // Dettagli elemento
      const fields = listConfig.fields || [];
      fields.forEach((field: any) => {
        const value = this.formatFieldValue(item[field.field], field.type);
        if (value) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`${field.label}: ${value}`, 25, currentY);
          currentY += 5;
        }
      });
      
      currentY += 5; // Spazio tra elementi
    });
  }

  /**
   * Genera footer PDF
   */
  private static generateFooter(doc: jsPDF, template: any, companySettings: any) {
    const config = template.template_config.footer;
    if (!config) return;

    const pageHeight = doc.internal.pageSize.height;
    
    // Numeri pagina
    if (config.pageNumbers) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(companySettings.text_color);
        doc.text(
          `Pagina ${i} di ${pageCount}`,
          doc.internal.pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    }
    
    // Informazioni azienda footer
    if (config.companyInfo?.enabled) {
      doc.setFontSize(8);
      doc.setTextColor(companySettings.text_color);
      doc.text(
        `${companySettings.company_name} - ${companySettings.vat_number || ''}`,
        20,
        pageHeight - 10
      );
    }
    
    // Note legali
    if (config.legalNotes?.enabled && companySettings.legal_notes) {
      doc.setFontSize(7);
      doc.setTextColor('#6B7280');
      doc.text(
        companySettings.legal_notes,
        20,
        pageHeight - 5,
        { maxWidth: doc.internal.pageSize.width - 40 }
      );
    }
  }

  /**
   * Genera header CSV
   */
  private static generateCSVHeaders(columns: any[]): string[] {
    return columns
      .filter(col => col.enabled)
      .map(col => col.label || col.field);
  }

  /**
   * Genera riga CSV
   */
  private static generateCSVRow(row: any, columns: any[]): string[] {
    return columns
      .filter(col => col.enabled)
      .map(col => this.formatFieldValue(row[col.field], col.type));
  }

  /**
   * Escape riga CSV
   */
  private static escapeCSVRow(row: string[]): string {
    return row.map(field => {
      const stringField = String(field || '');
      
      // Escape virgolette e newline
      if (stringField.includes('"') || stringField.includes('\n') || stringField.includes(',')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      
      return stringField;
    }).join(',');
  }

  /**
   * Ottiene valore campo azienda
   */
  private static getCompanyFieldValue(field: string, companySettings: any): string {
    const mapping = {
      name: companySettings.company_name,
      address: `${companySettings.address_street || ''} ${companySettings.address_number || ''}, ${companySettings.address_postal_code || ''} ${companySettings.address_city || ''}`.trim(),
      phone: companySettings.phone,
      email: companySettings.email,
      vat_number: companySettings.vat_number,
      tax_code: companySettings.tax_code,
      fiscal_code: companySettings.fiscal_code,
      chamber_of_commerce: companySettings.chamber_of_commerce,
      website: companySettings.website,
      mobile: companySettings.mobile
    };
    
    return mapping[field as keyof typeof mapping] || '';
  }

  /**
   * Formatta valore campo
   */
  private static formatFieldValue(value: any, type?: string): string {
    if (value === null || value === undefined || value === '') return '';
    
    // Se il tipo non è specificato, prova a inferirlo dal valore
    const inferredType = type || this.inferFieldType(value);
    
    switch (inferredType) {
      case 'date':
        try {
          return new Date(value).toLocaleDateString('it-IT');
        } catch {
          return String(value);
        }
      case 'datetime':
        try {
          return new Date(value).toLocaleString('it-IT');
        } catch {
          return String(value);
        }
      case 'currency':
        try {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          return new Intl.NumberFormat('it-IT', { 
            style: 'currency', 
            currency: 'EUR' 
          }).format(numValue);
        } catch {
          return String(value);
        }
      case 'number':
        try {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          return new Intl.NumberFormat('it-IT').format(numValue);
        } catch {
          return String(value);
        }
      default:
        return String(value);
    }
  }

  /**
   * Inferisce il tipo di campo dal valore
   */
  private static inferFieldType(value: any): string {
    if (value === null || value === undefined) return 'string';
    
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'string';
    
    // Prova a identificare date
    if (typeof value === 'string') {
      // ISO date string
      if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
        return 'date';
      }
      // Numero come stringa
      if (!isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
        return 'number';
      }
    }
    
    // Date object
    if (value instanceof Date) return 'date';
    
    return 'string';
  }

  /**
   * Genera nome file
   */
  private static generateFileName(template: any, orgId: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const category = template.category;
    const extension = template.file_extension;
    
    return `${category}_${timestamp}.${extension}`;
  }

  /**
   * Scarica documento
   */
  static downloadDocument(generatedDocument: GeneratedDocument): void {
    // Usa globalThis.document per evitare conflitti in Electron
    const doc = globalThis.document || window.document;
    if (!doc) {
      throw new Error('DOM document non disponibile');
    }

    const url = URL.createObjectURL(generatedDocument.blob);
    const link = doc.createElement('a');
    link.href = url;
    link.download = generatedDocument.fileName;
    doc.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Genera documento completo con tutte le opzioni
   */
  static async generateDocument(options: DocumentGenerationOptions): Promise<GeneratedDocument> {
    const template = await ExportTemplateService.getById(options.templateId);
    if (!template) throw new Error('Template non trovato');

    switch (template.document_type) {
      case 'pdf':
        return await this.generatePDF(options);
      case 'csv':
        return await this.generateCSV(options);
      case 'xlsx':
        return await this.generateExcel(options);
      default:
        throw new Error(`Tipo documento non supportato: ${template.document_type}`);
    }
  }
}
