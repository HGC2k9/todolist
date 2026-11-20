// ============================================================
// Type Definitions — ToDoList Local Standalone
// ============================================================

export interface Subtask {
  id: string;
  title: string;
  is_completed: number;
}

export interface Todo {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  due_date: string | null;
  is_completed: number;
  is_pinned?: number;
  repeat_mode?: 'none' | 'daily' | 'weekly';
  subtasks?: Subtask[] | string;
  tags?: string[] | string;
  reminder_offset?: number;
  status?: 'todo' | 'in_progress' | 'completed';
  position?: number;
  pomodoro_mode?: number | boolean;
  deleted_at?: string | null;
  estimated_minutes?: number;
  actual_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface TodoImage {
  id: string;
  todo_id: string;
  image_data: string;
  created_at: string;
}

export interface CompletionHistory {
  id: string;
  todo_id?: string;
  task_title: string;
  completed_at: string;
  date_str: string;
  category?: string;
  priority?: string;
  actual_minutes?: number;
  created_at: string;
}
