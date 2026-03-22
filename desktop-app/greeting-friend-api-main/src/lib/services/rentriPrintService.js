// src/lib/services/rentriPrintService.js
/**
 * Servizio di stampa per moduli RENTRI
 * Genera PDF stampabili per liste e dettagli
 */

import { jsPDF } from 'jspdf';

/**
 * Stampa lista registri
 */
export async function printRegistriList(registri, filters = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Registri Cronologici RENTRI', margin, yPos);
  yPos += 10;

  // Filtri applicati
  if (filters.anno || filters.stato) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const filterText = [
      filters.anno && `Anno: ${filters.anno}`,
      filters.stato && filters.stato !== 'all' && `Stato: ${filters.stato}`
    ].filter(Boolean).join(' | ');
    doc.text(filterText, margin, yPos);
    yPos += 8;
  }

  // Data stampa
  doc.setFontSize(8);
  doc.text(`Stampa del: ${new Date().toLocaleDateString('it-IT')}`, pageWidth - margin - 50, yPos - 8, { align: 'right' });

  yPos += 5;

  // Tabella
  const tableStartY = yPos;
  const colWidths = [25, 30, 40, 30, 25, 30, 30]; // 7 colonne
  const rowHeight = 8;
  const headerHeight = 10;

  // Header tabella
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let xPos = margin;
  const headers = ['Anno/Num', 'Tipo', 'Unità Locale', 'Stato', 'Sync', 'Data Creazione', 'ID RENTRI'];
  
  headers.forEach((header, i) => {
    doc.text(header, xPos + 2, yPos + 7);
    xPos += colWidths[i];
  });

  yPos += headerHeight;

  // Righe dati
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  registri.forEach((reg, idx) => {
    // Controlla se serve nuova pagina
    if (yPos + rowHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    // Alterna colore righe
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
    }

    xPos = margin;
    const cells = [
      `${reg.anno} / ${reg.numero_registro || 'N/A'}`,
      (reg.tipo || '').replace(/_/g, ' ').substring(0, 20),
      (reg.unita_locale || '-').substring(0, 20),
      reg.stato || 'bozza',
      reg.rentri_id ? 'Sì' : 'No',
      new Date(reg.created_at).toLocaleDateString('it-IT'),
      reg.rentri_id ? (reg.rentri_id.substring(0, 15) + '...') : '-'
    ];

    cells.forEach((cell, i) => {
      doc.text(cell, xPos + 2, yPos + 6);
      xPos += colWidths[i];
    });

    yPos += rowHeight;
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Pagina ${i} di ${totalPages} | Totale registri: ${registri.length}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `registri-rentri-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Stampa lista FIR/Formulari
 */
export async function printFirList(formulari, filters = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Formulari Identificazione Rifiuti (FIR)', margin, yPos);
  yPos += 10;

  // Filtri applicati
  if (filters.anno || filters.stato) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const filterText = [
      filters.anno && `Anno: ${filters.anno}`,
      filters.stato && filters.stato !== 'all' && `Stato: ${filters.stato}`
    ].filter(Boolean).join(' | ');
    doc.text(filterText, margin, yPos);
    yPos += 8;
  }

  // Data stampa
  doc.setFontSize(8);
  doc.text(`Stampa del: ${new Date().toLocaleDateString('it-IT')}`, pageWidth - margin - 50, yPos - 8, { align: 'right' });

  yPos += 5;

  // Tabella
  const colWidths = [30, 25, 50, 50, 30, 25]; // 6 colonne
  const rowHeight = 8;
  const headerHeight = 10;

  // Header tabella
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let xPos = margin;
  const headers = ['Numero FIR', 'Data', 'Produttore', 'Destinatario', 'Stato', 'RENTRI'];
  
  headers.forEach((header, i) => {
    doc.text(header, xPos + 2, yPos + 7);
    xPos += colWidths[i];
  });

  yPos += headerHeight;

  // Righe dati
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  formulari.forEach((fir, idx) => {
    // Controlla se serve nuova pagina
    if (yPos + rowHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    // Alterna colore righe
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
    }

    xPos = margin;
    const cells = [
      fir.numero_fir || 'Bozza',
      new Date(fir.data_creazione).toLocaleDateString('it-IT'),
      (fir.produttore_nome || '-').substring(0, 30),
      (fir.destinatario_nome || '-').substring(0, 30),
      fir.stato || 'bozza',
      fir.rentri_numero ? 'Sì' : 'No'
    ];

    cells.forEach((cell, i) => {
      doc.text(cell, xPos + 2, yPos + 6);
      xPos += colWidths[i];
    });

    yPos += rowHeight;
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Pagina ${i} di ${totalPages} | Totale FIR: ${formulari.length}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `fir-rentri-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Stampa dettaglio registro con movimenti
 */
export async function printRegistroDetail(registro, movimenti = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Titolo
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Registro Cronologico RENTRI', margin, yPos);
  yPos += 10;

  // Dati registro
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const datiRegistro = [
    `Anno: ${registro.anno}`,
    `Numero: ${registro.numero_registro || 'N/A'}`,
    `Tipo: ${(registro.tipo || '').replace(/_/g, ' ')}`,
    `Unità Locale: ${registro.unita_locale || '-'}`,
    `Stato: ${registro.stato || 'bozza'}`,
    `ID RENTRI: ${registro.rentri_id || 'Non sincronizzato'}`,
    `Data Creazione: ${new Date(registro.created_at).toLocaleDateString('it-IT')}`
  ];

  datiRegistro.forEach((line, i) => {
    doc.text(line, margin, yPos + (i * 6));
  });

  yPos += 50;

  // Sezione movimenti
  if (movimenti && movimenti.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Movimenti', margin, yPos);
    yPos += 8;

    // Header tabella movimenti
    const colWidths = [20, 30, 40, 30, 30, 40];
    const rowHeight = 7;
    const headerHeight = 8;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    let xPos = margin;
    const headers = ['Data', 'Causale', 'Codice EER', 'Quantità', 'Unità', 'Note'];
    
    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, yPos + 6);
      xPos += colWidths[i];
    });

    yPos += headerHeight;

    // Righe movimenti
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    movimenti.forEach((mov, idx) => {
      // Controlla se serve nuova pagina
      if (yPos + rowHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      // Alterna colore righe
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
      }

      xPos = margin;
      const cells = [
        new Date(mov.data_operazione).toLocaleDateString('it-IT'),
        mov.causale_operazione || '-',
        mov.codice_eer || '-',
        mov.quantita ? parseFloat(mov.quantita).toFixed(2) : '-',
        mov.unita_misura || 'kg',
        (mov.note || mov.annotazioni || '-').substring(0, 25)
      ];

      cells.forEach((cell, i) => {
        doc.text(cell, xPos + 2, yPos + 5);
        xPos += colWidths[i];
      });

      yPos += rowHeight;
    });
  } else {
    doc.setFontSize(10);
    doc.text('Nessun movimento registrato', margin, yPos);
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Pagina ${i} di ${totalPages} | Stampa del: ${new Date().toLocaleDateString('it-IT')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `registro-${registro.anno}-${registro.numero_registro || 'N/A'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Stampa lista movimenti
 */
export async function printMovimentiList(movimenti, filters = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Movimenti RENTRI', margin, yPos);
  yPos += 10;

  // Filtri applicati
  if (filters.registro || filters.tipo || filters.data_from || filters.data_to) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const filterText = [
      filters.registro && `Registro: ${filters.registro}`,
      filters.tipo && filters.tipo !== 'all' && `Tipo: ${filters.tipo}`,
      filters.data_from && `Dal: ${new Date(filters.data_from).toLocaleDateString('it-IT')}`,
      filters.data_to && `Al: ${new Date(filters.data_to).toLocaleDateString('it-IT')}`
    ].filter(Boolean).join(' | ');
    doc.text(filterText, margin, yPos);
    yPos += 8;
  }

  // Data stampa
  doc.setFontSize(8);
  doc.text(`Stampa del: ${new Date().toLocaleDateString('it-IT')}`, pageWidth - margin - 50, yPos - 8, { align: 'right' });

  yPos += 5;

  // Tabella
  const colWidths = [25, 20, 40, 35, 25, 25, 30, 30]; // 8 colonne
  const rowHeight = 8;
  const headerHeight = 10;

  // Header tabella
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  let xPos = margin;
  const headers = ['Data', 'Registro', 'Causale', 'Codice EER', 'Quantità', 'Unità', 'Provenienza', 'Note'];
  
  headers.forEach((header, i) => {
    doc.text(header, xPos + 2, yPos + 7);
    xPos += colWidths[i];
  });

  yPos += headerHeight;

  // Righe dati
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  movimenti.forEach((mov, idx) => {
    // Controlla se serve nuova pagina
    if (yPos + rowHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }

    // Alterna colore righe
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
    }

    xPos = margin;
    const registroInfo = mov.registro ? `${mov.registro.anno}/${mov.registro.numero_registro || 'N/A'}` : '-';
    const cells = [
      new Date(mov.data_operazione).toLocaleDateString('it-IT'),
      registroInfo.substring(0, 12),
      (mov.causale_operazione || '-').substring(0, 10),
      (mov.codice_eer || '-').substring(0, 15),
      mov.quantita ? parseFloat(mov.quantita).toFixed(2) : '-',
      (mov.unita_misura || 'kg').substring(0, 5),
      (mov.provenienza_destinazione || '-').substring(0, 15),
      (mov.note || mov.annotazioni || '-').substring(0, 20)
    ];

    cells.forEach((cell, i) => {
      doc.text(cell, xPos + 2, yPos + 6);
      xPos += colWidths[i];
    });

    yPos += rowHeight;
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Pagina ${i} di ${totalPages} | Totale movimenti: ${movimenti.length}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `movimenti-rentri-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Stampa dettaglio FIR — PDF ufficiale da RENTRI
 *
 * Il PDF del FIR è un documento ufficiale generato esclusivamente da RENTRI.
 * Non esiste un "PDF locale" — se il FIR non è stato trasmesso a RENTRI,
 * il PDF non è disponibile.
 *
 * Endpoint RENTRI: GET /formulari/v1.0/{numero_fir}/pdf
 * Risposta: DownloadableBaseResponse { nome_file, mime, content (Base64) }
 */
export async function printFirDetail(fir) {
  // Scarica PDF ufficiale da RENTRI
  if (!fir.rentri_numero) {
    alert('PDF non disponibile.\n\nIl FIR deve essere trasmesso a RENTRI prima di poter scaricare il PDF ufficiale.');
    return;
  }

  try {
    const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
    const response = await fetch(`${apiUrl}/fir/pdf?fir_id=${fir.id}`, {
      method: 'GET',
      headers: { 'Accept': 'application/pdf' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Errore sconosciuto' }));
      throw new Error(errorData.error || `Errore ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) {
      throw new Error('Risposta non è un PDF');
    }
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Verifica magic number PDF (%PDF)
    if (uint8Array.length < 4 || uint8Array[0] !== 0x25 || uint8Array[1] !== 0x50) {
      throw new Error('File ricevuto non è un PDF valido');
    }
    
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fir-${fir.rentri_numero}.pdf`;
    document.body.appendChild(a);
    a.click();
    globalThis.URL.revokeObjectURL(url);
    a.remove();
    
    console.log('[RENTRI-PDF] PDF ufficiale scaricato:', fir.rentri_numero);
  } catch (error) {
    console.error('[RENTRI-PDF] Errore download:', error);
    alert(`Errore download PDF da RENTRI:\n\n${error.message}\n\nVerifica che il FIR sia stato trasmesso correttamente.`);
  }
}

/**
 * Stampa singolo movimento con codice RENTRI assegnato.
 * Per movimenti trasmessi tenta prima il PDF ufficiale dal VPS/RENTRI,
 * con fallback al PDF locale generato da jsPDF.
 */
export async function printMovimento(mov) {
  const isTrasmesso = ['trasmesso', 'synced', 'completato', 'trasmesso_manuale_check'].includes(mov.sync_status);

  // Tenta PDF ufficiale da RENTRI (solo se trasmesso e org_id disponibile)
  if (isTrasmesso && mov.org_id) {
    try {
      const apiUrl = import.meta.env.VITE_RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri';
      const response = await fetch(`${apiUrl}/movimenti/${mov.id}/pdf?org_id=${mov.org_id}`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' }
      });
      console.log('[printMovimento] VPS status:', response.status);
      if (response.ok) {
        const blob = await response.blob();
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `movimento-${mov.rentri_id || mov.id?.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        globalThis.URL.revokeObjectURL(url);
        a.remove();
        return;
      }
      // 422 = RENTRI non supporta PDF per movimenti → fallback locale
    } catch (e) {
      console.warn('[printMovimento] VPS error, fallback locale:', e.message);
    }
  }

  // PDF locale (fallback)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 15;
  const pageW = 210;
  let y = 15;

  // Intestazione
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MOVIMENTO REGISTRO RIFIUTI - RENTRI', margin, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('D.Lgs. 152/2006', margin, 16);
  if (!isTrasmesso) {
    doc.setTextColor(251, 191, 36);
    doc.text('NON TRASMESSO A RENTRI', pageW - margin, 16, { align: 'right' });
  } else {
    doc.setTextColor(52, 211, 153);
    doc.text('TRASMESSO A RENTRI [OK]', pageW - margin, 16, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);
  y = 28;

  // Codice RENTRI / Transazione
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageW - margin * 2, 12, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (mov.rentri_id) {
    doc.text(`Codice RENTRI: ${mov.rentri_id}`, margin + 3, y + 5);
  } else if (mov.transazione_id) {
    doc.text(`Transazione RENTRI: ${mov.transazione_id}`, margin + 3, y + 5);
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text('Codice RENTRI: non ancora assegnato', margin + 3, y + 5);
    doc.setTextColor(0, 0, 0);
  }
  const statoLabel = { pending: 'Da trasmettere', in_trasmissione: 'In trasmissione', trasmesso: 'Trasmesso', synced: 'Sincronizzato RENTRI', completato: 'Completato', error: 'Errore' };
  doc.setFont('helvetica', 'normal');
  doc.text(`Stato: ${statoLabel[mov.sync_status] || mov.sync_status || 'Da trasmettere'}`, margin + 3, y + 10);
  doc.text(`Stampa: ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}`, pageW - margin - 3, y + 10, { align: 'right' });
  y += 16;

  const drawSection = (title, rgb) => {
    doc.setFillColor(...rgb);
    doc.rect(margin, y, pageW - margin * 2, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, y + 5);
    doc.setTextColor(0, 0, 0);
    y += 9;
  };

  const drawField = (label, value, x, maxLen) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', x, y);
    doc.setFont('helvetica', 'normal');
    const val = String(value || 'n.d.');
    doc.text(maxLen ? val.substring(0, maxLen) : val, x + 35, y);
  };

  const colW = (pageW - margin * 2) / 2;

  const nd = 'n.d.';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('it-IT') : nd;
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString('it-IT') : nd;

  // Sezione 1 - Dati operazione
  drawSection('1. DATI OPERAZIONE', [37, 99, 235]);
  drawField('Data operazione', fmtDate(mov.data_operazione), margin);
  drawField('Tipo', mov.tipo_operazione || nd, margin + colW);
  y += 6;
  drawField('Causale', mov.causale_operazione || nd, margin);
  const annoProg = `${mov.anno || nd} / ${mov.progressivo || nd}`;
  drawField('Anno/Prog.', annoProg, margin + colW);
  y += 6;
  drawField('Data registrazione', fmtDateTime(mov.data_ora_registrazione), margin);
  y += 8;

  // Sezione 2 - Rifiuto
  drawSection('2. RIFIUTO', [220, 38, 38]);
  drawField('Codice EER', mov.codice_eer || nd, margin);
  drawField('Stato fisico', mov.stato_fisico || nd, margin + colW);
  y += 6;
  drawField('Descrizione', mov.descrizione_eer || mov.descrizione || nd, margin, 50);
  y += 6;
  const qtaLabel = mov.quantita ? `${parseFloat(mov.quantita).toFixed(2)} ${mov.unita_misura || 'kg'}` : nd;
  drawField('Quantita', qtaLabel, margin);
  drawField('Destinato a', mov.destinato_attivita || nd, margin + colW);
  y += 6;
  if (mov.caratteristiche_pericolo && mov.caratteristiche_pericolo.length > 0) {
    drawField('Caratteristiche pericolo', mov.caratteristiche_pericolo.join(', '), margin, 60);
    y += 6;
  }
  y += 4;

  // Sezione 3 - Produttore (se presente)
  if (mov.produttore_denominazione || mov.produttore_codice_fiscale) {
    drawSection('3. PRODUTTORE', [5, 150, 105]);
    drawField('Denominazione', mov.produttore_denominazione || nd, margin, 45);
    drawField('CF/P.IVA', mov.produttore_codice_fiscale || nd, margin + colW);
    y += 6;
    if (mov.produttore_indirizzo) {
      drawField('Indirizzo', mov.produttore_indirizzo, margin, 50);
      y += 6;
    }
    y += 4;
  }

  // Sezione 4 - Trasportatore (se presente)
  if (mov.trasportatore_denominazione || mov.numero_fir) {
    drawSection('4. TRASPORTO / FIR', [124, 58, 237]);
    if (mov.trasportatore_denominazione) {
      drawField('Trasportatore', mov.trasportatore_denominazione, margin, 45);
      drawField('Albo', mov.trasportatore_num_iscrizione_albo || nd, margin + colW);
      y += 6;
    }
    if (mov.numero_fir) {
      drawField('N. FIR', mov.numero_fir, margin);
      drawField('Data inizio', fmtDate(mov.data_inizio_trasporto), margin + colW);
      y += 6;
    }
    y += 4;
  }

  // Sezione 5 - Destinatario (se presente)
  if (mov.destinatario_denominazione) {
    drawSection('5. DESTINATARIO', [71, 85, 105]);
    drawField('Denominazione', mov.destinatario_denominazione, margin, 45);
    drawField('Autorizzazione', mov.destinatario_num_autorizzazione || nd, margin + colW);
    y += 6;
    y += 4;
  }

  // Sezione 6 - VFU (se presente)
  if (mov.veicolo_fuori_uso) {
    drawSection('6. VEICOLO FUORI USO', [180, 83, 9]);
    drawField('N. Registro VFU', mov.vfu_numero_registro || nd, margin);
    drawField('Data registro', fmtDate(mov.vfu_data_registro), margin + colW);
    y += 6;
    y += 4;
  }

  // Annotazioni
  if (mov.annotazioni || mov.note) {
    drawSection('NOTE / ANNOTAZIONI', [71, 85, 105]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const noteText = doc.splitTextToSize(mov.annotazioni || mov.note || '', pageW - margin * 2 - 6);
    doc.text(noteText, margin + 3, y);
    y += noteText.length * 4 + 4;
  }

  // Footer
  const footerY = 287;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(`ID locale: ${mov.id || nd}`, margin, footerY + 4);
  if (mov.sync_at) {
    doc.text(`Trasmesso il: ${new Date(mov.sync_at).toLocaleString('it-IT')}`, pageW / 2, footerY + 4, { align: 'center' });
  }
  doc.text('Pag. 1', pageW - margin, footerY + 4, { align: 'right' });

  const filename = `movimento-${mov.rentri_id || mov.id?.substring(0, 8) || 'bozza'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Scheda demolizione VFU stampabile per enti di ispezione
 * Mostra le 6 fasi obbligatorie con date, e verifica conformità 10 giorni
 * (D.Lgs. 209/2003 e D.Lgs. 152/2006)
 *
 * @param {object} caseData - Record da demolition_cases
 * @param {Array}  steps    - Array di record da vfu_processing_steps (con step_code, started_at, completed_at)
 * @param {string} orgName  - Nome azienda
 */
export function printSchedaDemolizione(caseData, steps = [], orgName = '') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 18;
  let y = 18;

  const fmt = (d) => d ? new Date(d).toLocaleDateString('it-IT') : 'n.d.';

  const stepMap = {};
  for (const s of steps) {
    stepMap[s.step_code] = s;
  }

  // Intestazione
  doc.setFillColor(26, 37, 54);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SCHEDA FASI DEMOLIZIONE VEICOLO', margin, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('D.Lgs. 209/2003 - Veicoli Fuori Uso', margin, 20);
  doc.text(`${orgName}  |  Stampa: ${new Date().toLocaleDateString('it-IT')}`, pageW - margin, 20, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  y = 38;

  // Dati veicolo
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageW - margin * 2, 24, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Dati Veicolo', margin + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Targa: ${caseData.targa || 'n.d.'}`, margin + 3, y + 12);
  doc.text(`Telaio (VIN): ${caseData.telaio || 'n.d.'}`, margin + 60, y + 12);
  doc.text(`Marca/Modello: ${caseData.marca_modello || 'n.d.'}`, margin + 120, y + 12);
  doc.text(`Anno: ${caseData.anno || 'n.d.'}`, margin + 3, y + 18);
  doc.text(`Peso ingresso: ${caseData.peso_ingresso_kg ? `${caseData.peso_ingresso_kg} kg` : 'n.d.'}`, margin + 40, y + 18);
  doc.text(`Normativa: D.Lgs. ${caseData.normativa_applicabile || '209/03'}`, margin + 100, y + 18);
  y += 30;

  // Titolo sezione fasi
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Fasi della Demolizione', margin, y);
  y += 8;

  // Calcolo conformità bonifica entro 10 giorni
  const stepAccettazione = stepMap['accettazione'];
  const stepBonifica = stepMap['bonifica'];
  const dataAccettazione = stepAccettazione?.completed_at || caseData.processing_started_at;
  const dataBonifica = stepBonifica?.completed_at;
  let giorniBonifica = null;
  let conforme = null;

  if (dataAccettazione && dataBonifica) {
    const ms = new Date(dataBonifica) - new Date(dataAccettazione);
    giorniBonifica = Math.ceil(ms / (1000 * 60 * 60 * 24));
    conforme = giorniBonifica <= 10;
  }

  // Tabella fasi
  const colW = [70, 38, 38, 18];
  const rowH = 10;
  const hdrH = 9;
  const totalW = pageW - margin * 2;

  // Header tabella
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, totalW, hdrH, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  ['Fase', 'Data inizio', 'Data completamento', ''].forEach((h, i) => {
    const x = margin + colW.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(h, x + 2, y + 6);
  });
  doc.setTextColor(0, 0, 0);
  y += hdrH;

  // Definizione fasi richieste dall'ente
  const dataAccettazioneStarted = stepAccettazione?.started_at || caseData.processing_started_at || caseData.created_at;

  let firNote = 'FIR non emesso';
  if (caseData.fir_rifiuti_id) {
    firNote = caseData.fir_numero ? `N. ${caseData.fir_numero}` : 'FIR creato';
  }

  const FASI = [
    {
      label: '1. Accettazione veicolo',
      code: 'accettazione',
      started: dataAccettazioneStarted,
      completed: dataAccettazione || caseData.created_at,
      note: null,
    },
    {
      label: '2. Emissione Formulario (FIR)',
      code: '_fir',
      started: caseData.fir_rifiuti_id ? caseData.created_at : null,
      completed: caseData.fir_rifiuti_id ? caseData.created_at : null,
      note: firNote,
    },
    {
      label: '3. Bonifica ambientale',
      code: 'bonifica',
      started: stepBonifica?.started_at,
      completed: dataBonifica,
      note: giorniBonifica !== null ? `${giorniBonifica} giorni dall'accettazione` : null,
    },
    {
      label: '4. Emissione Cert. Rottamazione',
      code: '_cert_rott',
      started: null,
      completed: caseData.certificato_rottamazione_data,
      note: caseData.certificato_rottamazione_numero ? `N° ${caseData.certificato_rottamazione_numero}` : null,
    },
    {
      label: '5. Emissione Cert. Radiazione PRA',
      code: 'radiazione_pra',
      started: stepMap['radiazione_pra']?.started_at,
      completed: stepMap['radiazione_pra']?.completed_at,
      note: null,
    },
    {
      label: '6. Pressatura / Conferimento',
      code: 'conferimento',
      started: stepMap['conferimento']?.started_at,
      completed: stepMap['conferimento']?.completed_at,
      note: null,
    },
  ];

  FASI.forEach((fase, idx) => {
    const isCompleted = !!fase.completed;
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(margin, y, totalW, rowH, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', idx === 0 || isCompleted ? 'bold' : 'normal');
    doc.setTextColor(isCompleted ? 0 : 130, isCompleted ? 0 : 130, isCompleted ? 0 : 130);

    // Fase con eventuale nota
    const labelText = fase.note ? `${fase.label}` : fase.label;
    doc.text(labelText, margin + 2, y + 6.5);
    if (fase.note) {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(fase.note, margin + 2, y + 9.5);
    }

    // Data inizio
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(fmt(fase.started), margin + colW[0] + 2, y + 6.5);

    // Data completamento
    if (fase.completed) {
      doc.setTextColor(16, 160, 90);
      doc.text(fmt(fase.completed), margin + colW[0] + colW[1] + 2, y + 6.5);
    } else {
      doc.setTextColor(180, 180, 180);
      doc.text('n.d.', margin + colW[0] + colW[1] + 2, y + 6.5);
    }
    doc.setTextColor(0, 0, 0);

    // Stato
    const statoX = margin + colW[0] + colW[1] + colW[2] + 2;
    if (isCompleted) {
      doc.setTextColor(16, 160, 90);
      doc.text('OK', statoX, y + 6.5);
    } else {
      doc.setTextColor(200, 200, 200);
      doc.text('-', statoX, y + 6.5);
    }
    doc.setTextColor(0, 0, 0);

    y += rowH;
  });

  y += 10;

  // Box conformità 10 giorni
  const conformeColor = conforme === true ? [220, 252, 231] : conforme === false ? [254, 226, 226] : [241, 245, 249];
  doc.setFillColor(...conformeColor);
  doc.rect(margin, y, totalW, 16, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (conforme === true) {
    doc.setTextColor(21, 128, 61);
    doc.text(`CONFORME - Bonifica completata in ${giorniBonifica} giorni (<= 10 gg previsti dalla legge)`, margin + 4, y + 10);
  } else if (conforme === false) {
    doc.setTextColor(185, 28, 28);
    doc.text(`NON CONFORME - Bonifica completata in ${giorniBonifica} giorni (limite 10 gg D.Lgs. 209/2003)`, margin + 4, y + 10);
  } else {
    doc.setTextColor(100, 100, 100);
    doc.text('Verifica 10 giorni: dati mancanti (bonifica o accettazione non registrate)', margin + 4, y + 10);
  }
  doc.setTextColor(0, 0, 0);
  y += 22;

  // Spazio firma
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Responsabile demolizione:', margin, y);
  doc.line(margin + 55, y, margin + 140, y);
  y += 12;
  doc.text('Data: _____ / _____ / __________', margin, y);
  doc.text('Firma e timbro: ___________________________', margin + 80, y);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Scheda VFU - ${caseData.targa || caseData.telaio || caseData.id?.substring(0, 8) || ''} - ${orgName} - Generata il ${new Date().toLocaleDateString('it-IT')}`,
    pageW / 2, 287, { align: 'center' }
  );

  const filename = `scheda-demolizione-${caseData.targa || caseData.id?.substring(0, 8) || 'vfu'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
