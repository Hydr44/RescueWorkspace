import { Button, IconButton, ContentSwitcher, Switch } from '@carbon/react';
import { Add, ChevronLeft, ChevronRight } from '@carbon/icons-react';
import PageHeader from '../components/PageHeader.jsx';

// Calendario: agenda settimanale con soccorsi e trasporti programmati, appuntamenti, scadenze e promemoria.
// Corrisponde a src/pages/CalendarPage.jsx. I tipi si distinguono con il testo e una barretta, non con colori diversi.
const GIORNI = ['Lun 22', 'Mar 23', 'Mer 24', 'Gio 25', 'Ven 26', 'Sab 27', 'Dom 28'];
const ORE = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
// [giorno 0-6, ora inizio, durata h, titolo, riga 2, tipo]
const EV = [
  [0, 9, 1, 'Trasporto FR 220 KA', 'Gela, Niscemi', 'trasporto'], [0, 15, 1.5, 'Appuntamento Europ Assistance', 'rinnovo convenzione', 'app'],
  [1, 8, 1, 'Soccorso DA 331 HG', 'Via Venezia 21', 'trasporto'], [1, 17, 1, 'Soccorso CT 118 MM', 'SS 117bis km 4', 'trasporto'],
  [2, 9, 1, 'Trasporto FR 220 KA', 'Via Roma 12, Gela', 'trasporto'], [2, 14.5, 1, 'Soccorso GA 512 PM', 'Via dello Smeraldo 18', 'trasporto'], [2, 11, 1, 'Ritiro VFU AB 123 CD', 'Scozzarini Service Car', 'app'],
  [3, 10, 2, 'Demolizione lotto 14', 'piazzale, settore B', 'app'], [3, 16, 1, 'Promemoria: chiusura RENTRI', 'registro carico e scarico', 'prom'],
  [4, 8, 1, 'Revisione FN 245 KL', 'scadenza', 'scad'], [4, 12, 1, 'Trasporto EV 901 LP', 'A19 km 62', 'trasporto'],
  [5, 9, 3, 'Turno sabato: Marco Ferro', 'reperibilità', 'app'],
];
const TIPI = { trasporto: 'Soccorsi e trasporti', app: 'Appuntamenti', scad: 'Scadenze', prom: 'Promemoria' };
export default function Calendario() {
  const H = 44;
  return (
    <div className="rm-page" style={{ paddingBottom: 0 }}>
      <PageHeader title="Calendario" date={<><b>Settimana</b>, dal 22 al 28 settembre</>} actions={<><Button kind="tertiary" size="md">Oggi</Button><Button size="md" renderIcon={Add}>Nuovo appuntamento</Button></>} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '4px 0 10px' }}>
        <div style={{ width: 300 }}><ContentSwitcher selectedIndex={1} size="sm" onChange={() => {}}><Switch name="g" text="Giorno" /><Switch name="s" text="Settimana" /><Switch name="m" text="Mese" /></ContentSwitcher></div>
        <div className="rm-muted" style={{ display: 'flex', gap: 16 }}>{Object.values(TIPI).map((t) => <span key={t}>{t}</span>)}</div>
        <span className="rm-muted" style={{ marginLeft: 'auto' }}>12 eventi, 7 soccorsi e trasporti</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', background: 'var(--layer)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', position: 'sticky', top: 0, background: 'var(--layer)', borderBottom: '1px solid var(--border)', zIndex: 2 }}>
          <div />{GIORNI.map((g, i) => <div key={g} style={{ padding: '8px 10px', fontSize: 12.5, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? 'var(--text)' : 'var(--text-secondary)', borderLeft: '1px solid var(--border)', boxShadow: i === 2 ? 'inset 0 -3px 0 var(--brand)' : 'none' }}>{g}{i === 2 && <span className="rm-muted" style={{ marginLeft: 6 }}>oggi</span>}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', position: 'relative' }}>
          <div>{ORE.map((o) => <div key={o} style={{ height: H, fontSize: 11, color: 'var(--text-secondary)', padding: '2px 8px', borderTop: '1px solid var(--border)' }}>{o}:00</div>)}</div>
          {GIORNI.map((g, d) => (
            <div key={g} style={{ position: 'relative', borderLeft: '1px solid var(--border)', background: d === 2 ? 'var(--selected)' : 'transparent' }}>
              {ORE.map((o) => <div key={o} style={{ height: H, borderTop: '1px solid var(--border)' }} />)}
              {EV.filter((e) => e[0] === d).map(([, h, du, t, s, tipo]) => (
                <div key={t + h} style={{ position: 'absolute', left: 4, right: 4, top: (h - 7) * H + 2, height: du * H - 4, background: 'var(--layer-2)', borderLeft: '3px solid ' + (tipo === 'trasporto' ? 'var(--brand)' : tipo === 'scad' ? 'var(--danger)' : 'var(--border-strong)'), padding: '4px 8px', overflow: 'hidden', fontSize: 12 }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
                  <div className="rm-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
