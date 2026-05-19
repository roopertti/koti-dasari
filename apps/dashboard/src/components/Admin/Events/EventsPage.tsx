import type { CalendarEvent } from '@home-dashboard/shared';
import { useState } from 'react';
import { EventsForm } from './EventsForm.js';
import { EventsList } from './EventsList.js';

export function EventsPage() {
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  return (
    <>
      <EventsForm key={editing?.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />
      <EventsList onEdit={setEditing} />
    </>
  );
}
