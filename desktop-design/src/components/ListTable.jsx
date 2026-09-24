import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell, TableSelectRow, TableSelectAll, Layer } from '@carbon/react';

// Tabella delle liste: a filo dei bordi, righe a due livelli (rm-sub), selezione con caselle,
// riga selezionata con la barretta brand. Ogni cella porta una informazione per riga.
// columns: [{ key, label, width, render(row) }]
export default function ListTable({ columns, rows, rowKey = 'id', selectedKey, onSelect, selectable = true, footer }) {
  return (
    <Layer>
      <div className="rm-table">
        <Table size="md" useZebraStyles={false} style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            {selectable && <col style={{ width: 40 }} />}
            {columns.map((c) => <col key={c.key} style={c.width ? { width: c.width } : {}} />)}
          </colgroup>
          <TableHead>
            <TableRow>
              {selectable && <TableSelectAll id="all" name="all" checked={false} onSelect={() => {}} />}
              {columns.map((c) => <TableHeader key={c.key}>{c.label}</TableHeader>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => {
              const k = r[rowKey]; const sel = k === selectedKey;
              return (
                <TableRow key={k} isSelected={sel} onClick={() => onSelect?.(r)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
                  {selectable && <TableSelectRow id={'r' + k} name={'r' + k} checked={sel} onSelect={() => onSelect?.(r)} ariaLabel="Seleziona" />}
                  {columns.map((c) => <TableCell key={c.key}>{c.render ? c.render(r) : r[c.key]}</TableCell>)}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {footer && <div className="rm-tablefoot">{footer}</div>}
    </Layer>
  );
}

// Cella a due livelli: riga principale sopra, seconda riga in text-secondary.
export const Two = ({ a, b }) => <><div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a}</div>{b ? <span className="rm-sub">{b}</span> : null}</>;

// Stato come testo: mai pallini o badge. tono: new, muted, run, late.
export const Stato = ({ testo, sotto, tono = 'muted' }) => <><span className={'rm-status--' + tono}>{testo}</span>{sotto ? <span className="rm-sub" style={{ color: tono === 'run' ? 'var(--brand-text)' : undefined }}>{sotto}</span> : null}</>;
