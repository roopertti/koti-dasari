import * as styles from './Select.css.js';

interface SelectOption<V extends string> {
  value: V;
  label: string;
}

interface SelectProps<V extends string> {
  id: string;
  value: V;
  onChange: (value: V) => void;
  options: readonly SelectOption<V>[];
  disabled?: boolean;
  required?: boolean;
}

export function Select<V extends string>({
  id,
  value,
  onChange,
  options,
  disabled,
  required,
}: SelectProps<V>) {
  return (
    <select
      id={id}
      className={styles.root}
      value={value}
      disabled={disabled}
      required={required}
      onChange={(e) => onChange(e.target.value as V)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
