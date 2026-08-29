import { t } from '@home-dashboard/i18n';
import type { NewsItem } from '@home-dashboard/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getNews } from '../../api/news.js';
import { useNow } from '../../hooks/useNow.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { PanelShell } from '../common/PanelShell/PanelShell.js';
import { useIsAsleep } from '../Sleep/useIsAsleep.js';
import * as styles from './NewsPanel.css.js';
import { NewsRow } from './NewsRow/NewsRow.js';
import { QRModal } from './QRModal/QRModal.js';

const REFRESH_MS = 5 * 60_000;
const TICK_MS = 60_000;
const LIMIT = 8;

export function NewsPanel() {
  const news = useQuery({
    queryKey: ['news', { limit: LIMIT }],
    queryFn: ({ signal }) => getNews({ limit: LIMIT, signal }),
    refetchInterval: REFRESH_MS,
  });
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const now = useNow(TICK_MS);
  const asleep = useIsAsleep();

  // The QR dialog lives in the top layer, above the sleep overlay, so it would
  // stay lit all night if the sleep window began while it was open. Adjusting
  // state during render (rather than in an effect) closes it in the same commit.
  if (asleep && selected) {
    setSelected(null);
  }

  function renderContent() {
    if (news.isPending) {
      return <PanelMessage variant="loading">{t('panel.news.loading')}</PanelMessage>;
    }

    if (news.error && !news.data) {
      return <PanelMessage variant="error">{news.error.message}</PanelMessage>;
    }

    if (!news.data || news.data.length === 0) {
      return <PanelMessage variant="empty">{t('panel.news.empty')}</PanelMessage>;
    }

    return (
      <ul className={styles.list} data-testid="news-list">
        {news.data.map((item) => (
          <NewsRow key={item.guid} item={item} onOpen={setSelected} now={now} />
        ))}
      </ul>
    );
  }

  return (
    <PanelShell title={t('panel.news.title')} testId="panel-news" grow="auto">
      {renderContent()}
      <QRModal
        url={selected?.link ?? null}
        title={selected?.title ?? null}
        onClose={() => setSelected(null)}
      />
    </PanelShell>
  );
}
