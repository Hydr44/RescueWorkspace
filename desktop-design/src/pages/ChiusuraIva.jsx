import { Button, Dropdown } from '@carbon/react';
import { Download, Email } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';
import ListTable from '../components/ListTable.jsx';

// Chiusura IVA del periodo: registri vendite e acquisti, totali per aliquota, invio al commercialista. Corrisponde a src/pages/InvoiceChiusuraIva.jsx.
const RIGHE = [{ k: 'v22', reg: 'Vendite', al: '22 per cento', imp: '14.620,00', iva: '3.216,40', n: 41 }, { k: 'v0', reg: 'Vendite', al: 'Esenti, articolo 15', imp: '96,00', iva: '0,00', n: 3 }, { k: 'a22', reg: 'Acquisti', al: '22 per cento', imp: '4.180,00', iva: '919,60', n: 9 }, { k: 'a10', reg: 'Acquisti', al: '10 per cento', imp: '312,00', iva: '31,20', n: 2 }];
const COL = [{ key: 'reg', label: 'Registro', width: 120 }, { key: 'al', label: 'Aliquota', width: 160 }, { key: 'n', label: 'Documenti', width: 100 }, { key: 'imp', label: 'Imponibile', width: 130, render: (r) => r.imp + ' euro' }, { key: 'iva', label: 'IVA', width: 130, render: (r) => r.iva + ' euro' }];
export default function ChiusuraIva() {
  return (
    <div className="rm-page">
      <PageHeader title="Chiusura IVA" sub="Settembre 2026, liquidazione mensile" actions={<><Dropdown id="p" size="md" label="Settembre 2026" items={['Settembre 2026', 'Agosto 2026']} style={{ width: 170 }} /><Button kind="tertiary" size="md" renderIcon={Download}>Registri in CSV</Button><Button size="md" renderIcon={Email}>Invia al commercialista</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>
        <KpiTile label="IVA sulle vendite" value="3.216,40 euro" context="41 fatture emesse" /><KpiTile label="IVA sugli acquisti" value="950,80 euro" context="11 fatture ricevute" /><KpiTile label="IVA da versare" value="2.265,60 euro" context="entro il 16 ottobre, F24" /><KpiTile label="Da sistemare" value="2" context="fatture ricevute senza registrazione" />
      </div>
      <div style={{ marginBottom: 12 }}><ListTable columns={COL} rows={RIGHE} rowKey="k" selectable={false} footer="Registri IVA vendite e acquisti del periodo, con XML e PDF allegati all'invio" /></div>
      <Card title="Da sistemare prima di chiudere" extra="2" style={{ marginBottom: 16 }}>
        <div className="rm-row"><div><b>Fattura ricevuta da Q8, 312,00 euro</b><div className="rm-muted">arrivata dal Sistema di interscambio il 23 settembre, senza conto</div></div><span className="rm-status--late">da registrare</span></div>
        <div className="rm-row"><div><b>Fattura 2026/0140 scartata</b><div className="rm-muted">non entra nel registro finché non viene reinviata</div></div><span className="rm-status--late">da reinviare</span></div>
      </Card>
    </div>
  );
}
