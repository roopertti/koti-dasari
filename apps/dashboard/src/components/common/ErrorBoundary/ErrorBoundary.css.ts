import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.lg,
  height: '100%',
  width: '100%',
  padding: vars.space.xl,
  textAlign: 'center',
  background: vars.color.bg,
  color: vars.color.fg,
});

export const title = style({
  fontSize: '1.5rem',
  fontWeight: vars.font.weightSemibold,
  color: vars.color.danger,
});

export const detail = style({
  fontSize: vars.font.sizeSm,
  color: vars.color.fgMuted,
  fontFamily: vars.font.familyMono,
  maxWidth: '60ch',
  wordBreak: 'break-word',
});
