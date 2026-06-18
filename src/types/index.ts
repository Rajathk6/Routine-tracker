export interface Category {
  id: string;
  name: string;
  color_tag?: string;
  sort_order: number;
}

export type UnitType = "number" | "count" | "yesno" | "pages" | "tick";

export interface Habit {
  id: string;
  category_id: string;
  name: string;
  unit_type: UnitType;
  unit_label?: string; // e.g., 'km', 'steps', 'minutes', 'problems', 'pages'
  monthly_goal: number;
  sort_order: number;
}

export interface Entry {
  id?: string;
  habit_id: string;
  entry_date: string; // YYYY-MM-DD
  value_numeric?: number | null;
  value_bool?: boolean | null;
}
