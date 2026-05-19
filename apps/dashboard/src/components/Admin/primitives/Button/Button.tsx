import type { ButtonHTMLAttributes } from 'react';
import * as styles from './Button.css.js';

type Variant = 'primary' | 'subtle' | 'danger';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant: Variant;
}

export function Button({ variant, type = 'button', ...rest }: ButtonProps) {
  return <button {...rest} type={type} className={styles.variant[variant]} />;
}
