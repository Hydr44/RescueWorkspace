import { Tabs, TabList, Tab } from '@carbon/react';

// Tab con il conteggio nel testo: sono il filtro di stato della lista. A destra i filtri.
export default function StatusTabs({ items, selected = 0, onChange, right }) {
  return (
    <div className="rm-filters">
      <Tabs selectedIndex={selected} onChange={(e) => onChange?.(e.selectedIndex)}>
        <TabList aria-label="Stato" contained={false}>
          {items.map(([label, n]) => <Tab key={label}>{label} {n}</Tab>)}
        </TabList>
      </Tabs>
      {right && <div className="rm-filters__right">{right}</div>}
    </div>
  );
}
