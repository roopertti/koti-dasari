import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import * as styles from './NavTab.css.js';

interface NavTabProps {
  to: string;
  children: ReactNode;
}

export function NavTab({ to, children }: NavTabProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
    >
      {children}
    </NavLink>
  );
}
