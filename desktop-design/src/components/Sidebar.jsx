import { NavLink, useLocation } from 'react-router-dom';
import { SideNav, SideNavItems, SideNavLink } from '@carbon/react';
import { Settings } from '@carbon/icons-react';
import logo from '../logos/logo-principale-bianco.svg';
import { NAV, USER } from '../data/nav.js';

// Barra laterale C1: testa e piede in sidebar-ends, lista in sidebar, voce attiva in sidebar-selected.
// Il logo sta qui; l'azienda cliente sta nella TopBar.
export default function Sidebar() {
  const { pathname } = useLocation();
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  return (
    <nav className="rm-sidebar" aria-label="Navigazione">
      <div className="rm-sidebar__head"><img src={logo} alt="RescueManager" /></div>
      <div className="rm-sidebar__list">
        <SideNav isFixedNav expanded isChildOfHeader={false} aria-label="Sezioni" style={{ position: 'static', width: '100%', background: 'transparent', borderRight: 0 }}>
          <SideNavItems>
            {NAV.map(([group, items]) => (
              <div key={group}>
                <div className="rm-sidebar__group">{group}</div>
                {items.map(({ to, label, icon, count }) => (
                  <SideNavLink key={to} element={NavLink} to={to} renderIcon={icon} isActive={isActive(to)}>
                    {label}{count ? <span className="rm-sidebar__count">{count}</span> : null}
                  </SideNavLink>
                ))}
              </div>
            ))}
          </SideNavItems>
        </SideNav>
      </div>
      <div className="rm-sidebar__foot">
        <span className="rm-avatar rm-avatar--sm rm-avatar--inverse">{USER.initials}</span>{USER.name}
        <NavLink to="/settings" style={{ marginLeft: 'auto', display: 'flex' }} aria-label="Impostazioni"><Settings /></NavLink>
      </div>
    </nav>
  );
}
