import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

/**
 * Shared reset for full-width tappable rows (news headline, todo body, calendar
 * event). Feature stylesheets compose this and add their own layout, so the
 * kiosk keeps one focus ring and one set of touch-target rules.
 */
export const rowButtonBase = style({
  width: '100%',
  minHeight: vars.size.touchMin,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  ':focus-visible': {
    outline: `2px solid ${vars.color.accent}`,
    outlineOffset: '2px',
  },
});
