import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@carbon/react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import { Confirm, Picker } from '../components/Modals.jsx';
import ListinoEditor from '../components/ListinoEditor.jsx';
import { CLIENTI } from '../data/demo.js';

// Pagina di prova per vedere le tre finestre. Nell'app non esiste. Rotte: #/demo/modali?m=confirm | picker | sheet
export default function DemoModali() {
  const { search } = useLocation();
  const q = new URLSearchParams(search).get('m');
  const [m, setM] = useState(q || null);
  useEffect(() => { setM(q || null); }, [q]);
  return (
    <div className="rm-page">
      <PageHeader title="Finestre" sub="Le tre finestre del sistema: conferma, scelta, scheda laterale" />
      <div style={{ display: 'flex', gap: 1, marginTop: 8 }}>
        <Card title="Conferma" extra="eliminare, inviare, annullare" style={{ flex: 1 }}><div className="rm-muted" style={{ marginBottom: 10 }}>Una domanda nel titolo, una riga di conseguenze, i dati di cosa si tocca, due pulsanti. Il pulsante che non si annulla è rosso a bordo.</div><Button kind="tertiary" size="md" onClick={() => setM('confirm')}>Apri</Button></Card>
        <Card title="Scelta" extra="cerca cliente, scegli articolo" style={{ flex: 1 }}><div className="rm-muted" style={{ marginBottom: 10 }}>Campo di ricerca in testa, elenco a due righe sotto, si sceglie con un clic. "Nuovo" in fondo se si può creare da qui.</div><Button kind="tertiary" size="md" onClick={() => setM('picker')}>Apri</Button></Card>
        <Card title="Scheda laterale" extra="preset, indirizzo, zona, voce di listino" style={{ flex: 1 }}><div className="rm-muted" style={{ marginBottom: 10 }}>Si apre da destra, dentro c'è il datasheet. Sostituisce le modali con i campi impilati. Qui: la voce del listino soccorso, una scheda sola per privati, convenzioni e preset.</div><Button kind="tertiary" size="md" onClick={() => setM('sheet')}>Apri</Button></Card>
      </div>
      <Confirm open={m === 'confirm'} title="Eliminare il trasporto TR0003?" text="Il trasporto sparisce dalla lista e dal calendario. L'autista viene avvisato. Non si può annullare." kv={[['Cliente', 'Europ Assistance'], ['Targa', 'EV 901 LP'], ['Stato', 'In ritardo di 12 minuti']]} confirm="Elimina il trasporto" danger onConfirm={() => setM(null)} onClose={() => setM(null)} />
      <Picker open={m === 'picker'} title="Cerca cliente" sub="Per il nuovo trasporto" placeholder="Nome, telefono, partita IVA o targa" selected="VELLA" rows={CLIENTI.map((c) => ({ id: c.codice, a: c.nome, b: c.tipo + ', ' + c.citta, right: c.tel }))} onPick={() => setM(null)} onClose={() => setM(null)} onNew={() => setM(null)} />
      <ListinoEditor open={m === 'sheet'} voce={{}} onClose={() => setM(null)} />
    </div>
  );
}
