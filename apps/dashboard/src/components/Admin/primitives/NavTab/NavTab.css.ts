import { styleVariants } from '@vanilla-extract/css';
import { vars } from '../../../../styles/theme.css.js';

const linkBase = {
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderRadius: vars.radii.sm,
  textDecoration: 'none',
  color: vars.color.fgMuted,
  fontWeight: 500,
  whiteSpace: 'nowrap',
} as const;

export const link = styleVariants({
  inactive: linkBase,
  active: {
    ...linkBase,
    color: vars.color.fg,
    background: vars.color.bgPanelHover,
  },
});
