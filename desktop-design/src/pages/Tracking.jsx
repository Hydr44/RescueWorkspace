import { useState } from 'react';
import { Button, IconButton } from '@carbon/react';
import { Phone, OverflowMenuHorizontal, Renew } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';
import FakeMap from '../components/FakeMap.jsx';
import DetailPanel from '../components/DetailPanel.jsx';

// Tracking GPS: elenco dei carri a sinistra, mappa al centro, dettaglio a destra. Corrisponde a src/pages/TransportTracking.jsx.
const MEZZI = [
  { id: 1, targa: 'FN 245 KL', autista: 'Giuseppe Russo', stato: 'In viaggio verso il deposito', eta: '16 min', tono: 'run', agg: '14:41', x: 420, y: 280 },
  { id: 2, targa: 'EX 812 CN', autista: 'Salvatore Greco', stato: 'In ritardo di 12 minuti', eta: '28 min', tono: 'late', agg: '14:40', x: 560, y: 150 },
  { id: 3, targa: 'DA 331 HG', autista: 'Marco Ferro', stato: 'Fermo al deposito', eta: '', tono: 'muted', agg: '14:35', x: 300, y: 420 },
  { id: 4, targa: 'GB 771 TK', autista: 'Nessuno', stato: 'In officina', eta: '', tono: 'muted', agg: 'ieri', x: 120, y: 200 },
];
export default function Tracking() {
  const [sel, setSel] = useState(1);
  const m = MEZZI.find((x) => x.id === sel);
  return (
    <div className="rm-split">
      <div style={{ width: 300, flex: '0 0 300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '16px 16px 8px' }}><PageHeader title="Tracking GPS" count={4} /><div className="rm-muted">3 carri collegati, aggiornato alle 14:41</div></div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {MEZZI.map((x) => (
            <div key={x.id} onClick={() => setSel(x.id)} style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', cursor: 'pointer', background: x.id === sel ? 'var(--selected)' : 'transparent', boxShadow: x.id === sel ? 'inset 3px 0 0 var(--brand)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{x.targa}</b><span className={'rm-status--' + x.tono} style={{ fontSize: 12.5 }}>{x.eta || x.agg}</span></div>
              <div style={{ fontSize: 12.5 }}>{x.autista}</div>
              <div className="rm-muted">{x.stato}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 8, borderBottom: '1px solid var(--border)', background: 'var(--layer)' }}>
          <span style={{ fontSize: 13 }}>Posizione in diretta</span><span className="rm-muted">ogni 30 secondi</span>
          <div style={{ marginLeft: 'auto', display: 'flex' }}><Button kind="tertiary" size="sm" renderIcon={Renew}>Aggiorna</Button><Button kind="tertiary" size="sm">Percorso di oggi</Button></div>
        </div>
        <FakeMap route={sel === 1} markers={MEZZI.map((x) => ({ x: x.x, y: x.y, t: x.targa, late: x.tono === 'late', dim: x.tono === 'muted' }))} label="Mappa: nell'app qui c'è LiveDriverMap" />
      </div>
      <DetailPanel code={m.targa} name={m.autista} lines={[m.stato, 'Pratica TR0000']}
        metrics={m.eta ? [['Arrivo previsto', m.eta, 'mancano 9,8 km'], ['Velocità', '54 km/h', 'SS 117bis']] : [['Fermo da', '2 h', 'deposito'], ['Oggi', '3', 'interventi']]}
        pairs={[['Ultimo segnale', m.agg], ['Dispositivo', 'Teltonika FMB920'], ['Batteria', '12,6 V'], ['Chilometri oggi', '84 km']]}
        activity={[['14:20', 'Partito dal deposito'], ['13:58', 'Assegnato a ' + m.autista], ['13:52', 'Chiamata ricevuta']]}
        actions={<><Button kind="secondary" size="md" renderIcon={Phone}>Chiama</Button><Button kind="secondary" size="md">WhatsApp</Button><Button size="md">Pratica</Button></>} />
    </div>
  );
}
