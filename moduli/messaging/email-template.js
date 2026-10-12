// Generato da email-template.ts (desktop-design/email/tema-scuro/codice). Non modificare a mano: cambia il .ts e rigenera.
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var email_template_exports = {};
__export(email_template_exports, {
  BRAND: () => BRAND,
  BRAND_BLUE: () => BRAND_BLUE,
  BRAND_DARK: () => BRAND_DARK,
  CANVAS: () => CANVAS,
  EMAIL_FONT: () => EMAIL_FONT,
  HEAD_BG: () => HEAD_BG,
  HEAD_TEXT: () => HEAD_TEXT,
  INK: () => INK,
  INK_2: () => INK_2,
  INK_3: () => INK_3,
  LINE: () => LINE,
  LINK: () => LINK,
  LOGO_URL: () => LOGO_URL,
  MONO_FONT: () => MONO_FONT,
  PAPER: () => PAPER,
  TEXT: () => TEXT,
  brandedHtml: () => brandedHtml,
  emailAmount: () => emailAmount,
  emailCodeBox: () => emailCodeBox,
  emailCtaButton: () => emailCtaButton,
  emailFooter: () => emailFooter,
  emailHeader: () => emailHeader,
  emailInfoRow: () => emailInfoRow,
  emailInfoRows: () => emailInfoRows,
  emailNotice: () => emailNotice,
  emailTable: () => emailTable,
  emailTitle: () => emailTitle,
  emailWrapper: () => emailWrapper,
  esc: () => esc,
  setLogoUrl: () => setLogoUrl
});
module.exports = __toCommonJS(email_template_exports);
const PALETTE = {
  scuro: {
    canvas: "#0a1119",
    paper: "#141c27",
    line: "#243044",
    subtle: "#101722",
    ink: "#ffffff",
    text: "#cbd5e1",
    value: "#e2e8f0",
    label: "#94a3b8",
    minor: "#64748b",
    link: "#54a2ff",
    danger: "#ff8b8e",
    dangerBar: "#e5484d",
    ok: "#4ade80"
  },
  chiaro: {
    canvas: "#f4f4f4",
    paper: "#ffffff",
    line: "#e0e0e0",
    subtle: "#f4f4f4",
    ink: "#161616",
    text: "#262626",
    value: "#161616",
    label: "#525252",
    minor: "#8d8d8d",
    link: "#005dfa",
    danger: "#da1e28",
    dangerBar: "#da1e28",
    ok: "#198038"
  }
};
const EMAIL_FONT = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO_FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const BRAND = "#005dfa";
const HEAD_BG = "#0b3fb5";
const HEAD_TEXT = "#dbe6ff";
const LOGO_URL = "https://rescuemanager.eu/assets/logos/logo-principale-bianco.png";
const CANVAS = PALETTE.scuro.canvas;
const PAPER = PALETTE.scuro.paper;
const LINE = PALETTE.scuro.line;
const INK = PALETTE.scuro.ink;
const TEXT = PALETTE.scuro.text;
const INK_2 = PALETTE.scuro.label;
const INK_3 = PALETTE.scuro.minor;
const LINK = PALETTE.scuro.link;
const BRAND_DARK = HEAD_BG;
const BRAND_BLUE = BRAND;
let logoUrl = LOGO_URL;
function setLogoUrl(u) {
  logoUrl = u;
}
const pal = (t) => PALETTE[t === "chiaro" ? "chiaro" : "scuro"];
const PADX = 32;
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function para(t, c, size = 15, color, extra = "") {
  return `<p style="margin:0 0 14px;font-family:${EMAIL_FONT};font-size:${size}px;line-height:1.6;color:${color || c.text};${extra}">${t}</p>`;
}
function section(inner, c, pad = `0 ${PADX}px`) {
  return `<tr><td class="rm-pad" bgcolor="${c.paper}" style="padding:${pad};background:${c.paper};">${inner}</td></tr>`;
}
function emailHeader(sender, tema) {
  return `<tr><td class="rm-pad" bgcolor="${HEAD_BG}" style="padding:20px ${PADX}px;background:${HEAD_BG};"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td valign="middle"><img src="${logoUrl}" alt="RescueManager" width="133" height="26" style="width:133px;height:26px;display:block;border:0;outline:none;color:#ffffff;font-family:${EMAIL_FONT};font-size:16px;font-weight:600;" /></td>
${sender ? `<td valign="middle" align="right" style="font-family:${EMAIL_FONT};font-size:13px;line-height:1.4;color:${HEAD_TEXT};">per conto di<br><span style="color:#ffffff;">${sender}</span></td>` : ""}
</tr></table></td></tr>`;
}
function emailTitle(title, sub, tema) {
  const c = pal(tema);
  return `<h1 style="margin:0 0 ${sub ? "6" : "18"}px;font-family:${EMAIL_FONT};font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:${c.ink};">${title}</h1>${sub ? `<p style="margin:0 0 20px;font-family:${EMAIL_FONT};font-size:14px;line-height:1.5;color:${c.label};">${sub}</p>` : ""}`;
}
function emailCtaButton(href, label, tema) {
  const c = pal(tema);
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px;"><tr><td align="center" bgcolor="${BRAND}" style="background:${BRAND};">
<a href="${href}" style="display:block;padding:15px 24px;font-family:${EMAIL_FONT};font-size:15px;line-height:1.2;font-weight:600;color:#ffffff;text-decoration:none;text-align:center;">${label}</a></td></tr></table>
<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${c.minor};">Se il pulsante non funziona, apri questo indirizzo:</p>
<p style="margin:0 0 20px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;word-break:break-all;"><a href="${href}" style="color:${c.link};text-decoration:none;">${href}</a></p>`;
}
function emailCodeBox(code, note = "Vale per 10 minuti", tema) {
  const c = pal(tema);
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 22px;"><tr><td bgcolor="${c.subtle}" style="padding:18px 22px;background:${c.subtle};border:1px solid ${c.line};border-left:3px solid ${BRAND};">
<p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:13px;color:${c.label};">Codice</p>
<p style="margin:0;font-family:${MONO_FONT};font-size:32px;line-height:1.1;font-weight:600;letter-spacing:0.2em;color:${c.ink};">${code}</p>
${note ? `<p style="margin:8px 0 0;font-family:${EMAIL_FONT};font-size:12px;color:${c.minor};">${note}</p>` : ""}
</td></tr></table>`;
}
function emailAmount(label, value, tema) {
  const c = pal(tema);
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:4px 0 22px;"><tr><td bgcolor="${c.subtle}" style="padding:14px 18px;background:${c.subtle};border:1px solid ${c.line};">
<p style="margin:0;font-family:${EMAIL_FONT};font-size:13px;color:${c.label};">${label}</p>
<p style="margin:4px 0 0;font-family:${EMAIL_FONT};font-size:30px;line-height:1.15;font-weight:600;letter-spacing:-0.01em;color:${c.ink};">${value}</p>
</td></tr></table>`;
}
function emailNotice(text, level = "info", tema) {
  const c = pal(tema);
  const bar = level === "danger" ? c.dangerBar : BRAND;
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;"><tr><td bgcolor="${c.subtle}" style="padding:12px 16px;background:${c.subtle};border-left:3px solid ${bar};font-family:${EMAIL_FONT};font-size:14px;line-height:1.5;color:${c.value};">${text}</td></tr></table>`;
}
const rowPair = (r) => Array.isArray(r) ? r : [r.label, r.value];
function emailInfoRows(rows, tema) {
  const c = pal(tema);
  const tr = rows.map(rowPair).map(([l, v]) => `<tr>
<td class="rm-lab" width="150" valign="top" style="width:150px;padding:13px 16px 13px ${PADX}px;border-bottom:1px solid ${c.line};border-right:1px solid ${c.line};font-family:${EMAIL_FONT};font-size:14px;line-height:1.45;color:${c.label};">${l}</td>
<td class="rm-val" valign="top" style="padding:13px ${PADX}px 13px 20px;border-bottom:1px solid ${c.line};font-family:${EMAIL_FONT};font-size:15px;line-height:1.45;color:${c.value};">${v}</td></tr>`).join("");
  return `<tr><td bgcolor="${c.paper}" style="padding:0;background:${c.paper};"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid ${c.line};">${tr}</table></td></tr>`;
}
function emailInfoRow(label, value, tema) {
  return emailInfoRows([[label, value]], tema);
}
function emailTable(t, tema) {
  const c = pal(tema);
  const al = (i) => t.align && t.align[i] || "left";
  const padL = (i) => i === 0 ? PADX : 12;
  const padR = (i, n2) => i === n2 - 1 ? PADX : 12;
  const n = t.head.length;
  const cls = (i) => {
    const k = [i === 0 ? "rm-c0" : "", i === n - 1 ? "rm-cl" : ""].filter(Boolean).join(" ");
    return k ? ` class="${k}"` : "";
  };
  const w0 = (i) => i === 0 && n > 2 ? ' width="52%"' : "";
  const th = t.head.map((h, i) => `<td${cls(i)}${w0(i)} align="${al(i)}" style="padding:10px ${padR(i, n)}px 10px ${padL(i)}px;border-bottom:1px solid ${c.line};font-family:${EMAIL_FONT};font-size:13px;color:${c.label};text-align:${al(i)};">${h}</td>`).join("");
  const body = t.rows.map((r) => `<tr>${r.map((v, i) => `<td${cls(i)} align="${al(i)}" valign="top" style="padding:12px ${padR(i, n)}px 12px ${padL(i)}px;border-bottom:1px solid ${c.line};font-family:${EMAIL_FONT};font-size:14px;line-height:1.45;color:${c.value};text-align:${al(i)};">${v}</td>`).join("")}</tr>`).join("");
  const tot = (t.totals || []).map(([l, v], i, a) => {
    const last = i === a.length - 1;
    return `<tr><td class="rm-c0" colspan="${n - 1}" align="right" style="padding:${last ? "12px" : "8px"} 12px ${last ? "14px" : "4px"} ${PADX}px;font-family:${EMAIL_FONT};font-size:${last ? 15 : 14}px;color:${last ? c.ink : c.label};text-align:right;${last ? `border-top:1px solid ${c.line};font-weight:600;` : ""}">${l}</td>
<td class="rm-cl" align="right" style="padding:${last ? "12px" : "8px"} ${PADX}px ${last ? "14px" : "4px"} 12px;font-family:${EMAIL_FONT};font-size:${last ? 20 : 14}px;color:${last ? c.ink : c.value};text-align:right;white-space:nowrap;${last ? `border-top:1px solid ${c.line};font-weight:600;` : ""}">${v}</td></tr>`;
  }).join("");
  return `<tr><td bgcolor="${c.paper}" style="padding:0;background:${c.paper};"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid ${c.line};"><tr>${th}</tr>${body}${tot}</table></td></tr>`;
}
function emailFooter(reason = "Ricevi questa email perch\xE9 hai un account RescueManager.", sender = "", tema) {
  const c = pal(tema);
  const line = (t, color = c.minor) => `<p style="margin:0 0 4px;font-family:${EMAIL_FONT};font-size:12px;line-height:1.6;color:${color};">${t}</p>`;
  return `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;"><tr><td class="rm-foot" style="padding:20px 4px 0;">
${line("RescueManager S.r.l., Gela", c.label)}
${sender ? line(`Inviata da RescueManager per conto di ${sender}${/[.?]$/.test(sender) ? "" : "."}`) : ""}
${reason ? line(reason) : ""}
${line(`Per aiuto scrivi a <a href="mailto:info@rescuemanager.eu" style="color:${c.label};text-decoration:underline;">info@rescuemanager.eu</a>`)}
</td></tr></table>`;
}
function emailWrapper(content, preheader = "", tema, footer = "") {
  const c = pal(tema);
  const scheme = tema === "chiaro" ? "light" : "dark";
  return `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="${scheme}"><meta name="supported-color-schemes" content="${scheme}"><title>RescueManager</title>
<style>
:root{color-scheme:${scheme};supported-color-schemes:${scheme};}
body{margin:0;padding:0;}
a{text-decoration:none;}
@media only screen and (max-width:620px){
.rm-pad{padding-left:20px !important;padding-right:20px !important;}
.rm-lab{width:104px !important;padding-left:20px !important;padding-right:12px !important;font-size:13px !important;}
.rm-val{padding-right:20px !important;padding-left:14px !important;}
.rm-c0{padding-left:20px !important;}
.rm-cl{padding-right:20px !important;}
.rm-out{padding:12px 8px 28px !important;}
.rm-foot{padding:18px 12px 0 !important;}
}
</style></head>
<body bgcolor="${c.canvas}" style="margin:0;padding:0;background:${c.canvas};font-family:${EMAIL_FONT};-webkit-text-size-adjust:100%;">
${preheader ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${c.canvas};">${preheader}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${c.canvas}" style="background:${c.canvas};"><tr><td class="rm-out" align="center" style="padding:32px 16px 40px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="${c.paper}" style="width:100%;max-width:600px;background:${c.paper};border:1px solid ${c.line};">${content}</table>
${footer}
</td></tr></table></body></html>`;
}
function brandedHtml(body, o = {}) {
  const t = o.tema;
  const c = pal(t);
  const title = o.title || o.subtitle || null;
  const rows = o.rows && o.rows.length ? o.rows : o.infoRows && o.infoRows.length ? o.infoRows : null;
  const note = o.note || o.footerNote || null;
  const ps = String(body || "").split("\n").map((l) => l.trim() ? para(l, c) : "").join("");
  const top = `${title ? emailTitle(title, o.sub, t) : ""}${ps}${o.extraHtml || ""}${o.notice ? emailNotice(o.notice.text, o.notice.level || "info", t) : ""}${o.amount ? emailAmount(o.amount.label, o.amount.value, t) : ""}${o.code ? emailCodeBox(o.code, o.codeNote === void 0 ? "Vale per 10 minuti" : o.codeNote, t) : ""}`;
  const hasMid = !!(rows || o.table);
  const bottom = `${o.cta ? emailCtaButton(o.cta.href, o.cta.label, t) : ""}${note ? para(note, c, 13, c.label) : ""}`;
  let content = emailHeader(o.sender, t);
  content += section(top, c, `30px ${PADX}px ${hasMid ? 10 : bottom ? 8 : 18}px`);
  if (rows) content += emailInfoRows(rows, t);
  if (o.table) content += emailTable(o.table, t);
  if (bottom) content += section(bottom, c, `${hasMid ? 26 : 6}px ${PADX}px 14px`);
  else if (hasMid) content += section("", c, `0 ${PADX}px 18px`);
  return emailWrapper(content, o.preheader || title || "", t, emailFooter(o.reason, o.sender || "", t));
}
