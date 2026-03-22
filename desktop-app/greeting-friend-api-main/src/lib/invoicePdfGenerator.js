// src/lib/invoicePdfGenerator.js
// Generatore PDF professionale per fatture — SaaS Autodemolitori
import { jsPDF } from "jspdf";
import { CompanySettingsService } from "./services/companySettingsService";

/* ─── Costanti Design ─── */
const C = {
  dark: [17, 24, 39],         // gray-900
  mid: [55, 65, 81],          // gray-700
  light: [107, 114, 128],     // gray-500
  muted: [156, 163, 175],     // gray-400
  line: [229, 231, 235],      // gray-200
  bg: [249, 250, 251],        // gray-50
  white: [255, 255, 255],
  accent: [5, 150, 105],      // emerald-600
  accentLight: [209, 250, 229], // emerald-100
  blue: [37, 99, 235],        // blue-600
};

const M = { l: 18, r: 18, t: 14, b: 22 };
const PW = 210;
const CW = PW - M.l - M.r;

/* ─── Helpers ─── */
const EUR = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "€ 0,00";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return iso; }
};

const fmtDateShort = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("it-IT"); }
  catch { return iso; }
};

function rect(doc, x, y, w, h, color, r = 0) {
  doc.setFillColor(...color);
  r > 0 ? doc.roundedRect(x, y, w, h, r, r, "F") : doc.rect(x, y, w, h, "F");
}

function line(doc, x1, y1, x2, y2, color = C.line, w = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(w);
  doc.line(x1, y1, x2, y2);
}

function pageBreak(doc, y, need = 30) {
  if (y + need > 275) { doc.addPage(); return M.t + 5; }
  return y;
}

async function loadLogoImage(base64) {
  if (!base64) return null;
  const src = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ img, w: img.naturalWidth || img.width, h: img.naturalHeight || img.height, src });
    img.onerror = () => resolve(null);
    img.src = src;
    setTimeout(() => resolve(img.complete && (img.naturalWidth || img.width) ? { img, w: img.naturalWidth || img.width, h: img.naturalHeight || img.height, src } : null), 800);
  });
}

function fitLogo(origW, origH, maxW, maxH) {
  if (!origW || !origH) return { w: maxW, h: maxH };
  const ratio = origW / origH;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) { h = maxH; w = h * ratio; }
  return { w, h };
}

/* ─── Modalità pagamento labels ─── */
const MP = {
  MP01: "Contanti", MP02: "Assegno", MP03: "Assegno circolare",
  MP04: "Contanti c/o Tesoreria", MP05: "Bonifico", MP06: "Vaglia cambiario",
  MP07: "Bollettino bancario", MP08: "Carta di pagamento", MP09: "RID",
  MP10: "RID utenze", MP11: "RID veloce", MP12: "RIBA",
  MP13: "MAV", MP14: "Quietanza erario", MP15: "Giroconto",
  MP16: "Domiciliazione bancaria", MP17: "Domiciliazione postale",
  MP18: "Bollettino c/c postale", MP19: "SEPA Direct Debit",
  MP20: "SEPA DD CORE", MP21: "SEPA DD B2B",
  MP22: "Trattenuta su somme riscosse", MP23: "PagoPA",
};

const TD = {
  TD01: "Fattura", TD02: "Acconto su fattura", TD03: "Acconto su parcella",
  TD04: "Nota di Credito", TD05: "Nota di Debito", TD06: "Parcella",
  TD16: "Integrazione reverse charge", TD17: "Autofattura servizi estero",
  TD20: "Autofattura", TD24: "Fattura differita", TD25: "Fattura differita art.21",
  TD26: "Cessione beni ammortizzabili", TD27: "Autoconsumo/cessioni gratuite",
};

/* ─── Sezione: Header — Logo grande SX + barra accent + dati emittente DX ─── */
async function drawHeader(doc, companyName, companyInfo, logoBase64, tipoLabel, numero, data) {
  let y = M.t;
  const LOGO_MAX_W = 60;
  const LOGO_MAX_H = 38;
  const headerH = 42;

  // ── Sfondo header ──
  rect(doc, M.l, y, CW, headerH, C.bg, 3);

  // ── Logo (grande, a sinistra) ──
  let logoAreaW = 65;
  const logoData = logoBase64 ? await loadLogoImage(logoBase64) : null;
  if (logoData) {
    const { w, h } = fitLogo(logoData.w, logoData.h, LOGO_MAX_W, LOGO_MAX_H);
    const logoX = M.l + (logoAreaW - w) / 2;
    const logoY = y + (headerH - h) / 2;
    try {
      doc.addImage(logoData.src, "PNG", logoX, logoY, w, h, undefined, "FAST");
    } catch { /* logo non caricabile */ }
  } else {
    // Nessun logo: nome azienda grande come placeholder
    logoAreaW = 0;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(companyName, M.l + 5, y + 14);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.light);
    let iy = y + 20;
    companyInfo.forEach(ln => { if (ln) { doc.text(ln, M.l + 5, iy); iy += 3.5; } });
  }

  // ── Barra accent verticale ──
  if (logoData) {
    const barX = M.l + logoAreaW + 2;
    doc.setFillColor(...C.accent);
    doc.rect(barX, y + 4, 1.2, headerH - 8, "F");

    // ── Dati emittente (a destra della barra) ──
    const textX = barX + 6;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(companyName, textX, y + 10);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    let iy = y + 15;
    companyInfo.forEach(ln => { if (ln) { doc.text(ln, textX, iy); iy += 3.5; } });
  }

  // ── Tipo documento + numero (angolo in alto a destra) ──
  const rx = PW - M.r - 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.accent);
  doc.text(tipoLabel.toUpperCase(), rx, y + 6, { align: "right" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(`N. ${numero || "—"}`, rx, y + 14, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text(fmtDate(data), rx, y + 19, { align: "right" });

  y += headerH + 5;

  // ── Linea accent sottile ──
  line(doc, M.l, y, PW - M.r, y, C.accent, 0.6);
  return y + 5;
}

/* ─── Sezione: Destinatario (SX) + Condizioni Pagamento (DX) affiancati ─── */
function drawClientAndPayment(doc, y, clientName, clientLines, sdiLines, pag) {
  const halfW = (CW - 4) / 2;
  const leftX = M.l;
  const rightX = M.l + halfW + 4;
  const boxR = 2.5;

  // Calcola altezza necessaria per entrambi i box
  const clientCount = clientLines.filter(Boolean).length + sdiLines.length;
  const payLines = pag ? [pag.modalita || pag.modPag, pag.scadenza || pag.dataScadenza, pag.iban, pag.banca, pag.importo].filter(Boolean).length : 0;
  const boxH = Math.max(30, 14 + Math.max(clientCount, payLines + 1) * 4.5);

  // ── Box Destinatario (sinistra) ──
  rect(doc, leftX, y, halfW, boxH, C.bg, boxR);
  doc.setFillColor(...C.accent);
  doc.rect(leftX, y, 1.5, boxH, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.accent);
  doc.text("DESTINATARIO", leftX + 6, y + 5);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(clientName || "—", leftX + 6, y + 11);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  let clY = y + 16;
  clientLines.forEach(l => { if (l) { doc.text(l, leftX + 6, clY); clY += 3.8; } });

  // Dati SDI sotto i dati cliente
  if (sdiLines.length > 0) {
    clY += 1;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.muted);
    doc.text("SDI", leftX + 6, clY);
    clY += 3.5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.light);
    sdiLines.forEach(l => { if (l) { doc.text(l, leftX + 6, clY); clY += 3.5; } });
  }

  // ── Box Condizioni Pagamento (destra) ──
  rect(doc, rightX, y, halfW, boxH, C.bg, boxR);
  doc.setFillColor(...C.blue);
  doc.rect(rightX, y, 1.5, boxH, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.blue);
  doc.text("CONDIZIONI DI PAGAMENTO", rightX + 6, y + 5);

  let py = y + 12;
  doc.setFontSize(7.5);

  if (pag) {
    const mod = pag.modalita || pag.modPag;
    if (mod) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.dark);
      doc.text(MP[mod] || mod, rightX + 6, py);
      py += 5;
    }
    const pairs = [
      ["Scadenza", pag.scadenza || pag.dataScadenza ? fmtDateShort(pag.scadenza || pag.dataScadenza) : null],
      ["IBAN", pag.iban],
      ["Banca", pag.banca],
      ["Importo", pag.importo ? EUR(Number(pag.importo)) : null],
    ];
    pairs.forEach(([label, val]) => {
      if (!val) return;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.light);
      doc.setFontSize(7);
      doc.text(label, rightX + 6, py);
      doc.setTextColor(...C.dark);
      doc.setFontSize(7.5);
      doc.text(val, rightX + 28, py);
      py += 4.5;
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.setFontSize(7);
    doc.text("Nessuna condizione specificata", rightX + 6, py);
  }

  return y + boxH + 5;
}

/* ─── Sezione: Tabella righe ─── */
function drawItemsTable(doc, y, items) {
  y = pageBreak(doc, y, 35);

  const col = { desc: M.l, qty: 112, unit: 132, vat: 155, tot: PW - M.r };

  // Header tabella
  rect(doc, M.l, y, CW, 7, C.dark, 1.5);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("DESCRIZIONE", col.desc + 3, y + 4.8);
  doc.text("Q.TÀ", col.qty + 5, y + 4.8, { align: "center" });
  doc.text("PREZZO UNIT.", col.unit + 10, y + 4.8, { align: "right" });
  doc.text("IVA %", col.vat + 5, y + 4.8, { align: "right" });
  doc.text("IMPORTO", col.tot, y + 4.8, { align: "right" });
  y += 9;

  let imponibile = 0;
  let ivaTotal = 0;

  (items || []).forEach((item, idx) => {
    // Priorità: item_description > item_code (ex descr) > descr (fallback)
    const description = item.item_description || item.item_code || item.descr || "—";
    const descLines = doc.splitTextToSize(description, col.qty - col.desc - 6);
    const rowHeight = Math.max(descLines.length * 3.8, 7);
    
    y = pageBreak(doc, y, rowHeight + 3);
    const importo = Number(item.qty || 0) * Number(item.price || 0);
    imponibile += importo;
    ivaTotal += importo * (Number(item.vat_perc || item.vatPerc || 0) / 100);

    if (idx % 2 === 0) rect(doc, M.l, y - 2.5, CW, rowHeight + 2, C.bg);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark);
    
    // Stampa ogni riga della descrizione separatamente
    let descY = y + 1.5;
    descLines.forEach(line => {
      doc.text(line, col.desc + 3, descY);
      descY += 3.8;
    });

    // Allinea verticalmente gli altri campi al centro della riga
    const centerY = y + (rowHeight / 2) + 0.5;
    
    doc.setTextColor(...C.mid);
    doc.text(String(item.qty || 1), col.qty + 5, centerY, { align: "center" });
    doc.text(EUR(item.price || 0), col.unit + 10, centerY, { align: "right" });
    doc.text(`${item.vat_perc || item.vatPerc || 0}%`, col.vat + 5, centerY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(EUR(importo), col.tot, centerY, { align: "right" });

    y += rowHeight + 2.5;
  });

  // Linea sotto tabella
  y += 1;
  line(doc, M.l, y, PW - M.r, y, C.line, 0.4);
  y += 5;

  return { y, imponibile, ivaTotal };
}

/* ─── Sezione: Totali ─── */
function drawTotals(doc, y, imponibile, ivaTotal, totaleOverride) {
  y = pageBreak(doc, y, 35);
  const rx = PW - M.r;
  const lx = rx - 42;
  const totale = totaleOverride != null ? Number(totaleOverride) : (imponibile + ivaTotal);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Imponibile", lx, y, { align: "right" });
  doc.setTextColor(...C.dark);
  doc.text(EUR(imponibile), rx, y, { align: "right" });
  y += 5.5;

  doc.setTextColor(...C.light);
  doc.text("IVA", lx, y, { align: "right" });
  doc.setTextColor(...C.dark);
  doc.text(EUR(ivaTotal), rx, y, { align: "right" });
  y += 3;

  line(doc, lx - 8, y, rx, y, C.accent, 0.6);
  y += 6;

  // Box totale
  const boxW = rx - lx + 18;
  rect(doc, lx - 12, y - 4.5, boxW, 13, C.accent, 3);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("TOTALE DOCUMENTO", lx - 4, y + 2, { align: "right" });
  doc.setFontSize(13);
  doc.text(EUR(totale), rx + 2, y + 2.5, { align: "right" });

  return y + 16;
}

/* ─── Sezione: Footer ─── */
function drawFooter(doc, companyName, vatNumber, legalNotes) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    // Linea footer
    line(doc, M.l, 282, PW - M.r, 282, C.line, 0.2);

    // Dicitura obbligatoria fattura elettronica
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38); // Rosso per evidenziare
    const disclaimerY = 284;
    doc.text("COPIA DI CORTESIA - NON VALIDA AI FINI FISCALI", PW / 2, disclaimerY, { align: "center" });
    
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...C.muted);
    doc.text("Documento informatico privo di valore fiscale ai sensi del D.M. 55/2013", PW / 2, disclaimerY + 3, { align: "center" });

    // Note legali (se presenti)
    if (legalNotes) {
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.muted);
      const noteLines = doc.splitTextToSize(legalNotes, CW);
      const startY = disclaimerY + 7;
      doc.text(noteLines.slice(0, 2), M.l, startY);
    }

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    const footerY = legalNotes ? 295 : 291;
    doc.text(`${companyName}${vatNumber ? `  ·  P.IVA ${vatNumber}` : ""}`, M.l, footerY);
    doc.text(`Pagina ${i} di ${pages}`, PW - M.r, footerY, { align: "right" });
  }
}

/* ═══════════════════════════════════════════════════════════════
   GENERA PDF FATTURA EMESSA (da dati DB) — ASYNC per logo
   ═══════════════════════════════════════════════════════════════ */
export async function generateInvoicePdf(inv, items) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  // Carica dati aziendali + logo
  let companySettings = null;
  try {
    if (inv.org_id) {
      companySettings = await CompanySettingsService.getForExport(inv.org_id);
    }
  } catch { /* fallback su dati fattura */ }

  const cedente = inv.meta?.sdi?.cedente_prestatore || {};
  const companyName = companySettings?.company_name || cedente.denominazione || "Azienda";
  const vatNumber = companySettings?.vat_number || cedente.partita_iva || "";
  const tipoDoc = inv.meta?.sdi?.documento?.tipo_documento || "TD01";
  const tipoLabel = TD[tipoDoc] || "Fattura";
  const logoBase64 = companySettings?.logo_base64 || null;
  const legalNotes = companySettings?.legal_notes || null;

  // Costruisci info azienda
  const companyInfo = [
    vatNumber ? `P.IVA ${vatNumber}` : null,
    cedente.codice_fiscale || companySettings?.tax_code ? `C.F. ${cedente.codice_fiscale || companySettings?.tax_code}` : null,
    cedente.indirizzo?.street || companySettings?.address_street || null,
    [cedente.indirizzo?.zip || companySettings?.address_postal_code, cedente.indirizzo?.city || companySettings?.address_city, cedente.indirizzo?.province ? `(${cedente.indirizzo.province})` : ""].filter(Boolean).join(" ") || null,
    cedente.pec ? `PEC: ${cedente.pec}` : null,
    (cedente.email || companySettings?.email) ? `${cedente.email || companySettings.email}` : null,
    (cedente.telefono || companySettings?.phone) ? `Tel: ${cedente.telefono || companySettings.phone}` : null,
  ].filter(Boolean);

  // ── Header (logo grande SX + barra accent + dati emittente DX) ──
  let y = await drawHeader(doc, companyName, companyInfo, logoBase64, tipoLabel, inv.number, inv.date);

  // ── Destinatario (SX) + Condizioni Pagamento (DX) affiancati ──
  const addr = inv.customer_address || inv.meta?.sdi?.cessionario?.address;
  const clientLines = [
    inv.customer_vat ? `P.IVA ${inv.customer_vat}` : null,
    inv.customer_tax_code ? `C.F. ${inv.customer_tax_code}` : null,
    addr?.street || null,
    [addr?.zip, addr?.city, addr?.province ? `(${addr.province})` : ""].filter(Boolean).join(" ") || null,
  ];
  const sdiLines = [
    inv.provider_ext_id ? `Id SDI: ${inv.provider_ext_id}` : null,
    inv.meta?.sdi?.trasmissione?.codice_destinatario ? `Cod. Dest.: ${inv.meta.sdi.trasmissione.codice_destinatario}` : null,
    inv.meta?.sdi?.trasmissione?.pec_destinatario ? `PEC: ${inv.meta.sdi.trasmissione.pec_destinatario}` : null,
  ].filter(Boolean);

  y = drawClientAndPayment(doc, y, inv.customer_name, clientLines, sdiLines, inv.meta?.sdi?.pagamento);

  // ── Tabella Righe ──
  const { y: afterTable, imponibile, ivaTotal } = drawItemsTable(doc, y, items);
  y = afterTable;

  // ── Totali ──
  y = drawTotals(doc, y, imponibile, ivaTotal);

  // ── Bollo Virtuale ──
  if (inv.bollo_virtuale || inv.meta?.sdi?.bollo_virtuale) {
    y = pageBreak(doc, y, 12);
    rect(doc, M.l, y, CW, 10, [254, 252, 232], 2.5);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(146, 64, 14);
    doc.text("Imposta di bollo assolta in modo virtuale ai sensi del D.M. 17/06/2014 — € 2,00", M.l + 4, y + 6);
    y += 14;
  }

  // ── Note fattura ──
  const note = inv.meta?.sdi?.note;
  if (note) {
    y = pageBreak(doc, y, 14);
    rect(doc, M.l, y, CW, 14, C.bg, 2.5);
    doc.setFillColor(...C.accent);
    doc.rect(M.l, y, 1.5, 14, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.accent);
    doc.text("NOTE", M.l + 6, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.setFontSize(7);
    const noteLines = doc.splitTextToSize(note, CW - 12);
    doc.text(noteLines.slice(0, 3), M.l + 6, y + 9);
  }

  // ── Footer ──
  drawFooter(doc, companyName, vatNumber, legalNotes);

  return doc;
}

/* ═══════════════════════════════════════════════════════════════
   GENERA PDF DA XML FATTURAPA (fattura ricevuta da SDI)
   ═══════════════════════════════════════════════════════════════ */
export function generatePdfFromXml(xmlContent, metadata = {}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  // Parse XML helpers
  const ext = (tag) => {
    const m = xmlContent.match(new RegExp("<" + tag + ">([^<]*)</" + tag + ">"));
    return m ? m[1].trim() : null;
  };

  const progressivo = ext("ProgressivoInvio");
  const codDest = ext("CodiceDestinatario");

  // Dati cedente
  const cedenteDenom = ext("Denominazione");
  const cedenteBlock = xmlContent.match(/<CedentePrestatore>([\s\S]*?)<\/CedentePrestatore>/);
  let cedenteVat = null, cedenteCF = null;
  if (cedenteBlock) {
    cedenteVat = cedenteBlock[1].match(/<IdCodice>([^<]*)<\/IdCodice>/)?.[1]?.trim();
    cedenteCF = cedenteBlock[1].match(/<CodiceFiscale>([^<]*)<\/CodiceFiscale>/)?.[1]?.trim();
  }

  // Dati cessionario
  const cessBlock = xmlContent.match(/<CessionarioCommittente>([\s\S]*?)<\/CessionarioCommittente>/);
  let cessDenom = null, cessVat = null, cessCF = null;
  if (cessBlock) {
    const cb = cessBlock[1];
    cessDenom = cb.match(/<Denominazione>([^<]*)<\/Denominazione>/)?.[1]?.trim();
    cessVat = cb.match(/<IdCodice>([^<]*)<\/IdCodice>/)?.[1]?.trim();
    cessCF = cb.match(/<CodiceFiscale>([^<]*)<\/CodiceFiscale>/)?.[1]?.trim();
  }

  // Dati documento
  const tipoDoc = ext("TipoDocumento") || "TD01";
  const dataDoc = ext("Data");
  const numero = ext("Numero");
  const importoTotale = ext("ImportoTotaleDocumento");
  const causale = ext("Causale");
  const tipoLabel = TD[tipoDoc] || "Fattura";

  // Righe dettaglio
  const righeMatches = [...xmlContent.matchAll(/<DettaglioLinee>([\s\S]*?)<\/DettaglioLinee>/g)];
  const righe = righeMatches.map(rm => {
    const r = rm[1];
    return {
      descr: r.match(/<Descrizione>([^<]*)<\/Descrizione>/)?.[1] || "",
      qty: Number.parseFloat(r.match(/<Quantita>([^<]*)<\/Quantita>/)?.[1] || "1"),
      price: Number.parseFloat(r.match(/<PrezzoUnitario>([^<]*)<\/PrezzoUnitario>/)?.[1] || "0"),
      vat_perc: Number.parseFloat(r.match(/<AliquotaIVA>([^<]*)<\/AliquotaIVA>/)?.[1] || "0"),
    };
  });

  // Pagamento
  const modPag = ext("ModalitaPagamento");
  const scadenza = xmlContent.match(/<DataScadenzaPagamento>([^<]*)<\/DataScadenzaPagamento>/)?.[1];
  const importoPag = xmlContent.match(/<ImportoPagamento>([^<]*)<\/ImportoPagamento>/)?.[1];
  const iban = ext("IBAN");

  // Cedente info
  const cedenteInfo = [
    cedenteVat ? `P.IVA ${cedenteVat}` : null,
    cedenteCF ? `C.F. ${cedenteCF}` : null,
  ].filter(Boolean);

  const cedenteAddr = xmlContent.match(/<Sede>([\s\S]*?)<\/Sede>/);
  if (cedenteAddr) {
    const sa = cedenteAddr[1];
    const via = sa.match(/<Indirizzo>([^<]*)<\/Indirizzo>/)?.[1];
    const cap = sa.match(/<CAP>([^<]*)<\/CAP>/)?.[1];
    const comune = sa.match(/<Comune>([^<]*)<\/Comune>/)?.[1];
    const prov = sa.match(/<Provincia>([^<]*)<\/Provincia>/)?.[1];
    if (via) cedenteInfo.push(via);
    if (cap || comune) cedenteInfo.push([cap, comune, prov ? `(${prov})` : ""].filter(Boolean).join(" "));
  }

  // ── Header (senza logo per fatture ricevute, usa nome azienda) ──
  let y = M.t;
  const headerH = 32;
  rect(doc, M.l, y, CW, headerH, C.bg, 3);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(cedenteDenom || "Cedente", M.l + 5, y + 10);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  let infoY = y + 15;
  cedenteInfo.forEach(l => { if (l) { doc.text(l, M.l + 5, infoY); infoY += 3.5; } });

  // Tipo doc + numero (destra)
  const rx = PW - M.r - 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.accent);
  doc.text(tipoLabel.toUpperCase(), rx, y + 6, { align: "right" });
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(`N. ${numero || "—"}`, rx, y + 14, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text(fmtDate(dataDoc), rx, y + 19, { align: "right" });

  y += headerH + 5;
  line(doc, M.l, y, PW - M.r, y, C.accent, 0.6);
  y += 5;

  // ── Cessionario (SX) + Pagamento (DX) ──
  const clientLines = [
    cessVat ? `P.IVA ${cessVat}` : null,
    cessCF ? `C.F. ${cessCF}` : null,
  ];
  const sdiLines = [
    metadata.identificativo_sdi ? `Id SDI: ${metadata.identificativo_sdi}` : null,
    codDest ? `Cod. Dest.: ${codDest}` : null,
    progressivo ? `Prog.: ${progressivo}` : null,
  ].filter(Boolean);

  const pagObj = modPag ? { modalita: modPag, scadenza, importo: importoPag, iban } : null;
  y = drawClientAndPayment(doc, y, cessDenom, clientLines, sdiLines, pagObj);

  // ── Tabella Righe ──
  const { y: afterTable, imponibile, ivaTotal } = drawItemsTable(doc, y, righe);
  y = afterTable;

  // ── Totali ──
  y = drawTotals(doc, y, imponibile, ivaTotal, importoTotale);

  // ── Causale ──
  if (causale) {
    y = pageBreak(doc, y, 16);
    rect(doc, M.l, y, CW, 14, C.bg, 2.5);
    doc.setFillColor(...C.accent);
    doc.rect(M.l, y, 1.5, 14, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.accent);
    doc.text("CAUSALE", M.l + 6, y + 4.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.setFontSize(7);
    const cLines = doc.splitTextToSize(causale, CW - 12);
    doc.text(cLines.slice(0, 3), M.l + 6, y + 9);
  }

  // ── Footer ──
  drawFooter(doc, cedenteDenom || "", cedenteVat || "", null);

  return doc;
}
