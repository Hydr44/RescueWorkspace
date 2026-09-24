import { useState } from 'react';
import { IconButton, ContentSwitcher, Switch } from '@carbon/react';
import { Close, TrashCan, Help } from '@carbon/icons-react';
import mark from '../logos/solo-logo-bianco.svg';
import { UserMsg, AsstMsg, ToolRows, Proposal, ChatInput, Sources } from './Chat.jsx';

// RescueAI: pannello agganciato a destra del contenuto (non più una finestra galleggiante), largo 400 px.
// Due assistenti nello stesso pannello: Assistente (dati dell'app, azioni) e Consulente ambientale (normativa, web).
// Corrisponde a src/components/AiAssistantPanel.jsx.
export default function AiPanel({ onClose, persona: p0 = 'general' }) {
  const [persona, setPersona] = useState(p0);
  const [streaming, setStreaming] = useState(false);
  const [prop, setProp] = useState('pending');
  return (
    <aside className="ai-panel" aria-label="RescueAI">
      <div className="ai-head">
        <span className="ai-head__mark"><img src={mark} alt="" /></span>
        <div className="ai-head__t"><b>RescueAI</b><span>{persona === 'general' ? 'Legge i dati di Autosoccorso Bianchi. Sonnet' : 'Normativa rifiuti, cerca sul web. Sonnet'}</span></div>
        <IconButton kind="ghost" size="sm" label="Contatta il supporto"><Help /></IconButton>
        <IconButton kind="ghost" size="sm" label="Cancella conversazione"><TrashCan /></IconButton>
        <IconButton kind="ghost" size="sm" label="Chiudi" onClick={onClose}><Close /></IconButton>
      </div>
      <div className="ai-switch"><ContentSwitcher selectedIndex={persona === 'general' ? 0 : 1} size="sm" onChange={(e) => setPersona(e.index === 0 ? 'general' : 'ambientale')}><Switch name="g" text="Assistente" /><Switch name="a" text="Consulente ambientale" /></ContentSwitcher></div>
      <div className="ai-msgs">
        {persona === 'general' ? (<>
          <AsstMsg><p>Posso leggere clienti, trasporti, fatture, custodia e demolizioni, rispondere sull'app e preparare azioni che confermi tu. Cosa ti serve?</p></AsstMsg>
          <UserMsg>Quanto devo ancora incassare da Europ Assistance e prepara il sollecito</UserMsg>
          <AsstMsg time="14:42">
            <ToolRows rows={[['Consultando fatture', 'ok', '3 fatture aperte'], ['Consultando clienti', 'ok', 'Europ Assistance'], ['Preparando richiesta al supporto', 'ok', '']]} />
            <p>Europ Assistance ha tre fatture aperte per <b>3.620,00 euro</b>. Una è scaduta: la 2026/0104 di 1.240,00 euro, da 12 giorni. Le altre due scadono il 30 settembre e il 22 ottobre.</p>
            <p>Il contatto in anagrafica è amministrazione@europassistance.it. Ti preparo il sollecito per la fattura scaduta.</p>
            <Proposal title="Invia sollecito per la fattura 2026/0104" state={prop} confirm="Invia sollecito" result="Sollecito inviato alle 14:43 ad amministrazione@europassistance.it" onConfirm={() => setProp('done')} onReject={() => setProp('rejected')}
              kv={[['Destinatario', 'amministrazione@europassistance.it'], ['Oggetto', 'Fattura 2026/0104 scaduta il 12 settembre'], ['Allegato', 'Fattura 2026/0104, PDF'], ['Tono', 'Cortese, primo sollecito']]} />
          </AsstMsg>
          <UserMsg>Crea anche un promemoria per venerdì</UserMsg>
          <AsstMsg>
            <ToolRows rows={[['Preparando appuntamento', 'run', '']]} />
            <p>Sto preparando il promemoria per venerdì 26 settembre alle 9:00, "Verifica incasso Europ Assistance".</p>
          </AsstMsg>
        </>) : (<>
          <AsstMsg><p>Rispondo sui tuoi rifiuti con la normativa aggiornata e i dati della tua azienda: codici che puoi trattare, come registrare una bonifica, scadenze RENTRI, giacenze.</p></AsstMsg>
          <UserMsg>Posso trattare il codice 16 01 04?</UserMsg>
          <AsstMsg time="14:45">
            <ToolRows rows={[['Leggendo profilo ambientale', 'ok', '12 codici autorizzati'], ['Cercando la normativa', 'ok', '3 fonti']]} />
            <p><b>Sì.</b> Il 16 01 04* (veicoli fuori uso) è nella tua autorizzazione CL-2019-118 per le operazioni R12 e R13, fino a 5.000 kg di stoccaggio istantaneo. Oggi sei a 0 kg.</p>
            <p>Attenzione a due cose: è un rifiuto pericoloso, quindi nel registro va indicata la classe HP14; e resta pericoloso fino alla bonifica, dopo la quale diventa 16 01 06.</p>
            <Sources items={[['D.Lgs. 209/2003, articolo 5', 'Gazzetta Ufficiale, testo vigente'], ['Decisione 2014/955/UE, elenco europeo dei rifiuti', 'EUR-Lex'], ['Autorizzazione CL-2019-118, allegato tecnico', 'documento della tua azienda']]} />
          </AsstMsg>
        </>)}
      </div>
      <ChatInput placeholder={persona === 'general' ? 'Chiedi o fai fare qualcosa a RescueAI' : 'Chiedi al consulente ambientale'} streaming={streaming} onSend={() => setStreaming(true)} onStop={() => setStreaming(false)} foot="Verifica sempre le informazioni importanti" />
    </aside>
  );
}
