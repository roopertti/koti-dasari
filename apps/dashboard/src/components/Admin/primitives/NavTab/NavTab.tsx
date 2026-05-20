import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import * as styles from './NavTab.css.js';

interface NavTabProps {
  to: string;
  children: ReactNode;
}

export function NavTab({ to, children }: NavTabProps) {
  return (
    <NavLink to={to} className={({ isActive }) => styles.link[isActive ? 'active' : 'inactive']}>
      {children}
    </NavLink>
  );
}
