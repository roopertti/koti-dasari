export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: TodoPriority;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string | null;
  priority?: TodoPriority;
  dueDate?: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  priority?: TodoPriority;
  dueDate?: string | null;
  sortOrder?: number;
}

export interface ReorderTodoItem {
  id: string;
  sortOrder: number;
}
