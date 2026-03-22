// src/pages/RifiutiReportNormativo.jsx
/**
 * Report normativo per enti di ispezione
 * Quantità rifiuti gestiti per normativa applicabile (D.Lgs. 209/03 vs 152/06)
 */

import { useState, useEffect, useMemo } from "react";
import { useOrg } from "../context/OrgContext";
import { supabaseBrowser } from "../lib/supabase-browser";
import { FiFileText, FiRefreshCw, FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";

const CURRENT_YEAR = new Date().getFullYear();

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`bg-[#1a2536] border rounded-xl p-4 ${color}`}>
      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function NormativaRow({ normativa, dati, totaleVeicoli, totaleKg }) {
  const pctVeicoli = totaleVeicoli > 0 ? ((dati.veicoli / totaleVeicoli) * 100).toFixed(1) : "0.0";
  const pctKg = totaleKg > 0 ? ((dati.kg / totaleKg) * 100).toFixed(1) : "0.0";
  const is209 = normativa === "209/03";

  return (
    <tr className="border-b border-[#243044]">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
          is209 ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
        }`}>
          D.Lgs. {normativa}
        </span>
        <div className="text-xs text-slate-500 mt-0.5">
          {is209 ? "VFU — Autoveicoli M1, N1, Motoveicoli L" : "Rifiuti speciali — N2, N3, M2, M3, altri"}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="text-sm font-semibold text-slate-200">{dati.veicoli}</div>
        <div className="text-xs text-slate-500">{pctVeicoli}%</div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="text-sm font-semibold text-slate-200">
          {dati.kg > 0 ? `${dati.kg.toLocaleString("it-IT")} kg` : "—"}
        </div>
        <div className="text-xs text-slate-500">{pctKg}%</div>
      </td>
      <td className="px-4 py-3">
        <div className="w-full bg-[#243044] rounded-full h-2">
          <div
            className={`h-2 rounded-full ${is209 ? "bg-blue-500" : "bg-amber-500"}`}
            style={{ width: `${pctVeicoli}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{pctVeicoli}% dei veicoli</div>
      </td>
    </tr>
  );
}

export default function RifiutiReportNormativo() {
  const { orgId } = useOrg();
  const [anno, setAnno] = useState(CURRENT_YEAR - 1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (orgId) {
      loadReport();
      loadOrgName();
    }
  }, [orgId, anno]);

  async function loadOrgName() {
    try {
      const supabase = supabaseBrowser();
      const { data } = await supabase.from("orgs").select("name").eq("id", orgId).maybeSingle();
      if (data) setOrgName(data.name);
    } catch {}
  }

  async function loadReport() {
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("demolition_cases")
        .select("normativa_applicabile, peso_ingresso_kg, stato, created_at")
        .eq("org_id", orgId)
        .gte("created_at", `${anno}-01-01`)
        .lte("created_at", `${anno}-12-31T23:59:59`)
        .not("stato", "eq", "bozza");

      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error("Errore caricamento report:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const agg = {
      "209/03": { veicoli: 0, kg: 0 },
      "152/06": { veicoli: 0, kg: 0 },
    };

    for (const row of rows) {
      const n = row.normativa_applicabile || "209/03";
      if (!agg[n]) agg[n] = { veicoli: 0, kg: 0 };
      agg[n].veicoli += 1;
      agg[n].kg += parseFloat(row.peso_ingresso_kg) || 0;
    }

    return agg;
  }, [rows]);

  const totaleVeicoli = rows.length;
  const totaleKg = Object.values(stats).reduce((s, d) => s + d.kg, 0);

  function handlePrint() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 20;
    let y = 20;

    // Intestazione
    doc.setFillColor(26, 37, 54);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("DICHIARAZIONE QUANTITÀ RIFIUTI GESTITI", margin, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Anno ${anno} · ${orgName}`, margin, 20);
    doc.text(`Generato il: ${new Date().toLocaleDateString("it-IT")}`, pageW - margin, 20, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y = 38;

    // Riferimento normativo
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageW - margin * 2, 14, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const rifNorm = [
      "Documento redatto ai sensi di:",
      "· D.Lgs. 209/2003 (Attuazione della direttiva 2000/53/CE relativa ai veicoli fuori uso)",
      "· D.Lgs. 152/2006 (Norme in materia ambientale — Testo Unico Ambiente)",
    ];
    rifNorm.forEach((line, i) => doc.text(line, margin + 3, y + 4 + i * 4));
    doc.setTextColor(0, 0, 0);
    y += 22;

    // Titolo sezione
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Riepilogo annuale — Anno ${anno}`, margin, y);
    y += 8;

    // Tabella header
    const colWidths = [70, 35, 40, 35];
    const rowH = 8;
    const hdrH = 9;
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, pageW - margin * 2, hdrH, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    ["Normativa", "N° Veicoli", "Quantità (kg)", "% sul totale"].forEach((h, i) => {
      const x = margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(h, x + 2, y + 6);
    });
    doc.setTextColor(0, 0, 0);
    y += hdrH;

    // Righe dati
    Object.entries(stats).forEach(([normativa, dati], idx) => {
      const pctV = totaleVeicoli > 0 ? ((dati.veicoli / totaleVeicoli) * 100).toFixed(1) : "0.0";
      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
      doc.rect(margin, y, pageW - margin * 2, rowH, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const cells = [
        `D.Lgs. ${normativa}`,
        `${dati.veicoli}`,
        dati.kg > 0 ? `${Math.round(dati.kg).toLocaleString("it-IT")} kg` : "N/D",
        `${pctV}%`,
      ];
      cells.forEach((cell, i) => {
        const x = margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(cell, x + 2, y + 5.5);
      });
      y += rowH;
    });

    // Riga totale
    doc.setFillColor(220, 220, 230);
    doc.rect(margin, y, pageW - margin * 2, rowH, "F");
    doc.setFont("helvetica", "bold");
    const totalCells = [
      "TOTALE",
      `${totaleVeicoli}`,
      totaleKg > 0 ? `${Math.round(totaleKg).toLocaleString("it-IT")} kg` : "N/D",
      "100%",
    ];
    totalCells.forEach((cell, i) => {
      const x = margin + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(cell, x + 2, y + 5.5);
    });
    y += rowH + 14;

    // Dettaglio narrativo
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const d209 = stats["209/03"] || { veicoli: 0, kg: 0 };
    const d152 = stats["152/06"] || { veicoli: 0, kg: 0 };
    const pct209 = totaleVeicoli > 0 ? ((d209.veicoli / totaleVeicoli) * 100).toFixed(1) : "0.0";
    const pct152 = totaleVeicoli > 0 ? ((d152.veicoli / totaleVeicoli) * 100).toFixed(1) : "0.0";

    const narrative = [
      `Nel corso dell'anno ${anno} l'azienda ha gestito complessivamente ${totaleVeicoli} veicoli`,
      `per un totale di ${Math.round(totaleKg).toLocaleString("it-IT")} kg di rifiuti, di cui:`,
      "",
      `· N° ${d209.veicoli} veicoli ritirati per un totale di ${Math.round(d209.kg).toLocaleString("it-IT")} kg gestiti con la legge 209/03`,
      `  (veicoli M1, N1, L — autovetture, furgoni leggeri, motocicli) — ${pct209}%`,
      "",
      `· N° ${d152.veicoli} veicoli ritirati per un totale di ${Math.round(d152.kg).toLocaleString("it-IT")} kg gestiti con la legge 152/06`,
      `  (veicoli altre categorie: N2, N3, M2, M3, rimorchi, altri) — ${pct152}%`,
    ];
    narrative.forEach((line) => {
      doc.text(line, margin, y);
      y += 5.5;
    });

    y += 15;

    // Firma
    doc.line(margin, y, margin + 70, y);
    doc.text("Firma e timbro aziendale", margin, y + 5);
    doc.text(`Data: ___/___/______`, pageW - margin - 50, y + 5);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Documento generato da RescueManager · ${orgName} · Anno ${anno} · Pag. 1`,
      pageW / 2,
      287,
      { align: "center" }
    );

    doc.save(`report-normativo-${anno}.pdf`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FiFileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Report Normativo</h1>
            <p className="text-xs text-slate-500">Quantità rifiuti per D.Lgs. 209/03 e D.Lgs. 152/06</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={anno}
            onChange={(e) => setAnno(Number(e.target.value))}
            className="px-3 py-2 text-sm bg-[#141c27] border border-[#243044] rounded-lg text-slate-200 focus:ring-1 focus:ring-blue-500/40 outline-none"
          >
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={loadReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-[#1a2536] border border-[#243044] rounded-lg hover:bg-[#243044] transition-colors"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Aggiorna
          </button>
          <button
            onClick={handlePrint}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40"
          >
            <FiDownload className="w-3.5 h-3.5" />
            Scarica PDF
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300 space-y-1">
        <div className="font-semibold text-blue-400">Documento per enti di ispezione</div>
        <div>Questo report dimostra le quantità di rifiuti gestiti nell'anno selezionato, classificate per normativa applicabile.</div>
        <div>Il PDF generato include la dichiarazione narrativa con N° veicoli, kg totali e percentuali per ciascuna legge, pronta per firmare e allegare alla documentazione richiesta.</div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Caricamento dati...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Nessuna pratica completata per l'anno {anno}.<br />
          <span className="text-xs text-slate-500">Verifica che le pratiche abbiano stato diverso da &quot;bozza&quot;.</span>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Totale veicoli"
              value={totaleVeicoli}
              sub={`Anno ${anno}`}
              color="border-[#243044]"
            />
            <StatCard
              label="Totale rifiuti"
              value={totaleKg > 0 ? `${Math.round(totaleKg / 1000).toLocaleString("it-IT")} t` : "N/D"}
              sub={`${Math.round(totaleKg).toLocaleString("it-IT")} kg`}
              color="border-[#243044]"
            />
            <StatCard
              label="D.Lgs. 209/03"
              value={stats["209/03"]?.veicoli || 0}
              sub={totaleVeicoli > 0 ? `${(((stats["209/03"]?.veicoli || 0) / totaleVeicoli) * 100).toFixed(1)}% dei veicoli` : "—"}
              color="border-blue-500/20"
            />
            <StatCard
              label="D.Lgs. 152/06"
              value={stats["152/06"]?.veicoli || 0}
              sub={totaleVeicoli > 0 ? `${(((stats["152/06"]?.veicoli || 0) / totaleVeicoli) * 100).toFixed(1)}% dei veicoli` : "—"}
              color="border-amber-500/20"
            />
          </div>

          {/* Tabella */}
          <div className="bg-[#141c27] border border-[#243044] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#243044]">
              <h2 className="text-sm font-semibold text-slate-200">Dettaglio per normativa — Anno {anno}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#243044]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Normativa</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">N° Veicoli</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Quantità (kg)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">% sul totale</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats).map(([normativa, dati]) => (
                  <NormativaRow
                    key={normativa}
                    normativa={normativa}
                    dati={dati}
                    totaleVeicoli={totaleVeicoli}
                    totaleKg={totaleKg}
                  />
                ))}
                <tr className="bg-[#1a2536] border-t-2 border-[#243044]">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-200">Totale</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-200">{totaleVeicoli}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-200">
                    {totaleKg > 0 ? `${Math.round(totaleKg).toLocaleString("it-IT")} kg` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Testo dichiarazione */}
          <div className="bg-[#1a2536] border border-[#243044] rounded-xl p-5 space-y-2 text-sm text-slate-300">
            <div className="text-xs font-semibold uppercase text-slate-400 mb-3">Testo dichiarazione (incluso nel PDF)</div>
            <p>
              Nel corso dell'anno <strong>{anno}</strong> l'azienda ha gestito complessivamente{" "}
              <strong>{totaleVeicoli} veicoli</strong> per un totale di{" "}
              <strong>{Math.round(totaleKg).toLocaleString("it-IT")} kg</strong> di rifiuti, di cui:
            </p>
            <ul className="space-y-2 ml-2">
              <li className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 mt-0.5 shrink-0">209/03</span>
                <span>
                  N° <strong>{stats["209/03"]?.veicoli || 0}</strong> veicoli ritirati per un totale di{" "}
                  <strong>{Math.round(stats["209/03"]?.kg || 0).toLocaleString("it-IT")} kg</strong> gestiti con la legge 209/03{" "}
                  (veicoli M1, N1, L{" "}— autovetture, furgoni ≤3.5t, motocicli) —{" "}
                  <strong>
                    {totaleVeicoli > 0 ? (((stats["209/03"]?.veicoli || 0) / totaleVeicoli) * 100).toFixed(1) : "0.0"}%
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">152/06</span>
                <span>
                  N° <strong>{stats["152/06"]?.veicoli || 0}</strong> veicoli ritirati per un totale di{" "}
                  <strong>{Math.round(stats["152/06"]?.kg || 0).toLocaleString("it-IT")} kg</strong> gestiti con la legge 152/06{" "}
                  (veicoli altre categorie: N2, N3, M2, M3, rimorchi) —{" "}
                  <strong>
                    {totaleVeicoli > 0 ? (((stats["152/06"]?.veicoli || 0) / totaleVeicoli) * 100).toFixed(1) : "0.0"}%
                  </strong>
                </span>
              </li>
            </ul>
          </div>

          {/* Avviso pesi mancanti */}
          {rows.some((r) => !r.peso_ingresso_kg) && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
              <strong>Attenzione:</strong> {rows.filter((r) => !r.peso_ingresso_kg).length} pratiche non hanno il peso di ingresso registrato.
              I kg totali potrebbero essere sottostimati. Inserisci il peso nelle singole pratiche per dati precisi.
            </div>
          )}
        </>
      )}
    </div>
  );
}
