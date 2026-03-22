/**
 * Sistema generazione etichette per ricambi
 * Supporta PDF (A4 + termiche), ZPL (Zebra), ESC/POS (Brother/Dymo)
 */

import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { generateEAN13, formatCode } from './sparePartCodes';

/**
 * Template etichette Avery 5160 (30 per foglio A4)
 */
const AVERY_5160 = {
  pageWidth: 210, // mm (A4)
  pageHeight: 297, // mm (A4)
  labelWidth: 66.7, // mm
  labelHeight: 25.4, // mm
  marginLeft: 5, // mm
  marginTop: 13, // mm
  cols: 3,
  rows: 10,
  gapX: 3.2, // mm
  gapY: 0, // mm
};

/**
 * Template etichetta termica 10x5cm
 */
const THERMAL_10x5 = {
  pageWidth: 100, // mm
  pageHeight: 50, // mm
  labelWidth: 100,
  labelHeight: 50,
  marginLeft: 0,
  marginTop: 0,
  cols: 1,
  rows: 1,
  gapX: 0,
  gapY: 0,
};

/**
 * Genera QR code come data URL
 */
async function generateQRCode(text, size = 200) {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('[LabelGenerator] QR code error:', error);
    return null;
  }
}

/**
 * Genera barcode come data URL
 */
function generateBarcode(code, format = 'CODE128') {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, {
      format: format,
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 5,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('[LabelGenerator] Barcode error:', error);
    return null;
  }
}

/**
 * Genera PDF con etichette Avery 5160 (30 per foglio)
 */
export async function generateAveryLabels(spareParts, options = {}) {
  const {
    template = AVERY_5160,
    includeQR = true,
    includeBarcode = true,
    includeLogo = false,
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let labelIndex = 0;

  for (const part of spareParts) {
    const row = Math.floor(labelIndex / template.cols);
    const col = labelIndex % template.cols;

    // Calcola posizione etichetta
    const x = template.marginLeft + col * (template.labelWidth + template.gapX);
    const y = template.marginTop + row * (template.labelHeight + template.gapY);

    // Bordo etichetta (debug)
    if (options.showBorders) {
      pdf.setDrawColor(200);
      pdf.rect(x, y, template.labelWidth, template.labelHeight);
    }

    // QR Code (sinistra)
    if (includeQR && part.internal_code) {
      const qrUrl = `https://rescuemanager.app/r/${part.internal_code}`;
      const qrImage = await generateQRCode(qrUrl, 150);
      if (qrImage) {
        pdf.addImage(qrImage, 'PNG', x + 2, y + 2, 20, 20);
      }
    }

    // Testo (destra)
    const textX = x + (includeQR ? 24 : 3);
    const textY = y + 4;

    // Nome ricambio (bold)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const nameLines = pdf.splitTextToSize(part.name || 'Ricambio', template.labelWidth - (includeQR ? 26 : 6));
    pdf.text(nameLines.slice(0, 2), textX, textY);

    // Codice interno
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Cod: ${part.internal_code || '-'}`, textX, textY + 6);

    // OEM
    if (part.oem_code) {
      pdf.text(`OEM: ${part.oem_code}`, textX, textY + 9);
    }

    // Ubicazione
    if (part.warehouse_location) {
      pdf.setFontSize(6);
      pdf.text(`Pos: ${part.warehouse_location}`, textX, textY + 12);
    }

    // Barcode in basso (se c'è spazio)
    if (includeBarcode && part.internal_code) {
      const ean13 = generateEAN13(part.internal_code);
      if (ean13) {
        const barcodeImage = generateBarcode(ean13, 'EAN13');
        if (barcodeImage) {
          pdf.addImage(barcodeImage, 'PNG', x + 2, y + template.labelHeight - 10, template.labelWidth - 4, 8);
        }
      }
    }

    labelIndex++;

    // Nuova pagina ogni 30 etichette
    if (labelIndex % (template.cols * template.rows) === 0 && labelIndex < spareParts.length) {
      pdf.addPage();
    }
  }

  return pdf;
}

/**
 * Genera PDF etichetta termica singola 10x5cm
 */
export async function generateThermalLabel(sparePart, options = {}) {
  const template = THERMAL_10x5;
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [template.pageWidth, template.pageHeight],
  });

  // QR Code (sinistra, grande)
  if (sparePart.internal_code) {
    const qrUrl = `https://rescuemanager.app/r/${sparePart.internal_code}`;
    const qrImage = await generateQRCode(qrUrl, 300);
    if (qrImage) {
      pdf.addImage(qrImage, 'PNG', 5, 5, 40, 40);
    }
  }

  // Testo (destra)
  const textX = 50;
  
  // Nome ricambio
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  const nameLines = pdf.splitTextToSize(sparePart.name || 'Ricambio', 45);
  pdf.text(nameLines.slice(0, 2), textX, 10);

  // Codice interno
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Cod: ${sparePart.internal_code || '-'}`, textX, 20);

  // OEM
  if (sparePart.oem_code) {
    pdf.setFontSize(8);
    pdf.text(`OEM: ${sparePart.oem_code}`, textX, 26);
  }

  // Marca
  if (sparePart.tecdoc_supplier) {
    pdf.text(`Marca: ${sparePart.tecdoc_supplier}`, textX, 31);
  }

  // Ubicazione
  if (sparePart.warehouse_location) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Ubicazione: ${sparePart.warehouse_location}`, textX, 38);
  }

  // Prezzo
  if (sparePart.price_sell) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`€ ${Number(sparePart.price_sell).toFixed(2)}`, textX, 45);
  }

  return pdf;
}

/**
 * Genera comando ZPL per stampante Zebra
 */
export function generateZPL(sparePart) {
  const code = sparePart.internal_code || 'N/A';
  const name = (sparePart.name || 'Ricambio').substring(0, 30);
  const oem = sparePart.oem_code || '';
  const location = sparePart.warehouse_location || '';
  const price = sparePart.price_sell ? `€ ${Number(sparePart.price_sell).toFixed(2)}` : '';

  // ZPL per etichetta 10x5cm (800x400 dots @ 203dpi)
  const zpl = `
^XA
^FO50,30^BQN,2,6^FDQA,https://rescuemanager.app/r/${code}^FS
^FO300,30^A0N,40,40^FD${name}^FS
^FO300,80^A0N,30,30^FDCod: ${code}^FS
^FO300,120^A0N,25,25^FDOEM: ${oem}^FS
^FO300,160^A0N,25,25^FDPos: ${location}^FS
^FO300,200^A0N,35,35^FD${price}^FS
^FO50,250^BY2^BCN,100,Y,N,N^FD${generateEAN13(code)}^FS
^XZ
  `.trim();

  return zpl;
}

/**
 * Genera comando ESC/POS per stampanti Brother/Dymo
 */
export function generateESCPOS(sparePart) {
  const ESC = '\x1B';
  const GS = '\x1D';
  
  const code = sparePart.internal_code || 'N/A';
  const name = (sparePart.name || 'Ricambio').substring(0, 30);
  const oem = sparePart.oem_code || '';
  const location = sparePart.warehouse_location || '';
  const price = sparePart.price_sell ? `EUR ${Number(sparePart.price_sell).toFixed(2)}` : '';

  let commands = '';
  
  // Inizializza
  commands += ESC + '@';
  
  // Nome (bold, grande)
  commands += ESC + 'E' + '\x01'; // Bold ON
  commands += GS + '!' + '\x11'; // Double size
  commands += name + '\n';
  commands += ESC + 'E' + '\x00'; // Bold OFF
  commands += GS + '!' + '\x00'; // Normal size
  
  // Codice interno
  commands += `Cod: ${code}\n`;
  
  // OEM
  if (oem) {
    commands += `OEM: ${oem}\n`;
  }
  
  // Ubicazione
  if (location) {
    commands += `Pos: ${location}\n`;
  }
  
  // Prezzo
  if (price) {
    commands += ESC + 'E' + '\x01'; // Bold ON
    commands += price + '\n';
    commands += ESC + 'E' + '\x00'; // Bold OFF
  }
  
  // Barcode EAN-13
  const ean13 = generateEAN13(code);
  if (ean13) {
    commands += GS + 'k' + '\x43' + '\x0C' + ean13; // EAN-13 barcode
  }
  
  // Taglia
  commands += '\n\n\n';
  commands += GS + 'V' + '\x00'; // Cut paper
  
  return commands;
}

/**
 * Scarica PDF
 */
export function downloadPDF(pdf, filename) {
  pdf.save(filename);
}

/**
 * Stampa PDF direttamente
 */
export function printPDF(pdf) {
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}

/**
 * Invia comando ZPL a stampante Zebra (via USB o rete)
 */
export async function sendToZebraPrinter(zpl, printerIP) {
  try {
    const response = await fetch(`http://${printerIP}:9100`, {
      method: 'POST',
      body: zpl,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('[LabelGenerator] Zebra printer error:', error);
    return false;
  }
}

export default {
  generateAveryLabels,
  generateThermalLabel,
  generateZPL,
  generateESCPOS,
  downloadPDF,
  printPDF,
  sendToZebraPrinter,
};
