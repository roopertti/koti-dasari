import { style } from '@vanilla-extract/css';
import { vars } from '../../../styles/theme.css.js';

// The dialog body is plain block flow, so the codes and the address hint need
// their own column gap — previously the removed footer button held them apart.
export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
});

export const list = style({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: vars.space.lg,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const item = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  textAlign: 'center',
});
