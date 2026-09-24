import { Button, SelectItem, ContentSwitcher, Switch, Checkbox } from '@carbon/react';
import { Save, TrashCan } from '@carbon/icons-react';
import { Sheet } from './Modals.jsx';
import { DtSection, DtRow, DtOk, DtInput, DtSelect, DtSuffix } from './Datasheet.jsx';

// Una sola scheda per le voci del listino soccorso, al posto di tre cose diverse (tariffario base, preset, tariffario privati):
// una voce dice cosa e' (nome, tipo, motivo), a chi si applica (tutti, privati, una convenzione), come si calcola
// (fisso, a chilometro, a ora, a giorno, da concordare), i prezzi per classe di veicolo, i supplementi, le note.
// Il tariffario base resta a parte in Impostazioni: e' quello che vale quando nessuna voce corrisponde.
export default function ListinoEditor({ open, voce, onClose }) {
  const nuovo = !voce;
  return (
    <Sheet open={open} title={nuovo ? 'Nuova voce del listino' : 'Panne in città'} sub={nuovo ? 'Listino soccorso' : 'Listino soccorso, usata 38 volte quest\'anno'} onClose={onClose}
      actions={<>{!nuovo && <Button kind="danger--tertiary" size="md" renderIcon={TrashCan}>Togli</Button>}<Button kind="secondary" size="md" onClick={onClose}>Annulla</Button><Button size="md" renderIcon={Save}>Salva</Button></>}>
      <DtSection title="Cos'è">
        <DtRow label="Nome" req wide><DtInput id="n" defaultValue="Panne in città" placeholder="Es. Traino in città" /></DtRow>
        <DtRow label="Tipo intervento" wide><div style={{ width: 380 }}><ContentSwitcher selectedIndex={0} size="md" onChange={() => {}}><Switch name="s" text="Soccorso" /><Switch name="t" text="Trasporto" /><Switch name="m" text="Mezzo speciale" /></ContentSwitcher></div></DtRow>
        <DtRow label="Motivo" wide><DtSelect id="mo" defaultValue="p" style={{ maxWidth: 300 }}><SelectItem value="p" text="Panne meccanica" /><SelectItem value="i" text="Incidente" /><SelectItem value="g" text="Gomma" /><SelectItem value="n" text="Non indicato" /></DtSelect><DtSuffix>facoltativo, serve per proporre la voce</DtSuffix></DtRow>
      </DtSection>
      <DtSection title="A chi si applica">
        <DtRow label="Clienti" wide><div style={{ width: 380 }}><ContentSwitcher selectedIndex={1} size="md" onChange={() => {}}><Switch name="t" text="Tutti" /><Switch name="p" text="Privati" /><Switch name="c" text="Convenzione" /></ContentSwitcher></div></DtRow>
        <DtRow label="Convenzione" wide><DtSelect id="cv" defaultValue="" disabled><SelectItem value="" text="Nessuna" /><SelectItem value="e" text="Europ Assistance" /><SelectItem value="a" text="ACI Global" /></DtSelect><DtSuffix>solo se scegli Convenzione</DtSuffix></DtRow>
        <DtOk>Nel nuovo trasporto la voce viene proposta quando il cliente è un privato e il motivo è panne meccanica.</DtOk>
      </DtSection>
      <DtSection title="Come si calcola">
        <DtRow label="Modo" wide><div style={{ width: '100%' }}><ContentSwitcher selectedIndex={1} size="md" onChange={() => {}}><Switch name="f" text="Fisso" /><Switch name="k" text="A chilometro" /><Switch name="o" text="A ora" /><Switch name="g" text="A giorno" /><Switch name="c" text="Da concordare" /></ContentSwitcher></div></DtRow>
        <DtRow label="Per classe" wide>
          <div className="rm-classi" style={{ flex: 1 }}>
            {[['Classe 1', 'fino a 3,5 t', '45,00', '2,20'], ['Classe 2', 'da 3,5 a 7,5 t', '80,00', '2,80'], ['Classe 3', 'oltre 7,5 t', '180,00', '3,50']].map(([c, d, b, k]) => <div key={c}><b>{c}</b><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><DtInput id={'b' + c} defaultValue={b} size="sm" style={{ width: 80 }} /><span className="rm-muted">euro</span></div><div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}><DtInput id={'k' + c} defaultValue={k} size="sm" style={{ width: 80 }} /><span className="rm-muted">al km</span></div><div className="rm-muted">{d}</div></div>)}
          </div>
        </DtRow>
        <DtRow label="Chilometri compresi" wide><DtInput id="kc" defaultValue="5" style={{ maxWidth: 90 }} /><DtSuffix>poi si paga a chilometro</DtSuffix></DtRow>
        <DtRow label="Fermo macchina" wide><DtInput id="fm" defaultValue="0,90" style={{ maxWidth: 90 }} /><DtSuffix>euro al minuto, dopo i primi 15</DtSuffix></DtRow>
      </DtSection>
      <DtSection title="Supplementi">
        <DtRow label="Applica" wide><Checkbox id="s1" labelText="Notturno, 30 per cento" defaultChecked /><Checkbox id="s2" labelText="Festivo, 30 per cento" defaultChecked /><Checkbox id="s3" labelText="Urgente, 20 per cento" defaultChecked /></DtRow>
        <DtOk>Le percentuali sono quelle del tariffario base in Impostazioni. Qui scegli solo se valgono per questa voce.</DtOk>
      </DtSection>
      <DtSection title="Note">
        <DtRow label="Note per il trasporto" wide><DtInput id="nt" placeholder="Copiate nelle note del trasporto quando usi questa voce" /></DtRow>
      </DtSection>
    </Sheet>
  );
}
