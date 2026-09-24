import { Button, ContentSwitcher, Switch, SelectItem } from '@carbon/react';
import { Save, Renew, Flash } from '@carbon/icons-react';
import { DtRoot, DtHead, DtWrap, DtSection, DtRow, DtGrid, DtOk, DtInput, DtSelect, DtSuffix, DtFooter } from '../components/Datasheet.jsx';

// Nuovo cliente nel pattern datasheet. Corrisponde a src/pages/ClientNew.jsx dell'app.
export default function ClienteNuovo() {
  const azioni = <><Button kind="secondary" size="md">Annulla</Button><Button size="md" renderIcon={Save}>Salva cliente</Button></>;
  return (
    <DtRoot>
      <DtHead crumb="Clienti" title="Nuovo cliente" sub="Azienda con partita IVA" draft="Bozza salvata alle 14:41" pct={60} actions={azioni} />
      <DtWrap>
        <div style={{ marginBottom: 14, width: 260 }}><ContentSwitcher selectedIndex={0} size="md" onChange={() => {}}><Switch name="az" text="Azienda" /><Switch name="pr" text="Privato" /></ContentSwitcher></div>
        <DtSection title="Dati azienda">
          <DtRow label="Codice cliente" wide><DtInput id="cod" defaultValue="VELLA" mono /><Button kind="tertiary" size="md" renderIcon={Renew}>Genera</Button></DtRow>
          <DtRow label="Ragione sociale" req wide><DtInput id="rs" defaultValue="Autofficina Vella S.r.l." /></DtRow>
          <DtGrid>
            <DtRow label="Partita IVA" req><DtInput id="piva" defaultValue="IT01234567890" /><Button kind="tertiary" size="md" renderIcon={Flash}>Compila</Button></DtRow>
            <DtRow label="Codice fiscale"><DtInput id="cf" defaultValue="01234567890" /></DtRow>
          </DtGrid>
          <DtOk>Partita IVA valida. Dati anagrafici compilati dal registro imprese.</DtOk>
          <DtGrid>
            <DtRow label="Categoria"><DtSelect id="cat" defaultValue="off"><SelectItem value="off" text="Officina" /><SelectItem value="car" text="Carrozzeria" /><SelectItem value="con" text="Concessionaria" /></DtSelect></DtRow>
            <DtRow label="Sconto"><DtInput id="sc" defaultValue="10" style={{ maxWidth: 120 }} /><DtSuffix>per cento</DtSuffix></DtRow>
          </DtGrid>
        </DtSection>
        <DtSection title="Contatti">
          <DtGrid>
            <DtRow label="Email"><DtInput id="em" defaultValue="info@autofficinavella.it" /></DtRow>
            <DtRow label="Telefono"><DtSelect id="pre" defaultValue="it" style={{ width: 136, flex: '0 0 auto' }}><SelectItem value="it" text="IT +39" /></DtSelect><DtInput id="tel" defaultValue="0933 123456" /></DtRow>
          </DtGrid>
          <DtGrid>
            <DtRow label="Secondo telefono"><DtInput id="tel2" placeholder="Facoltativo" /></DtRow>
            <DtRow label="Sito web"><DtInput id="web" defaultValue="autofficinavella.it" /></DtRow>
          </DtGrid>
        </DtSection>
        <DtSection title="Indirizzo">
          <DtRow label="Via e numero" wide><DtInput id="via" defaultValue="Via dello Smeraldo 18" /></DtRow>
          <DtGrid>
            <DtRow label="CAP"><DtInput id="cap" defaultValue="93012" style={{ maxWidth: 120 }} /></DtRow>
            <DtRow label="Città e provincia"><DtInput id="cit" defaultValue="Gela" /><DtInput id="pr" defaultValue="CL" style={{ maxWidth: 72, textAlign: 'center' }} /></DtRow>
          </DtGrid>
        </DtSection>
        <DtSection title="Fatturazione elettronica">
          <DtGrid>
            <DtRow label="Codice destinatario"><DtInput id="sdi" defaultValue="M5UXCR1" mono /></DtRow>
            <DtRow label="PEC"><DtInput id="pec" defaultValue="vella@pec.it" /></DtRow>
          </DtGrid>
        </DtSection>
        <DtFooter actions={azioni} />
      </DtWrap>
    </DtRoot>
  );
}
