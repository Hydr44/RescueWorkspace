import { Button } from '@carbon/react';
import { Add, ArrowRight } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Card, { KpiTile } from '../components/Card.jsx';

// Pagina di sintesi del modulo Rifiuti RENTRI. Corrisponde a src/pages/RifiutiDashboard.jsx.
// Le sintesi hanno tutte la stessa forma: titolo, quattro indicatori, cose da fare, elenco delle funzioni, ultimi movimenti.
const FUNZ = [['Registri', 'carico e scarico, 2 registri'], ['Movimenti', '412 quest\'anno'], ['Formulari', 'FIR, 38 emessi'], ['Certificati', '12 caricati'], ['Trasmissioni RENTRI', 'ultima ieri alle 18:00'], ['MUD', 'scadenza 30 aprile'], ['Riepilogo quantità', 'per codice e destinatario'], ['Controllo giacenza', 'per codice']];
const ATT = [['Trasmissione del 23 settembre respinta', '2 movimenti con quantità mancante', 'late'], ['Chiusura mensile del registro', 'entro il 30 settembre, tra 6 giorni', 'muted'], ['Giacenza 16 01 06 sopra il limite', '9.480 kg su 9.000 autorizzati', 'late']];
const MOV = [['Oggi 14:10', 'Carico', '16 01 04*', 'Veicolo fuori uso AB 123 CD', '1.090 kg'], ['Oggi 09:30', 'Scarico', '16 01 06', 'Conferimento a Ecoferro S.r.l., FIR 2026-00415', '4.200 kg'], ['Ieri 17:20', 'Carico', '16 06 01*', 'Batterie da 3 veicoli', '42 kg'], ['Ieri 11:00', 'Scarico', '13 02 05*', 'Ritiro oli, Ecol Oil', '210 kg']];
export default function RifiutiSintesi() {
  const nav = useNavigate();
  return (
    <div className="rm-page">
      <PageHeader title="Rifiuti RENTRI" sub="Registro di carico e scarico, sede di Gela, ambiente di produzione" actions={<><Button kind="tertiary" size="md" onClick={() => nav('/rifiuti/consulente')}>Consulente ambientale</Button><Button kind="tertiary" size="md" onClick={() => nav('/rifiuti/da-demolizione')}>Da demolizione</Button><Button size="md" renderIcon={Add} onClick={() => nav('/rifiuti/movimenti/guidato')}>Nuovo movimento</Button></>} />
      <div style={{ display: 'flex', gap: 1, margin: '8px 0 12px' }}>
        <KpiTile label="Giacenza netta" value="18.640 kg" context="12 codici a magazzino" /><KpiTile label="Movimenti di settembre" value="46" context="31 carichi, 15 scarichi" /><KpiTile label="In attesa di trasmissione" value="2" context="da inviare entro il 3 ottobre" /><KpiTile label="Respinti" value="1" context="trasmissione del 23 settembre" />
      </div>
      <div style={{ display: 'flex', gap: 1, marginBottom: 12 }}>
        <Card title="Richiede attenzione" extra="3" style={{ flex: 1 }}>{ATT.map(([a, b, k]) => <div key={a} className="rm-row"><div><b>{a}</b><div className="rm-muted">{b}</div></div><span className={'rm-status--' + k}>{k === 'late' ? 'da sistemare' : 'in scadenza'}</span></div>)}</Card>
        <Card title="Funzioni" extra="tutte" style={{ flex: 1.4 }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{FUNZ.map(([a, b]) => <div key={a} className="rm-row" style={{ cursor: 'pointer' }}><div><div>{a}</div><div className="rm-muted">{b}</div></div><ArrowRight size={16} style={{ fill: 'var(--text-secondary)' }} /></div>)}</div></Card>
      </div>
      <Card title="Ultimi movimenti" extra="oggi e ieri" style={{ marginBottom: 16 }}>
        {MOV.map(([t, tipo, c, d, q]) => <div key={t + c} style={{ display: 'grid', gridTemplateColumns: '100px 70px 100px 1fr 90px', gap: 12, padding: '7px 0', borderTop: '1px solid var(--border)', fontSize: 12.5 }}><span className="rm-muted">{t}</span><span>{tipo}</span><span className="rm-mono">{c}</span><span>{d}</span><span style={{ textAlign: 'right' }}>{q}</span></div>)}
      </Card>
    </div>
  );
}
