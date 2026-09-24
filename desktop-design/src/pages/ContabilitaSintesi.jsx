import { Button } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';

// Sintesi contabilità: entrate e uscite del mese, conti principali, ultimi movimenti. Corrisponde a src/pages/AccountingDashboard.jsx.
const CONTI = [['Ricavi soccorso stradale', '9.640 euro'], ['Ricavi demolizioni', '3.120 euro'], ['Ricavi custodia', '1.860 euro'], ['Carburante', '2.210 euro'], ['Manutenzione mezzi', '1.480 euro'], ['Personale', '6.900 euro']];
const MOV = [['24 settembre', 'Incasso fattura 2026/0142', 'Autofficina Vella', '181,78', 'in'], ['23 settembre', 'Gasolio, distributore Q8 Gela', 'Carburante', '312,00', 'out'], ['23 settembre', 'Incasso fattura 2026/0139', 'Carrozzeria Di Dio', '366,00', 'in'], ['22 settembre', 'Revisione FN 245 KL', 'Manutenzione mezzi', '84,00', 'out'], ['20 settembre', 'Stipendi settembre', 'Personale', '6.900,00', 'out']];
export default function ContabilitaSintesi() {
  return (
    <div className="rm-page">
      <PageHeader title="Contabilità" sub="Settembre 2026, prima nota" actions={<><Button kind="tertiary" size="md">Piano dei conti</Button><Button size="md" renderIcon={Add}>Nuovo movimento</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>
        <KpiTile label="Entrate" value="14.620 euro" context="41 movimenti" /><KpiTile label="Uscite" value="10.590 euro" context="27 movimenti" /><KpiTile label="Risultato del mese" value="4.030 euro" context="a fronte di 3.210 ad agosto" /><KpiTile label="Da registrare" value="6" context="fatture ricevute senza movimento" />
      </div>
      <div style={{ display: 'flex', gap: 1, marginBottom: 12 }}>
        <Card title="Conti principali" extra="settembre" style={{ flex: 1 }}>{CONTI.map(([a, b]) => <div key={a} className="rm-row"><span>{a}</span><span>{b}</span></div>)}</Card>
        <Card title="Ultimi movimenti" extra="questa settimana" style={{ flex: 1.6 }}>{MOV.map(([d, t, c, i, k]) => <div key={t} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 150px 100px', gap: 12, padding: '7px 0', borderTop: '1px solid var(--border)', fontSize: 12.5 }}><span className="rm-muted">{d}</span><span>{t}</span><span className="rm-muted">{c}</span><span style={{ textAlign: 'right', color: k === 'out' ? 'var(--text-secondary)' : 'var(--text)' }}>{k === 'out' ? 'meno ' : ''}{i}</span></div>)}</Card>
      </div>
    </div>
  );
}
