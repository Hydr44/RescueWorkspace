import { IconButton } from '@carbon/react';
import { ChevronLeft, ChevronRight } from '@carbon/icons-react';

// Testata di una lista: titolo con conteggio, navigazione per data (facoltativa), azioni a destra.
// Un solo pulsante primario per pagina. Il titolo usa la parola del mestiere, mai "Dashboard".
export default function PageHeader({ title, count, sub, date, onPrev, onNext, actions }) {
  return (
    <div className="rm-pagehead">
      <div>
        <h1>{title}{count != null && <> <span>{count}</span></>}</h1>
        {sub && <div className="rm-pagehead__sub">{sub}</div>}
      </div>
      {date && (
        <div className="rm-pagehead__date">
          <IconButton kind="ghost" size="sm" label="Giorno prima" onClick={onPrev}><ChevronLeft /></IconButton>
          <span>{date}</span>
          <IconButton kind="ghost" size="sm" label="Giorno dopo" onClick={onNext}><ChevronRight /></IconButton>
        </div>
      )}
      {actions && <div className="rm-pagehead__actions">{actions}</div>}
    </div>
  );
}
