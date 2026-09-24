import { Meter, DeliveryTruck, Location, Car, Recycle, Calendar, User, Dashboard, Building, Group, Tools, ChartBar, Document, Receipt, Calculator, Send } from '@carbon/icons-react';

// Gruppi e voci della barra laterale. Le rotte sono quelle dell'app.
// Il conteggio (count) e' solo per le code di lavoro, mai per le anagrafiche.
export const NAV = [
  ['Operativo', [
    { to: '/', label: 'Dashboard', icon: Meter },
    { to: '/trasporti', label: 'Trasporti', icon: DeliveryTruck, count: 6 },
    { to: '/tracking', label: 'Tracking GPS', icon: Location },
    { to: '/demolizioni-rvfu', label: 'Demolizioni RVFU', icon: Car },
    { to: '/rifiuti', label: 'Rifiuti RENTRI', icon: Recycle },
    { to: '/calendario', label: 'Calendario', icon: Calendar },
    { to: '/unrae', label: 'UNRAE', icon: Send },
  ]],
  ['Anagrafiche', [
    { to: '/clienti', label: 'Clienti', icon: User },
    { to: '/mezzi', label: 'Mezzi', icon: Dashboard },
    { to: '/piazzale', label: 'Piazzale', icon: Building },
    { to: '/autisti', label: 'Autisti', icon: Group },
    { to: '/ricambi', label: 'Ricambi', icon: Tools },
  ]],
  ['Amministrazione', [
    { to: '/fatture', label: 'Fatture', icon: Receipt },
    { to: '/contabilita', label: 'Contabilità', icon: Calculator },
  ]],
  ['Analisi', [
    { to: '/report', label: 'Report', icon: ChartBar },
    { to: '/preventivi', label: 'Preventivi', icon: Document },
  ]],
];

export const USER = { name: 'Emmanuel S.', initials: 'ES' };
export const ORG = { name: 'Autosoccorso Bianchi', site: 'Sede di Gela' };
