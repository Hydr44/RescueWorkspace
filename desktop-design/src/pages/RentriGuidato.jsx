import { Button, SelectItem, Checkbox } from '@carbon/react';
import { ArrowRight, ArrowLeft, Search } from '@carbon/icons-react';
import { DtRoot, DtHead, DtWrap, DtSection, DtRow, DtGrid, DtOk, DtInput, DtSelect, DtSuffix, DtFooter } from '../components/Datasheet.jsx';

// Movimento guidato RENTRI: percorso a tappe con l'elenco delle tappe a sinistra e la tappa corrente a destra.
// Corrisponde a src/pages/RifiutiMovimentoGuidato.jsx. Le tappe seguono le domande della pagina attuale.
const TAPPE = [['Registro', 'Carico e scarico, sede di Gela'], ['Entra o esce', 'Carico: il rifiuto entra'], ['Rifiuto', 'Codice EER e descrizione'], ['Quantità', 'Chili e stato fisico'], ['Provenienza e causale', 'Da dove viene e perché'], ['Riepilogo', 'Come verrà salvato']];
export default function RentriGuidato() {
  const cur = 2;
  const azioni = <><Button kind="tertiary" size="md" renderIcon={ArrowLeft}>Indietro</Button><Button size="md" renderIcon={ArrowRight}>Avanti: quantità</Button></>;
  return (
    <DtRoot>
      <DtHead crumb="Rifiuti RENTRI" title="Nuovo movimento" sub="Registro di carico e scarico, tappa 3 di 6" draft="Bozza salvata alle 15:10" pct={40} actions={azioni} back="/rifiuti" />
      <DtWrap>
        <div className="rm-steps">
          <div className="rm-steps__nav">
            {TAPPE.map(([t, s], i) => <div key={t} className={'rm-steps__item ' + (i < cur ? 'done' : i === cur ? 'cur' : '')}><i>{i + 1}</i><div>{t}<small>{i <= cur ? s : ''}</small></div></div>)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <DtSection title="Che rifiuto è">
              <DtRow label="Codice EER" req wide><DtInput id="eer" defaultValue="16 01 04*" mono style={{ maxWidth: 160 }} /><Button kind="tertiary" size="md" renderIcon={Search}>Cerca nel catalogo</Button></DtRow>
              <DtOk>16 01 04*, veicoli fuori uso. Rifiuto pericoloso. Lo hai usato 38 volte quest'anno.</DtOk>
              <DtRow label="Descrizione" wide><DtInput id="des" defaultValue="Veicolo fuori uso, Fiat Punto AB 123 CD" /></DtRow>
              <DtGrid>
                <DtRow label="Classe"><DtSelect id="cl" defaultValue="s"><SelectItem value="s" text="Speciale" /><SelectItem value="u" text="Urbano" /></DtSelect></DtRow>
                <DtRow label="Pericolosità"><DtSelect id="hp" defaultValue="hp14"><SelectItem value="hp14" text="HP14, ecotossico" /><SelectItem value="hp5" text="HP5, tossicità specifica" /></DtSelect></DtRow>
              </DtGrid>
              <DtRow label="Collega a" wide><DtInput id="vfu" defaultValue="Pratica RVFU 2026-0087, AB 123 CD" /><DtSuffix>facoltativo</DtSuffix></DtRow>
            </DtSection>
            <DtSection title="Rifiuti usati di recente">
              {[['16 01 04*', 'Veicoli fuori uso', '38 movimenti'], ['16 01 06', 'Veicoli fuori uso bonificati', '31 movimenti'], ['13 02 05*', 'Oli minerali per motori', '12 movimenti'], ['16 06 01*', 'Batterie al piombo', '9 movimenti']].map(([c, d, n]) => (
                <div key={c} style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 12, padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}><span className="rm-mono">{c}</span><span>{d}</span><span className="rm-muted">{n}</span></div>
              ))}
            </DtSection>
          </div>
        </div>
        <DtFooter hints={[['Ctrl Invio', 'avanti'], ['Esc', 'esci']]} actions={azioni} />
      </DtWrap>
    </DtRoot>
  );
}
