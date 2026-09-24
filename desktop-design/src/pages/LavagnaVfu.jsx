import { Button, Dropdown } from '@carbon/react';
import { Add, List } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';

// Lavagna VFU: una colonna per fase, una scheda per veicolo. Corrisponde a src/pages/VFUKanbanBoard.jsx.
const COLONNE = [
  ['Inserito', [['CD 456 EF', 'Renault Clio', 'Rosa Vella', '1 giorno'], ['FG 789 HI', 'Opel Corsa', 'Carrozzeria Di Dio', 'oggi']]],
  ['Preso in carico', [['JK 012 LM', 'Ford Fiesta', 'Mario Rossi', '2 giorni']]],
  ['Validato', [['NO 345 PQ', 'Fiat 500', 'Europ Assistance', '3 giorni'], ['RS 678 TU', 'Peugeot 206', 'Francesco Amato', '3 giorni']]],
  ['Conferito', [['VW 901 XY', 'Lancia Ypsilon', 'Autofficina Vella', '5 giorni']]],
  ['Demolito', [['AB 123 CD', 'Fiat Punto', 'Rosa Vella', '4 giorni, manca il certificato', true]]],
  ['Inviato a STA', [['ZA 234 BC', 'Toyota Yaris', 'Mario Bianchi', 'in attesa da 9 giorni', true]]],
  ['Radiato', [['DE 567 FG', 'Fiat Panda', 'Carrozzeria Di Dio', 'chiusa il 19 settembre'], ['HI 890 JK', 'Smart Fortwo', 'privato', 'chiusa il 18 settembre']]],
];
export default function LavagnaVfu() {
  const nav = useNavigate();
  return (
    <div className="rm-page" style={{ paddingBottom: 0 }}>
      <PageHeader title="Demolizioni RVFU" count={11} sub="Lavagna per fase, 2 pratiche ferme da più di una settimana" actions={<><Button kind="tertiary" size="md" renderIcon={List}>Elenco</Button><Button size="md" renderIcon={Add} onClick={() => nav('/demolizioni-rvfu/nuova')}>Nuova pratica</Button></>} />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 1, paddingTop: 8, paddingBottom: 16, alignItems: 'flex-start' }}>
        {COLONNE.map(([nome, schede]) => (
          <div key={nome} style={{ flex: '1 1 140px', minWidth: 140, background: 'var(--layer)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 200 }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}><b>{nome}</b><span className="rm-muted">{schede.length}</span></div>
            {schede.map(([t, m, c, d, warn]) => (
              <div key={t} onClick={() => nav('/demolizioni-rvfu/dettaglio/1')} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderLeft: warn ? '3px solid var(--danger)' : '3px solid transparent' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t}</div>
                <div style={{ fontSize: 12.5 }}>{m}</div>
                <div className="rm-muted">{c}</div>
                <div className={warn ? 'rm-status--late' : 'rm-muted'} style={{ fontSize: 12, marginTop: 4 }}>{d}</div>
              </div>
            ))}
            <div style={{ padding: 8 }}><Button kind="tertiary" size="sm" renderIcon={Add}>Aggiungi</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
