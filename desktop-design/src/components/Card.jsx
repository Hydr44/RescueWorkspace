// Riquadro piatto su layer con titolo a sinistra e nota o link a destra.
export default function Card({ title, extra, children, style, className = '' }) {
  return (
    <div className={'rm-card ' + className} style={style}>
      {(title || extra) && <div className="rm-card__head"><b>{title}</b><span className="rm-muted">{extra}</span></div>}
      {children}
    </div>
  );
}

// Indicatore della pagina iniziale: etichetta, numero in metrica, riga di contesto. Mai in cima a una lista.
export function KpiTile({ label, value, context }) {
  return (
    <Card title={label} style={{ flex: 1 }}>
      <div className="rm-kpi__value">{value}</div>
      <div className="rm-muted">{context}</div>
    </Card>
  );
}
