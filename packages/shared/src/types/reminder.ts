export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remindAt: string;
  acknowledged: boolean;
  recurring: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderInput {
  title: string;
  description?: string | null;
  remindAt: string;
  recurring?: string | null;
}

export interface UpdateReminderInput {
  title?: string;
  description?: string | null;
  remindAt?: string;
  recurring?: string | null;
}
