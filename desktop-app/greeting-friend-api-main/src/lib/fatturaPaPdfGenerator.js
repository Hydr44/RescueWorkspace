// src/lib/fatturaPaPdfGenerator.js
// Generatore PDF per XML FatturaPA SDI.
// Layout pulito, arioso e leggibile (no logo), conforme alle specifiche FatturaPA.
import { jsPDF } from "jspdf";

/* ─── Costanti ─── */
const C = {
  black: [0, 0, 0],
  dark: [30, 41, 59],      // slate-800 — testo principale
  mid: [71, 85, 105],      // slate-600 — testo secondario
  light: [148, 163, 184],  // slate-400 — note/hint
  line: [226, 232, 240],   // slate-200 — hairline
  bg: [248, 250, 252],     // slate-50  — fondo pannelli
  white: [255, 255, 255],
  accent: [15, 98, 160],   // blu istituzionale (più tenue)
  zebra: [252, 253, 255],  // riga alternata tabella
};

const M = { l: 16, r: 16, t: 16, b: 16 };
const PW = 210;
const PH = 297;
const CW = PW - M.l - M.r;

const EUR = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "€ 0,00";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
};

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  } catch { return d; }
};

/* ─── XML Parser helpers ─── */
function extractTag(xml, tag) {
  const m = xml.match(new RegExp("<" + tag + ">([^<]*)</" + tag + ">"));
  return m ? m[1].trim() : null;
}

function extractBlock(xml, tag) {
  const m = xml.match(new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">"));
  return m ? m[1] : null;
}

function extractAllBlocks(xml, tag) {
  const results = [];
  const re = new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">", "g");
  let m;
  while ((m = re.exec(xml)) !== null) results.push(m[1]);
  return results;
}

function parseXmlInvoiceData(xml) {
  const header = extractBlock(xml, "FatturaElettronicaHeader") || "";
  const body = extractBlock(xml, "FatturaElettronicaBody") || "";

  // Trasmissione
  const datiTrasmissione = extractBlock(header, "DatiTrasmissione") || "";
  const progressivoInvio = extractTag(datiTrasmissione, "ProgressivoInvio");
  const formatoTrasmissione = extractTag(datiTrasmissione, "FormatoTrasmissione");
  const codiceDestinatario = extractTag(datiTrasmissione, "CodiceDestinatario");
  const pecDestinatario = extractTag(datiTrasmissione, "PECDestinatario");

  // Cedente
  const cedenteBlock = extractBlock(header, "CedentePrestatore") || "";
  const cedenteDatiAnag = extractBlock(cedenteBlock, "DatiAnagrafici") || "";
  const cedenteSede = extractBlock(cedenteBlock, "Sede") || "";
  const cedente = {
    denominazione: extractTag(cedenteDatiAnag, "Denominazione") || extractTag(cedenteDatiAnag, "Nome"),
    nome: extractTag(cedenteDatiAnag, "Nome"),
    cognome: extractTag(cedenteDatiAnag, "Cognome"),
    idPaese: extractTag(cedenteDatiAnag, "IdPaese"),
    idCodice: extractTag(cedenteDatiAnag, "IdCodice"),
    codiceFiscale: extractTag(cedenteDatiAnag, "CodiceFiscale"),
    regimeFiscale: extractTag(cedenteDatiAnag, "RegimeFiscale"),
    indirizzo: extractTag(cedenteSede, "Indirizzo"),
    numeroCivico: extractTag(cedenteSede, "NumeroCivico"),
    cap: extractTag(cedenteSede, "CAP"),
    comune: extractTag(cedenteSede, "Comune"),
    provincia: extractTag(cedenteSede, "Provincia"),
    nazione: extractTag(cedenteSede, "Nazione"),
  };

  // Cessionario
  const cessionarioBlock = extractBlock(header, "CessionarioCommittente") || "";
  const cessDatiAnag = extractBlock(cessionarioBlock, "DatiAnagrafici") || "";
  const cessSede = extractBlock(cessionarioBlock, "Sede") || "";
  const cessionario = {
    denominazione: extractTag(cessDatiAnag, "Denominazione"),
    nome: extractTag(cessDatiAnag, "Nome"),
    cognome: extractTag(cessDatiAnag, "Cognome"),
    idPaese: extractTag(cessDatiAnag, "IdPaese"),
    idCodice: extractTag(cessDatiAnag, "IdCodice"),
    codiceFiscale: extractTag(cessDatiAnag, "CodiceFiscale"),
    indirizzo: extractTag(cessSede, "Indirizzo"),
    numeroCivico: extractTag(cessSede, "NumeroCivico"),
    cap: extractTag(cessSede, "CAP"),
    comune: extractTag(cessSede, "Comune"),
    provincia: extractTag(cessSede, "Provincia"),
    nazione: extractTag(cessSede, "Nazione"),
  };

  // Dati generali documento
  const datiGenerali = extractBlock(body, "DatiGenerali") || "";
  const datiGeneraliDoc = extractBlock(datiGenerali, "DatiGeneraliDocumento") || "";
  const tipoDocumento = extractTag(datiGeneraliDoc, "TipoDocumento");
  const divisa = extractTag(datiGeneraliDoc, "Divisa");
  const data = extractTag(datiGeneraliDoc, "Data");
  const numero = extractTag(datiGeneraliDoc, "Numero");
  const importoTotale = parseFloat(extractTag(datiGeneraliDoc, "ImportoTotaleDocumento") || "0");
  const causale = extractTag(datiGeneraliDoc, "Causale");
  const art73 = extractTag(datiGeneraliDoc, "Art73");

  // Bollo
  const datiBollo = extractBlock(datiGeneraliDoc, "DatiBollo") || "";
  const bolloVirtuale = extractTag(datiBollo, "BolloVirtuale");
  const importoBollo = extractTag(datiBollo, "ImportoBollo");

  // Righe dettaglio
  const datiBeniServizi = extractBlock(body, "DatiBeniServizi") || "";
  const righeBlocks = extractAllBlocks(datiBeniServizi, "DettaglioLinee");
  const righe = righeBlocks.map(r => ({
    numero: extractTag(r, "NumeroLinea"),
    descrizione: extractTag(r, "Descrizione") || "",
    quantita: parseFloat(extractTag(r, "Quantita") || "1"),
    unitaMisura: extractTag(r, "UnitaMisura"),
    prezzoUnitario: parseFloat(extractTag(r, "PrezzoUnitario") || "0"),
    prezzoTotale: parseFloat(extractTag(r, "PrezzoTotale") || "0"),
    aliquotaIVA: parseFloat(extractTag(r, "AliquotaIVA") || "0"),
    natura: extractTag(r, "Natura"),
  }));

  // Riepilogo IVA
  const riepilogoBlocks = extractAllBlocks(datiBeniServizi, "DatiRiepilogo");
  const riepilogo = riepilogoBlocks.map(r => ({
    aliquotaIVA: parseFloat(extractTag(r, "AliquotaIVA") || "0"),
    natura: extractTag(r, "Natura"),
    imponibile: parseFloat(extractTag(r, "ImponibileImporto") || "0"),
    imposta: parseFloat(extractTag(r, "Imposta") || "0"),
    esigibilitaIVA: extractTag(r, "EsigibilitaIVA"),
    riferimentoNormativo: extractTag(r, "RiferimentoNormativo"),
  }));

  // Pagamento
  const datiPagamento = extractBlock(body, "DatiPagamento") || "";
  const condizioniPagamento = extractTag(datiPagamento, "CondizioniPagamento");
  const dettaglioPag = extractBlock(datiPagamento, "DettaglioPagamento") || "";
  const pagamento = {
    condizioni: condizioniPagamento,
    modalita: extractTag(dettaglioPag, "ModalitaPagamento"),
    importo: parseFloat(extractTag(dettaglioPag, "ImportoPagamento") || "0"),
    scadenza: extractTag(dettaglioPag, "DataScadenzaPagamento"),
    iban: extractTag(dettaglioPag, "IBAN"),
    istituto: extractTag(dettaglioPag, "IstitutoFinanziario"),
  };

  return {
    progressivoInvio, formatoTrasmissione, codiceDestinatario, pecDestinatario,
    cedente, cessionario,
    tipoDocumento, divisa, data, numero, importoTotale, causale, art73,
    bolloVirtuale, importoBollo,
    righe, riepilogo, pagamento,
  };
}

/* ─── Tipo Documento labels ─── */
const TIPO_DOC = {
  TD01: "Fattura", TD02: "Acconto/Anticipo su Fattura", TD03: "Acconto/Anticipo su Parcella",
  TD04: "Nota di Credito", TD05: "Nota di Debito", TD06: "Parcella",
  TD16: "Integrazione per reverse charge", TD17: "Integrazione/autofattura acquisti servizi estero",
  TD20: "Autofattura", TD24: "Fattura differita", TD25: "Fattura differita art.21 c.6",
  TD26: "Cessione beni ammortizzabili", TD27: "Fattura autoconsumo/cessioni gratuite",
};

const MODALITA_PAG = {
  MP01: "Contanti", MP02: "Assegno", MP03: "Assegno circolare",
  MP04: "Contanti c/o Tesoreria", MP05: "Bonifico", MP06: "Vaglia cambiario",
  MP07: "Bollettino bancario", MP08: "Carta di pagamento", MP12: "RIBA",
  MP14: "Quietanza erario", MP15: "Giroconto su conti di contabilità speciale",
  MP16: "Domiciliazione bancaria", MP17: "Domiciliazione postale",
  MP18: "Bollettino di c/c postale", MP19: "SEPA Direct Debit",
  MP20: "SEPA Direct Debit CORE", MP21: "SEPA Direct Debit B2B",
  MP22: "Trattenuta su somme già riscosse", MP23: "PagoPA",
};

const REGIME_FISCALE = {
  RF01: "Ordinario", RF02: "Contribuenti minimi", RF04: "Agricoltura",
  RF05: "Pesca", RF06: "Commercio ambulante", RF07: "Vendita sali e tabacchi",
  RF08: "Agenzie di viaggio", RF09: "Agriturismo", RF10: "Vendite a domicilio",
  RF11: "Rivendita beni usati", RF12: "Agenzie vendite all'asta",
  RF13: "Agenzie di viaggio", RF14: "Agenzie gestione servizi pubblici",
  RF15: "Agenzie organizzazione eventi", RF16: "Vendite a distanza",
  RF17: "Regime art.47-bis", RF18: "Forfettario", RF19: "Regime speciale",
};

/* ─── PDF Generator ─── */

const FONT = "helvetica";

function setText(doc, color, size, style = "normal") {
  doc.setTextColor(...color);
  doc.setFontSize(size);
  doc.setFont(FONT, style);
}

function hairline(doc, y, x1 = M.l, x2 = PW - M.r, color = C.line, w = 0.2) {
  doc.setDrawColor(...color);
  doc.setLineWidth(w);
  doc.line(x1, y, x2, y);
}

function fmtQta(q) {
  if (!Number.isFinite(q)) return "1";
  return q % 1 === 0 ? String(q) : q.toFixed(2).replace(".", ",");
}

/**
 * Genera un PDF pulito da XML FatturaPA.
 * @param {string} xml - Contenuto XML FatturaPA completo
 * @param {object} options - Opzioni aggiuntive
 * @param {string} options.foFilename - Nome file FO (opzionale)
 * @returns {jsPDF} - Documento PDF
 */
export function generateFatturaPaPdf(xml, options = {}) {
  const d = parseXmlInvoiceData(xml);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const right = PW - M.r;
  let y = M.t;

  const pageBreak = (need) => {
    if (y + need > PH - M.b - 6) { doc.addPage(); y = M.t; return true; }
    return false;
  };
  const sectionTitle = (txt) => {
    setText(doc, C.accent, 8, "bold");
    doc.text(txt.toUpperCase(), M.l, y);
    y += 2;
    hairline(doc, y, M.l, right);
    y += 5;
  };

  // ── INTESTAZIONE ───────────────────────────────────────────────
  const tipoLabel = TIPO_DOC[d.tipoDocumento] || d.tipoDocumento || "Documento";
  setText(doc, C.accent, 18, "bold");
  doc.text("Fattura Elettronica", M.l, y + 4);
  setText(doc, C.mid, 9, "normal");
  doc.text(`${tipoLabel}   ·   N. ${d.numero || "—"}   ·   ${fmtDate(d.data)}`, M.l, y + 10);

  setText(doc, C.light, 7, "normal");
  doc.text("TOTALE DOCUMENTO", right, y + 1, { align: "right" });
  setText(doc, C.dark, 17, "bold");
  doc.text(EUR(d.importoTotale), right, y + 8, { align: "right" });

  y += 14;
  hairline(doc, y, M.l, right, C.accent, 0.6);
  y += 5;

  // Meta trasmissione (riga discreta)
  const meta = [];
  if (d.progressivoInvio) meta.push(`Progressivo ${d.progressivoInvio}`);
  if (d.formatoTrasmissione) meta.push(`Formato ${d.formatoTrasmissione}`);
  if (d.codiceDestinatario) meta.push(`Cod. Dest. ${d.codiceDestinatario}`);
  if (d.pecDestinatario) meta.push(`PEC ${d.pecDestinatario}`);
  if (options.foFilename) meta.push(options.foFilename);
  if (meta.length) {
    setText(doc, C.light, 6.5, "normal");
    doc.text(doc.splitTextToSize(meta.join("   ·   "), CW)[0], M.l, y);
    y += 7;
  } else {
    y += 1;
  }

  // ── CEDENTE / CESSIONARIO (due card) ───────────────────────────
  const gap = 6;
  const cardW = (CW - gap) / 2;

  const partyLines = (p) => {
    const name = p.denominazione || [p.cognome, p.nome].filter(Boolean).join(" ") || "—";
    const rows = [];
    if (p.idCodice) rows.push(`P.IVA ${p.idPaese || "IT"}${p.idCodice}`);
    if (p.codiceFiscale) rows.push(`C.F. ${p.codiceFiscale}`);
    const addr = [p.indirizzo, p.numeroCivico].filter(Boolean).join(", ");
    if (addr) rows.push(addr);
    const city = [p.cap, p.comune, p.provincia ? `(${p.provincia})` : ""].filter(Boolean).join(" ").trim();
    if (city) rows.push(city);
    if (p.regimeFiscale) rows.push(`Regime ${REGIME_FISCALE[p.regimeFiscale] || p.regimeFiscale}`);
    return { name, rows };
  };
  const ced = partyLines(d.cedente);
  const ces = partyLines(d.cessionario);
  const maxRows = Math.max(ced.rows.length, ces.rows.length);
  const cardH = 12 + 5 + maxRows * 4 + 3;

  const drawCard = (x, label, info) => {
    doc.setFillColor(...C.bg);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");
    let cy = y + 6;
    setText(doc, C.accent, 7, "bold");
    doc.text(label, x + 5, cy);
    cy += 6;
    setText(doc, C.dark, 10, "bold");
    doc.text(doc.splitTextToSize(info.name, cardW - 10)[0], x + 5, cy);
    cy += 5;
    setText(doc, C.mid, 7.5, "normal");
    for (const r of info.rows) {
      doc.text(doc.splitTextToSize(r, cardW - 10)[0], x + 5, cy);
      cy += 4;
    }
  };
  drawCard(M.l, "CEDENTE / PRESTATORE", ced);
  drawCard(M.l + cardW + gap, "CESSIONARIO / COMMITTENTE", ces);
  y += cardH + 8;

  // Causale
  if (d.causale) {
    setText(doc, C.light, 6.5, "bold");
    doc.text("CAUSALE", M.l, y);
    y += 4;
    setText(doc, C.mid, 8, "normal");
    const cl = doc.splitTextToSize(d.causale, CW);
    doc.text(cl, M.l, y);
    y += cl.length * 4 + 3;
  }
  if (d.bolloVirtuale === "SI" && d.importoBollo) {
    setText(doc, C.light, 7, "normal");
    doc.text(`Imposta di bollo assolta virtualmente — € ${d.importoBollo}`, M.l, y);
    y += 6;
  }

  // ── TABELLA RIGHE ──────────────────────────────────────────────
  pageBreak(20);
  sectionTitle("Dettaglio Righe");

  const col = {
    n:      { x: M.l + 1 },
    desc:   { x: M.l + 9, w: 96 },
    qta:    { rx: M.l + 9 + 100 + 14 },
    prezzo: { rx: M.l + 9 + 100 + 14 + 26 },
    iva:    { rx: M.l + 9 + 100 + 14 + 26 + 16 },
    tot:    { rx: right },
  };

  const headerRow = () => {
    doc.setFillColor(...C.bg);
    doc.rect(M.l, y, CW, 7, "F");
    setText(doc, C.mid, 7, "bold");
    doc.text("#", col.n.x, y + 4.7);
    doc.text("DESCRIZIONE", col.desc.x, y + 4.7);
    doc.text("QTÀ", col.qta.rx, y + 4.7, { align: "right" });
    doc.text("PREZZO", col.prezzo.rx, y + 4.7, { align: "right" });
    doc.text("IVA", col.iva.rx, y + 4.7, { align: "right" });
    doc.text("TOTALE", col.tot.rx, y + 4.7, { align: "right" });
    y += 7;
  };
  headerRow();

  for (let i = 0; i < d.righe.length; i++) {
    const r = d.righe[i];
    const descLines = doc.splitTextToSize(r.descrizione || "—", col.desc.w).slice(0, 3);
    const rowH = Math.max(7, 3 + descLines.length * 4);
    if (pageBreak(rowH + 4)) headerRow();
    if (i % 2 === 1) { doc.setFillColor(...C.zebra); doc.rect(M.l, y, CW, rowH, "F"); }

    const bY = y + 5;
    setText(doc, C.mid, 8, "normal");
    doc.text(String(r.numero || i + 1), col.n.x, bY);
    setText(doc, C.dark, 8, "normal");
    descLines.forEach((ln, li) => doc.text(ln, col.desc.x, bY + li * 4));
    setText(doc, C.mid, 8, "normal");
    doc.text(fmtQta(r.quantita), col.qta.rx, bY, { align: "right" });
    doc.text(EUR(r.prezzoUnitario), col.prezzo.rx, bY, { align: "right" });
    doc.text(r.aliquotaIVA > 0 ? `${r.aliquotaIVA}%` : (r.natura || "0%"), col.iva.rx, bY, { align: "right" });
    setText(doc, C.dark, 8, "bold");
    doc.text(EUR(r.prezzoTotale), col.tot.rx, bY, { align: "right" });

    y += rowH;
  }
  hairline(doc, y, M.l, right);
  y += 7;

  // ── RIEPILOGO IVA ──────────────────────────────────────────────
  if (d.riepilogo.length) {
    pageBreak(12 + d.riepilogo.length * 6);
    sectionTitle("Riepilogo IVA");
    setText(doc, C.light, 6.5, "bold");
    doc.text("ALIQUOTA", M.l, y);
    doc.text("NATURA", M.l + 28, y);
    doc.text("IMPONIBILE", M.l + 100, y, { align: "right" });
    doc.text("IMPOSTA", M.l + 140, y, { align: "right" });
    doc.text("ESIG.", right, y, { align: "right" });
    y += 2;
    hairline(doc, y, M.l, right);
    y += 4;
    for (const r of d.riepilogo) {
      pageBreak(6);
      setText(doc, C.dark, 7.5, "normal");
      doc.text(r.aliquotaIVA > 0 ? `${r.aliquotaIVA}%` : "0%", M.l, y);
      setText(doc, C.mid, 7.5, "normal");
      doc.text(r.natura || "—", M.l + 28, y);
      doc.text(EUR(r.imponibile), M.l + 100, y, { align: "right" });
      doc.text(EUR(r.imposta), M.l + 140, y, { align: "right" });
      doc.text(r.esigibilitaIVA || "—", right, y, { align: "right" });
      y += 5.5;
    }
    y += 3;
  }

  // ── TOTALI ─────────────────────────────────────────────────────
  const totImponibile = d.riepilogo.reduce((s, r) => s + r.imponibile, 0);
  const totImposta = d.riepilogo.reduce((s, r) => s + r.imposta, 0);
  const totDoc = d.importoTotale || totImponibile + totImposta;

  pageBreak(34);
  const boxW = 80;
  const boxX = right - boxW;
  const boxH = 28;
  doc.setFillColor(...C.bg);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.roundedRect(boxX, y, boxW, boxH, 1.5, 1.5, "FD");
  setText(doc, C.mid, 8, "normal");
  doc.text("Imponibile", boxX + 5, y + 7);
  doc.text("Imposta", boxX + 5, y + 13);
  setText(doc, C.dark, 8, "normal");
  doc.text(EUR(totImponibile), boxX + boxW - 5, y + 7, { align: "right" });
  doc.text(EUR(totImposta), boxX + boxW - 5, y + 13, { align: "right" });
  hairline(doc, y + 17, boxX + 4, boxX + boxW - 4);
  setText(doc, C.accent, 11, "bold");
  doc.text("TOTALE", boxX + 5, y + 24);
  doc.text(EUR(totDoc), boxX + boxW - 5, y + 24, { align: "right" });
  y += boxH + 9;

  // ── PAGAMENTO ──────────────────────────────────────────────────
  if (d.pagamento.modalita || d.pagamento.iban || d.pagamento.scadenza) {
    pageBreak(28);
    sectionTitle("Pagamento");
    const kv = [];
    if (d.pagamento.modalita) kv.push(["Modalità", MODALITA_PAG[d.pagamento.modalita] || d.pagamento.modalita]);
    if (d.pagamento.condizioni) {
      const cond = { TP01: "A rate", TP02: "Completo", TP03: "Anticipo" }[d.pagamento.condizioni] || d.pagamento.condizioni;
      kv.push(["Condizioni", cond]);
    }
    if (d.pagamento.scadenza) kv.push(["Scadenza", fmtDate(d.pagamento.scadenza)]);
    if (d.pagamento.importo) kv.push(["Importo", EUR(d.pagamento.importo)]);
    const cw = CW / 4;
    kv.slice(0, 4).forEach(([k, v], idx) => {
      const x = M.l + idx * cw;
      setText(doc, C.light, 6.5, "normal");
      doc.text(k.toUpperCase(), x, y);
      setText(doc, C.dark, 8.5, "normal");
      doc.text(doc.splitTextToSize(String(v), cw - 4)[0], x, y + 5);
    });
    y += 11;
    if (d.pagamento.iban) {
      setText(doc, C.light, 6.5, "normal");
      doc.text("IBAN", M.l, y);
      setText(doc, C.dark, 8.5, "normal");
      doc.text(`${d.pagamento.iban}${d.pagamento.istituto ? "   ·   " + d.pagamento.istituto : ""}`, M.l, y + 5);
      y += 10;
    }
  }

  // ── FOOTER ─────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    hairline(doc, PH - M.b - 2, M.l, right);
    setText(doc, C.light, 6, "normal");
    doc.text("Documento generato da XML FatturaPA — conforme al D.Lgs. 127/2015", M.l, PH - M.b + 2);
    doc.text(`Pagina ${p} / ${pages}`, right, PH - M.b + 2, { align: "right" });
  }

  return doc;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Rappresentazione UFFICIALE (foglio di stile Agenzia delle Entrate)
 * Standard di visualizzazione "a norma": l'XML viene trasformato con il
 * foglio di stile XSLT ufficiale AdE → HTML → PDF (Chromium printToPDF).
 * Se qualcosa fallisce si ricade sul generatore jsPDF legacy.
 * ───────────────────────────────────────────────────────────────────────── */

// Ripulisce l'input: rimuove BOM, eventuale involucro/metadati SDI e isola
// l'elemento radice <FatturaElettronica> (con o senza prefisso namespace).
function cleanFatturaXml(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/^﻿/, "").trim();
  const m = s.match(/<([\w-]+:)?FatturaElettronica[\s>][\s\S]*<\/(?:[\w-]+:)?FatturaElettronica>/);
  if (m) s = m[0];
  return s;
}

// FPA12 → PA, FSM* → semplificata, default ordinaria (FPR12).
function detectStylesheetKind(xml) {
  const fmt = extractTag(xml, "FormatoTrasmissione")
    || (xml.match(/FormatoTrasmissione>\s*([A-Z0-9]+)/)?.[1] ?? "");
  if (/FPA1\d/i.test(fmt)) return "pa";
  if (/FSM\d|semplificat/i.test(fmt)) return "semplificata";
  return "ordinaria";
}

function base64ToBlob(b64, mime = "application/pdf") {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// XML + XSL → HTML (XSLTProcessor nativo di Chromium, XSLT 1.0).
function transformXmlWithXsl(xml, xslText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");
  if (xmlDoc.querySelector("parsererror")) throw new Error("XML non valido");
  const xslDoc = parser.parseFromString(xslText, "application/xml");
  if (xslDoc.querySelector("parsererror")) throw new Error("Foglio di stile non valido");
  const proc = new XSLTProcessor();
  proc.importStylesheet(xslDoc);
  const out = proc.transformToDocument(xmlDoc);
  if (!out) throw new Error("Trasformazione XSLT fallita");
  const html = new XMLSerializer().serializeToString(out);
  if (!html || html.length < 200) throw new Error("Output HTML vuoto");
  return html;
}

/**
 * Genera il Blob PDF "a norma" via foglio di stile ufficiale AdE.
 * @throws se non disponibile (no IPC / no rete+cache / XML o XSL invalidi)
 */
export async function generateOfficialFatturaPaPdfBlob(xml) {
  if (typeof window === "undefined" || !window.api?.sdi?.getStylesheet || !window.api?.print?.quotePdf) {
    throw new Error("Rappresentazione ufficiale non disponibile in questo contesto");
  }
  const clean = cleanFatturaXml(xml);
  if (!clean) throw new Error("XML fattura assente");
  const kind = detectStylesheetKind(clean);
  const res = await window.api.sdi.getStylesheet({ kind });
  if (!res?.xsl) throw new Error("Foglio di stile ufficiale non reperibile");
  const html = transformXmlWithXsl(clean, res.xsl);
  const b64 = await window.api.print.quotePdf({ html });
  if (!b64) throw new Error("Generazione PDF fallita");
  return base64ToBlob(b64);
}

/**
 * Genera un Blob PDF da XML FatturaPA (per preview/embed).
 * Usa il foglio di stile ufficiale AdE; fallback al generatore legacy.
 * @returns {Promise<Blob>}
 */
export async function generateFatturaPaPdfBlob(xml, options = {}) {
  try {
    return await generateOfficialFatturaPaPdfBlob(xml);
  } catch (e) {
    console.warn("[FatturaPA] foglio di stile ufficiale non usato, fallback legacy:", e?.message || e);
    return generateFatturaPaPdf(xml, options).output("blob");
  }
}

/**
 * Genera e scarica un PDF da XML FatturaPA.
 * Rappresentazione ufficiale AdE con fallback legacy.
 * @returns {Promise<void>}
 */
export async function downloadFatturaPaPdf(xml, filename = "FatturaPA", options = {}) {
  const blob = await generateFatturaPaPdfBlob(xml, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
