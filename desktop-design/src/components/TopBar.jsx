import { Button, IconButton } from '@carbon/react';
import { ChevronDown, Search, Notification, Help, Chat } from '@carbon/icons-react';
import { ORG, USER } from '../data/nav.js';

// Barra dell'azienda: selettore sede a sinistra; cerca, notifiche, aiuto e avatar a destra.
// Niente campo di ricerca finto, niente briciole di pane.
export default function TopBar({ aiOpen, onAi }) {
  return (
    <div className="rm-topbar">
      <span className="rm-topbar__company"><Button kind="ghost" size="md" renderIcon={ChevronDown} className="rm-topbar__org">{ORG.name}</Button></span>
      <span className="rm-topbar__site">{ORG.site}</span>
      <div className="rm-topbar__right">
        <IconButton kind="ghost" label="Cerca"><Search /></IconButton>
        <IconButton kind="ghost" label="Notifiche"><Notification /></IconButton>
        <IconButton kind="ghost" label="Aiuto"><Help /></IconButton>
        <Button kind={aiOpen ? 'primary' : 'tertiary'} size="md" renderIcon={Chat} onClick={onAi}>RescueAI</Button>
        <span className="rm-avatar" style={{ margin: '0 8px' }}>{USER.initials}</span>
      </div>
    </div>
  );
}
