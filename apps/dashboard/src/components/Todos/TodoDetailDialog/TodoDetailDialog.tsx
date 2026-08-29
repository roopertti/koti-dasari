import { dueDateShort, parseLocalDate, t } from '@home-dashboard/i18n';
import type { Todo } from '@home-dashboard/shared';
import { DetailDialog } from '../../common/DetailDialog/DetailDialog.js';
import { DetailRow } from '../../common/DetailList/DetailList.js';

interface TodoDetailDialogProps {
  todo: Todo | null;
  onClose: () => void;
}

export function TodoDetailDialog({ todo, onClose }: TodoDetailDialogProps) {
  return (
    <DetailDialog
      open={!!todo}
      title={todo?.title ?? ''}
      onClose={onClose}
      testId="todo-detail-dialog"
      description={todo?.description ?? null}
      details={
        todo && (
          <>
            <DetailRow label={t('panel.todos.detail.status')}>
              {todo.completed
                ? t('panel.todos.detail.statusDone')
                : t('panel.todos.detail.statusActive')}
            </DetailRow>
            <DetailRow label={t('panel.todos.detail.priority')}>
              {t(`panel.todos.priority.${todo.priority}`)}
            </DetailRow>
            {todo.dueDate && (
              <DetailRow label={t('panel.todos.detail.due')}>
                {dueDateShort.format(parseLocalDate(todo.dueDate))}
              </DetailRow>
            )}
          </>
        )
      }
    />
  );
}
