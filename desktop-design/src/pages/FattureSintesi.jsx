import { Button } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';

// Sintesi fatturazione: incassi, scadute, stato SDI, ultime fatture. Corrisponde a src/pages/InvoiceDashboard.jsx.
const SCAD = [['Europ Assistance', 'fattura 2026/0104, 1.240,00 euro', 'scaduta da 12 giorni', 'late'], ['Carrozzeria Di Dio', 'fattura 2026/0131, 366,00 euro', 'scade domani', 'muted'], ['Mario Rossi', 'fattura 2026/0128, 98,00 euro', 'scade tra 6 giorni', 'muted']];
const SDI = [['Consegnate', '38'], ['In attesa di ricevuta', '2'], ['Scartate', '1'], ['Mancata consegna', '0']];
const ULT = [['2026/0142', 'Autofficina Vella S.r.l.', '23 settembre', '181,78 euro', 'Consegnata', 'muted'], ['2026/0141', 'Europ Assistance', '22 settembre', '2.380,00 euro', 'In attesa', 'muted'], ['2026/0140', 'Mario Bianchi', '22 settembre', '103,16 euro', 'Scartata, codice fiscale errato', 'late'], ['2026/0139', 'Carrozzeria Di Dio', '20 settembre', '366,00 euro', 'Consegnata', 'muted']];
export default function FattureSintesi() {
  const nav = useNavigate();
  return (
    <div className="rm-page">
      <PageHeader title="Fatture" sub="Settembre 2026, sezionale unico" actions={<><Button kind="tertiary" size="md">Scadenzario</Button><Button size="md" renderIcon={Add} onClick={() => nav('/fatture/nuova')}>Nuova fattura</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>
        <KpiTile label="Fatturato del mese" value="14.620 euro" context="41 fatture, IVA esclusa" /><KpiTile label="Incassato" value="9.180 euro" context="63 per cento del fatturato" /><KpiTile label="Da incassare" value="5.440 euro" context="11 fatture aperte" /><KpiTile label="Scadute" value="1.240 euro" context="1 fattura, Europ Assistance" />
      </div>
      <div style={{ display: 'flex', gap: 1, marginBottom: 12 }}>
        <Card title="Scadenze" extra="prossimi 7 giorni" style={{ flex: 1.3 }}>{SCAD.map(([a, b, c, k]) => <div key={a} className="rm-row"><div><b>{a}</b><div className="rm-muted">{b}</div></div><span className={'rm-status--' + k}>{c}</span></div>)}</Card>
        <Card title="Sistema di interscambio" extra="settembre" style={{ flex: 1 }}>{SDI.map(([a, b]) => <div key={a} className="rm-row"><span>{a}</span><span className={a === 'Scartate' && b !== '0' ? 'rm-status--late' : ''}>{b}</span></div>)}</Card>
      </div>
      <Card title="Ultime fatture" extra="questa settimana" style={{ marginBottom: 16 }}>
        {ULT.map(([n, c, d, t, s, k]) => <div key={n} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 110px 1fr', gap: 12, padding: '7px 0', borderTop: '1px solid var(--border)', fontSize: 12.5 }}><b>{n}</b><span>{c}</span><span className="rm-muted">{d}</span><span style={{ textAlign: 'right' }}>{t}</span><span className={'rm-status--' + k}>{s}</span></div>)}
      </Card>
    </div>
  );
}
