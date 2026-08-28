import { style } from '@vanilla-extract/css';
import { vars } from '../../styles/theme.css.js';

export const root = style({
  position: 'relative',
  width: '100%',
  height: '100%',
});

const overlayBase = style({
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000000',
  // Fade in/out (sleep transition) — eased so it isn't jarring at the boundary.
  transition: 'opacity 500ms ease-in-out',
});

export const overlayVisible = style([
  overlayBase,
  {
    opacity: 1,
    pointerEvents: 'auto',
  },
]);

export const overlayHidden = style([
  overlayBase,
  {
    opacity: 0,
    pointerEvents: 'none',
  },
]);

export const clock = style({
  fontFamily: vars.font.familyMono,
  // Dim so it's readable at night without lighting the room.
  color: '#3a3f4b',
  fontSize: 'clamp(3rem, 14vw, 9rem)',
  fontWeight: vars.font.weightSemibold,
  letterSpacing: vars.font.letterSpacingWide,
  fontVariantNumeric: 'tabular-nums',
});
