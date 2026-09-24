import { Button, Checkbox, SelectItem } from '@carbon/react';
import { Search, Checkmark } from '@carbon/icons-react';
import { DtRoot, DtHead, DtWrap, DtSection, DtRow, DtGrid, DtOk, DtInput, DtSelect, DtSuffix, DtFooter } from '../components/Datasheet.jsx';

// Rifiuti da un veicolo demolito: si sceglie il veicolo, si spuntano i rifiuti prodotti, si annotano in un colpo. Corrisponde a src/pages/RifiutiDaDemolizione.jsx.
const RIFIUTI = [
  ['16 01 06', 'Veicolo fuori uso bonificato', false, '780', 'kg', true], ['13 02 05*', 'Oli minerali per motori', true, '3,5', 'kg', true], ['16 06 01*', 'Batterie al piombo', true, '14', 'kg', true],
  ['16 01 03', 'Pneumatici fuori uso', false, '28', 'kg', true], ['16 01 07*', 'Filtri dell\'olio', true, '0,8', 'kg', false], ['16 01 14*', 'Liquidi antigelo con sostanze pericolose', true, '4', 'kg', false], ['16 01 19', 'Plastica', false, '35', 'kg', false],
];
export default function RifiutiDaDemolizione() {
  const azioni = <><Button kind="secondary" size="md">Annulla</Button><Button size="md" renderIcon={Checkmark}>Annota 4 movimenti</Button></>;
  return (
    <DtRoot>
      <DtHead crumb="Rifiuti RENTRI" title="Rifiuti da demolizione" sub="Movimenti di carico dal fascicolo di un veicolo demolito" actions={azioni} back="/rifiuti" />
      <DtWrap>
        <DtSection title="Veicolo demolito">
          <DtRow label="Veicolo" req wide><DtInput id="v" defaultValue="AB 123 CD, Fiat Punto 1.3 Multijet" /><Button kind="tertiary" size="md" renderIcon={Search}>Cerca</Button></DtRow>
          <DtOk>Pratica RVFU 2026-0087, demolita il 23 settembre. Massa a vuoto 1.090 kg, bonifica completata.</DtOk>
          <DtGrid>
            <DtRow label="Registro"><DtSelect id="r" defaultValue="g"><SelectItem value="g" text="Carico e scarico, sede di Gela" /></DtSelect></DtRow>
            <DtRow label="Data operazione"><DtInput id="d" defaultValue="24 settembre 2026" style={{ maxWidth: 200 }} /></DtRow>
          </DtGrid>
        </DtSection>
        <DtSection title="Rifiuti prodotti">
          <div className="rm-table">
            <table className="cds--data-table cds--data-table--md" style={{ width: '100%', tableLayout: 'fixed' }}>
              <colgroup><col style={{ width: 48 }} /><col style={{ width: 110 }} /><col /><col style={{ width: 110 }} /><col style={{ width: 150 }} /></colgroup>
              <thead><tr><th /><th>Codice</th><th>Rifiuto</th><th>Tipo</th><th style={{ textAlign: 'right' }}>Quantità</th></tr></thead>
              <tbody>{RIFIUTI.map(([c, d, per, q, u, on]) => (
                <tr key={c} className={on ? 'cds--data-table--selected' : ''}><td><Checkbox id={'c' + c} labelText="" hideLabel defaultChecked={on} /></td><td className="rm-mono">{c}</td><td>{d}</td><td className={per ? 'rm-status--late' : 'rm-status--muted'}>{per ? 'Pericoloso' : 'Non pericoloso'}</td><td><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}><DtInput id={'q' + c} defaultValue={q} size="sm" style={{ width: 90, textAlign: 'right' }} /><span className="rm-muted">{u}</span></div></td></tr>
              ))}</tbody>
            </table>
          </div>
          <DtOk>4 rifiuti selezionati, 825,5 kg. Ogni riga diventa un movimento di carico con causale "da demolizione veicolo AB 123 CD".</DtOk>
        </DtSection>
        <DtFooter hints={[['Ctrl Invio', 'annota'], ['Esc', 'esci']]} actions={azioni} />
      </DtWrap>
    </DtRoot>
  );
}
