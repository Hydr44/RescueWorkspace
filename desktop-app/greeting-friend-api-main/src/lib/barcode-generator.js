// src/lib/barcode-generator.js
import JsBarcode from 'jsbarcode';

/**
 * Sistema di generazione barcode e etichette per ricambi
 * Supporta Code-128, Code-39 e QR Code
 */

// Genera barcode Code-128
export const generateCode128 = (text, options = {}) => {
  try {
    const canvas = document.createElement('canvas');
    const defaultOptions = {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 12,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000',
      ...options
    };

    JsBarcode(canvas, text, defaultOptions);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating Code-128:', error);
    return null;
  }
};

// Genera barcode Code-39
export const generateCode39 = (text, options = {}) => {
  try {
    const canvas = document.createElement('canvas');
    const defaultOptions = {
      format: 'CODE39',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 12,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000',
      ...options
    };

    JsBarcode(canvas, text, defaultOptions);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating Code-39:', error);
    return null;
  }
};

// Genera QR Code
export const generateQRCode = (text, options = {}) => {
  try {
    const canvas = document.createElement('canvas');
    const defaultOptions = {
      format: 'QR',
      width: 200,
      height: 200,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000',
      ...options
    };

    JsBarcode(canvas, text, defaultOptions);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating QR Code:', error);
    return null;
  }
};

// Genera etichetta PDF per stampa
export const generateLabelPDF = async (partData, options = {}) => {
  try {
    // Importa pdf-lib dinamicamente
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([200, 120]); // Dimensioni etichetta standard
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const {
      showBarcode = true,
      showQR = false,
      showPrice = true,
      showLocation = true,
      companyName = 'RescueManager',
      fontSize = 8
    } = options;

    let yPosition = page.getHeight() - 20;

    // Header con nome azienda
    page.drawText(companyName, {
      x: 10,
      y: yPosition,
      size: fontSize + 2,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 15;

    // Nome ricambio
    const partName = partData.name || 'Ricambio';
    const maxWidth = 180;
    const nameLines = wrapText(partName, maxWidth, font, fontSize);
    
    nameLines.forEach(line => {
      page.drawText(line, {
        x: 10,
        y: yPosition,
        size: fontSize,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= fontSize + 2;
    });

    yPosition -= 5;

    // Codice interno
    if (partData.internal_code) {
      page.drawText(`Cod. Interno: ${partData.internal_code}`, {
        x: 10,
        y: yPosition,
        size: fontSize - 1,
        font: font,
        color: rgb(0.3, 0.3, 0.3)
      });
      yPosition -= fontSize + 1;
    }

    // Codice OEM
    if (partData.oem_code) {
      page.drawText(`Cod. OEM: ${partData.oem_code}`, {
        x: 10,
        y: yPosition,
        size: fontSize - 1,
        font: font,
        color: rgb(0.3, 0.3, 0.3)
      });
      yPosition -= fontSize + 1;
    }

    // Ubicazione
    if (showLocation && partData.warehouse_location) {
      page.drawText(`Ubicazione: ${partData.warehouse_location}`, {
        x: 10,
        y: yPosition,
        size: fontSize - 1,
        font: font,
        color: rgb(0.3, 0.3, 0.3)
      });
      yPosition -= fontSize + 1;
    }

    // Prezzo
    if (showPrice && partData.price_sell) {
      page.drawText(`Prezzo: €${partData.price_sell.toFixed(2)}`, {
        x: 10,
        y: yPosition,
        size: fontSize,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= fontSize + 2;
    }

    // Barcode
    if (showBarcode && partData.ean_code) {
      try {
        const barcodeDataUrl = generateCode128(partData.ean_code, {
          width: 1,
          height: 40,
          fontSize: 8,
          margin: 5
        });
        
        if (barcodeDataUrl) {
          const barcodeImage = await pdfDoc.embedPng(barcodeDataUrl);
          const barcodeDims = barcodeImage.scale(0.3);
          
          page.drawImage(barcodeImage, {
            x: 10,
            y: yPosition - 30,
            width: barcodeDims.width,
            height: barcodeDims.height
          });
          yPosition -= 35;
        }
      } catch (error) {
        console.error('Error adding barcode to PDF:', error);
      }
    }

    // QR Code
    if (showQR) {
      try {
        const qrData = JSON.stringify({
          id: partData.id,
          code: partData.internal_code || partData.ean_code,
          name: partData.name,
          type: 'spare_part'
        });
        
        const qrDataUrl = generateQRCode(qrData, {
          width: 60,
          height: 60,
          margin: 2
        });
        
        if (qrDataUrl) {
          const qrImage = await pdfDoc.embedPng(qrDataUrl);
          const qrDims = qrImage.scale(0.3);
          
          page.drawImage(qrImage, {
            x: page.getWidth() - qrDims.width - 10,
            y: yPosition - qrDims.height,
            width: qrDims.width,
            height: qrDims.height
          });
        }
      } catch (error) {
        console.error('Error adding QR code to PDF:', error);
      }
    }

    // Footer con data
    const now = new Date();
    page.drawText(`Stampato: ${now.toLocaleDateString()}`, {
      x: 10,
      y: 10,
      size: fontSize - 2,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;

  } catch (error) {
    console.error('Error generating label PDF:', error);
    throw error;
  }
};

// Utility per wrappare il testo
const wrapText = (text, maxWidth, font, fontSize) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

// Scarica PDF etichetta
export const downloadLabelPDF = async (partData, filename = null) => {
  try {
    const pdfBytes = await generateLabelPDF(partData);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `etichetta-${partData.internal_code || partData.id}.pdf`;
    a.click();
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading label PDF:', error);
    return false;
  }
};

// Genera barcode per batch
export const generateBatchBarcode = (batchData) => {
  const barcodeText = `B${batchData.id.slice(-8)}`;
  return generateCode128(barcodeText, {
    width: 2,
    height: 80,
    fontSize: 10,
    margin: 5
  });
};

// Genera QR Code per ricambio
export const generatePartQRCode = (partData) => {
  const qrData = JSON.stringify({
    id: partData.id,
    code: partData.internal_code || partData.ean_code,
    name: partData.name,
    type: 'spare_part',
    url: `${window.location.origin}/ricambi/${partData.id}`
  });
  
  return generateQRCode(qrData, {
    width: 150,
    height: 150,
    margin: 10
  });
};

// Valida formato barcode
export const validateBarcode = (code, format = 'CODE128') => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, { format });
    return true;
  } catch (error) {
    return false;
  }
};

// Genera codice interno automatico
export const generateInternalCode = (prefix = 'INT', year = null) => {
  const currentYear = year || new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}-${currentYear}-${timestamp}-${random}`;
};

// Genera codice EAN-13 per nuovi ricambi
export const generateEAN13 = () => {
  // Genera un codice EAN-13 valido (semplificato)
  const prefix = '200'; // Prefisso per codici interni
  const company = '12345'; // Codice azienda (5 cifre)
  const product = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  const code = prefix + company + product;
  
  // Calcola check digit
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code + checkDigit;
};

