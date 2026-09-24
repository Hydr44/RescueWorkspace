import { useState } from 'react';
import { Button, IconButton, Link } from '@carbon/react';
import { ArrowLeft, TrashCan } from '@carbon/icons-react';
import Card from '../components/Card.jsx';
import { UserMsg, AsstMsg, ToolRows, ChatInput, Sources, DataUsed, Suggestions } from '../components/Chat.jsx';
import { useNavigate } from 'react-router-dom';

// Consulente ambientale a pagina intera (dentro Rifiuti RENTRI): a sinistra cosa sa dell'azienda, al centro la conversazione.
// Corrisponde a src/pages/ConsulenteAmbientale.jsx. Non trasmette nulla a RENTRI.
const SUGG = ['Posso trattare il codice 16 01 04?', 'Come registro la bonifica di un veicolo?', 'Perché ho una giacenza negativa sul 16 01 06?', 'Quali operazioni R e D sono autorizzato a fare?', 'Cosa devo trasmettere a RENTRI entro fine mese?'];
export default function ConsulenteAmbientale() {
  const nav = useNavigate();
  const [msgs, setMsgs] = useState(1);
  const [streaming, setStreaming] = useState(false);
  return (
    <div className="cons">
      <div className="cons__side">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IconButton kind="ghost" size="sm" label="Torna a Rifiuti" onClick={() => nav('/rifiuti')}><ArrowLeft /></IconButton><div><div style={{ fontSize: 16, fontWeight: 600 }}>Consulente ambientale</div><div className="rm-muted">Normativa aggiornata e dati della tua azienda</div></div></div>
        <Card title="Cosa sa di te" extra={<Link href="#/rifiuti/profilo-ambientale" style={{ fontSize: 12 }}>Profilo</Link>}>
          {[['Autorizzazione', 'CL-2019-118, valida fino al 2029'], ['Codici autorizzati', '12, di cui 5 pericolosi'], ['Operazioni', 'R12, R13, D15'], ['Registri', '2, sede di Gela'], ['Giacenza netta', '18.640 kg'], ['Ultima trasmissione', 'ieri alle 18:00']].map(([k, v]) => <div key={k} className="rm-row" style={{ borderTop: '1px solid var(--border)', padding: '7px 0' }}><span className="rm-muted" style={{ fontSize: 12.5 }}>{k}</span><span style={{ textAlign: 'right' }}>{v}</span></div>)}
        </Card>
        <Card title="Come lavora">
          <div className="rm-muted" style={{ lineHeight: 1.5 }}>Legge il profilo ambientale, i registri e le giacenze. Cerca la normativa sul web e cita le fonti. Non scrive nei registri e non trasmette nulla a RENTRI: ti dice cosa fare, lo fai tu.</div>
        </Card>
        <Card title="Conversazioni" extra="3">
          {[['Oggi', 'Codice 16 01 04 e bonifica'], ['22 settembre', 'Giacenza negativa 16 01 06'], ['15 settembre', 'Scadenze RENTRI di settembre']].map(([d, t]) => <div key={t} className="rm-row" style={{ borderTop: '1px solid var(--border)', padding: '7px 0', cursor: 'pointer' }}><span>{t}</span><span className="rm-muted">{d}</span></div>)}
        </Card>
      </div>
      <div className="cons__main">
        <div className="ai-msgs">
          {msgs === 0 ? (
            <div className="ai-empty">
              <AsstMsg><p>Chiedimi dei tuoi rifiuti: codici che puoi trattare, come registrare una bonifica, perché la giacenza non torna, cosa scade su RENTRI.</p></AsstMsg>
              <Suggestions items={SUGG} onPick={() => setMsgs(1)} />
            </div>
          ) : (<>
            <UserMsg>Come registro la bonifica di un veicolo? Ho appena finito la Punto AB 123 CD</UserMsg>
            <AsstMsg time="15:12">
              <ToolRows rows={[['Leggendo profilo ambientale', 'ok', 'autorizzazione CL-2019-118'], ['Leggendo la pratica RVFU 2026-0087', 'ok', 'AB 123 CD, bonifica del 23 settembre'], ['Cercando la normativa', 'ok', '2 fonti']]} />
              <p>La bonifica è un trattamento (R12) che trasforma il veicolo da <b>16 01 04*</b> a <b>16 01 06</b> e produce i rifiuti pericolosi estratti. Nel registro di carico e scarico servono tre passaggi:</p>
              <ul>
                <li><b>Scarico</b> di 16 01 04* per 1.090 kg, causale "trattamento R12", riferito alla pratica RVFU 2026-0087.</li>
                <li><b>Carico</b> di 16 01 06 per il peso a bonifica fatta, circa 780 kg per una Punto.</li>
                <li><b>Carico</b> di ogni rifiuto estratto: 13 02 05* olio, 16 06 01* batteria, 16 01 03 pneumatici, 16 01 07* filtri, 16 01 14* antigelo.</li>
              </ul>
              <DataUsed rows={[['Veicolo', 'AB 123 CD, massa a vuoto 1.090 kg'], ['Bonifica', '23 settembre, completa, VFUBonificaForm'], ['Giacenza 16 01 06', '9.480 kg su 9.000 autorizzati']]} />
              <p>Un avviso: con il carico di 16 01 06 vai a 10.260 kg, sopra il limite dell'autorizzazione. Prima conviene registrare lo scarico verso Ecoferro con il formulario di ieri.</p>
              <p>Nell'app puoi fare tutto in un colpo da <Link href="#/rifiuti/da-demolizione">Rifiuti da demolizione</Link>: sceglie il veicolo e propone i rifiuti con i pesi.</p>
              <Sources items={[['D.Lgs. 209/2003, allegato I, punto 5, operazioni di bonifica', 'Gazzetta Ufficiale, testo vigente'], ['D.Lgs. 152/2006, articolo 190, registro di carico e scarico', 'Normattiva']]} />
            </AsstMsg>
            <UserMsg>E se la giacenza va sopra il limite per un giorno?</UserMsg>
            <AsstMsg><ToolRows rows={[['Cercando la normativa', 'run', '']]} /><p>Sto cercando cosa prevede l'autorizzazione per gli sforamenti temporanei.</p></AsstMsg>
          </>)}
        </div>
        <div className="cons__inputwrap"><ChatInput placeholder="Chiedi al consulente ambientale" streaming={streaming} onSend={() => { setMsgs(1); setStreaming(true); }} onStop={() => setStreaming(false)} foot="Non trasmette nulla a RENTRI. Verifica sempre le informazioni importanti." /></div>
      </div>
    </div>
  );
}
