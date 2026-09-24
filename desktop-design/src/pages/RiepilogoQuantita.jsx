import { Button, Dropdown } from '@carbon/react';
import { Download } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';
import ListTable from '../components/ListTable.jsx';

// Riepilogo quantità: entrato, uscito e a chi hai conferito nel periodo. Corrisponde a src/pages/RifiutiRiepilogo.jsx.
const CODICI = [{ c: '16 01 04*', d: 'Veicoli fuori uso', e: '38.900', u: '0', m: 36 }, { c: '16 01 06', d: 'Veicoli fuori uso bonificati', e: '31.200', u: '30.100', m: 41 }, { c: '13 02 05*', d: 'Oli minerali per motori', e: '210', u: '210', m: 4 }, { c: '16 06 01*', d: 'Batterie al piombo', e: '480', u: '440', m: 6 }];
const DEST = [['Ecoferro S.r.l.', 'Catania, autorizzazione CT-2231', '30.100 kg', '14 formulari'], ['Ecol Oil', 'Gela, autorizzazione CL-118', '210 kg', '2 formulari'], ['Piombo Sud', 'Palermo, autorizzazione PA-905', '440 kg', '1 formulario']];
const COL = [{ key: 'c', label: 'Codice', width: 110, render: (r) => <span className="rm-mono">{r.c}</span> }, { key: 'd', label: 'Descrizione' }, { key: 'm', label: 'Movimenti', width: 100 }, { key: 'e', label: 'Entrato, kg', width: 110 }, { key: 'u', label: 'Uscito, kg', width: 110 }];
export default function RiepilogoQuantita() {
  return (
    <div className="rm-page">
      <PageHeader title="Riepilogo quantità" sub="Settembre 2026, registro di Gela" actions={<><Dropdown id="p" size="md" label="Settembre 2026" items={['Settembre 2026', 'Agosto 2026', 'Anno 2026']} style={{ width: 170 }} /><Button kind="tertiary" size="md" renderIcon={Download}>Esporta</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>
        <KpiTile label="Entrato" value="70.790 kg" context="31 carichi" /><KpiTile label="Uscito" value="30.750 kg" context="15 scarichi, 17 formulari" /><KpiTile label="Differenza" value="40.040 kg" context="resta in giacenza" /><KpiTile label="Destinatari" value="3" context="tutti autorizzati" />
      </div>
      <div style={{ marginBottom: 12 }}><ListTable columns={COL} rows={CODICI} rowKey="c" selectable={false} footer="4 codici movimentati nel periodo" /></div>
      <Card title="A chi hai conferito" extra="settembre" style={{ marginBottom: 16 }}>{DEST.map(([a, b, c, d]) => <div key={a} className="rm-row"><div><b>{a}</b><div className="rm-muted">{b}</div></div><div style={{ textAlign: 'right' }}><div>{c}</div><div className="rm-muted">{d}</div></div></div>)}</Card>
    </div>
  );
}
