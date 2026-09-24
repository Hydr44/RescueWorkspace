import { Button, Dropdown } from '@carbon/react';
import { Download } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';

// Report: andamento per periodo, per cliente e per autista. Corrisponde a src/pages/Reports.jsx.
const MESI = [['apr', 52], ['mag', 61], ['giu', 58], ['lug', 70], ['ago', 44], ['set', 66]];
const CLI = [['Europ Assistance', '31', '7.440 euro'], ['Autofficina Vella', '14', '2.180 euro'], ['Carrozzeria Di Dio', '9', '1.320 euro'], ['Privati', '12', '1.640 euro']];
const AUT = [['Giuseppe Russo', '28 interventi', '6 min medi'], ['Salvatore Greco', '22 interventi', '8 min medi'], ['Marco Ferro', '16 interventi', '7 min medi']];
export default function Report() {
  const mx = Math.max(...MESI.map((m) => m[1]));
  return (
    <div className="rm-page">
      <PageHeader title="Report" sub="Ultimi 6 mesi, tutte le sedi" actions={<><Dropdown id="p" size="md" label="Ultimi 6 mesi" items={['Ultimi 6 mesi', 'Anno 2026']} style={{ width: 160 }} /><Button kind="tertiary" size="md" renderIcon={Download}>Esporta</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>
        <KpiTile label="Trasporti" value="351" context="58 al mese" /><KpiTile label="Fatturato" value="42.180 euro" context="IVA esclusa" /><KpiTile label="Presa in carico media" value="7 min" context="obiettivo 8 min" /><KpiTile label="Chilometri" value="9.120 km" context="26 per intervento" />
      </div>
      <Card title="Trasporti per mese" extra="media 59" style={{ marginBottom: 12 }}>
        <div className="rm-bars" style={{ height: 110 }}>{MESI.map(([m, v], i) => <i key={m} className={i === MESI.length - 1 ? 'on' : ''} style={{ height: (v / mx) * 100 + '%' }} />)}</div>
        <div className="rm-bars__lab">{MESI.map(([m, v]) => <span key={m}>{m}, {v}</span>)}</div>
      </Card>
      <div style={{ display: 'flex', gap: 1, paddingBottom: 16 }}>
        <Card title="Per cliente" extra="trasporti e fatturato" style={{ flex: 1 }}>{CLI.map(([a, b, c]) => <div key={a} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 100px', gap: 12, padding: '7px 0', borderTop: '1px solid var(--border)', fontSize: 12.5 }}><span>{a}</span><span className="rm-muted" style={{ textAlign: 'right' }}>{b}</span><span style={{ textAlign: 'right' }}>{c}</span></div>)}</Card>
        <Card title="Per autista" extra="settembre" style={{ flex: 1 }}>{AUT.map(([a, b, c]) => <div key={a} className="rm-row"><div><b>{a}</b><div className="rm-muted">{b}</div></div><span className="rm-muted">{c}</span></div>)}</Card>
      </div>
    </div>
  );
}
