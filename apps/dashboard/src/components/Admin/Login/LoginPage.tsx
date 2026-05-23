import { t } from '@home-dashboard/i18n';
import { type FormEvent, useState } from 'react';
import { useAdminLogin } from '../../../hooks/useAdminSession.js';
import { Button } from '../../common/Button/Button.js';
import { Heading } from '../../common/Heading/Heading.js';
import { Field } from '../primitives/Field/Field.js';
import { Input } from '../primitives/Input/Input.js';
import { Notice } from '../primitives/Notice/Notice.js';
import * as styles from './LoginPage.css.js';

export function LoginPage() {
  const login = useAdminLogin();
  const [pin, setPin] = useState('');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pin.length === 0) {
      return;
    }
    login.mutate(pin, {
      onSettled: () => setPin(''),
    });
  }

  return (
    <div className={styles.shell}>
      <form className={styles.card} onSubmit={onSubmit}>
        <Heading level="page">{t('admin.login.title')}</Heading>
        <Field id="admin-pin" label={t('admin.login.pin')}>
          <Input
            id="admin-pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </Field>
        {login.error ? <Notice tone="error">{t('admin.login.error')}</Notice> : null}
        <Button type="submit" variant="primary" disabled={login.isPending || pin.length === 0}>
          {login.isPending ? t('admin.login.pending') : t('admin.login.submit')}
        </Button>
      </form>
    </div>
  );
}
