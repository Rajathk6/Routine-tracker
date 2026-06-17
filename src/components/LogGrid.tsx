import React, { useState, useEffect, useRef } from 'react';
import { Category, Habit, Entry } from '@/types';
import { ChevronLeft, ChevronRight, Check, X, Calendar } from 'lucide-react';

interface LogGridProps {
  categories: Category[];
  habits: Habit[];
  entries: Entry[];
  onSaveEntry: (
    habitId: string,
    dateStr: string,
    numericVal: number | null,
    boolVal: boolean | null
  ) => Promise<void>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export default function LogGrid({
  categories,
  habits,
  entries,
  onSaveEntry,
  selectedDate,
  setSelectedDate
}: LogGridProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [editingCell, setEditingCell] = useState<{ habitId: string; dateStr: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Group habits by category
  const habitsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = habits
      .filter((h) => h.category_id === cat.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    return acc;
  }, {} as Record<string, Habit[]>);

  // Create a map of entries for fast lookup: entriesMap[habitId][dateStr] = entry
  const entriesMap = entries.reduce((acc, entry) => {
    if (!acc[entry.habit_id]) {
      acc[entry.habit_id] = {};
    }
    acc[entry.habit_id][entry.entry_date] = entry;
    return acc;
  }, {} as Record<string, Record<string, Entry>>);

  // Helper: Format date as YYYY-MM-DD in local time
  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate date columns based on viewMode
  const [columns, setColumns] = useState<{ dateStr: string; label: number; dayOfWeek: string; isWeekend: boolean }[]>([]);

  useEffect(() => {
    const cols = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    if (viewMode === 'month') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2); // Mo, Tu, etc.
        const dayOfWeekIndex = date.getDay();
        const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6; // Sun = 0, Sat = 6
        cols.push({
          dateStr: getLocalDateString(date),
          label: d,
          dayOfWeek: dayName,
          isWeekend
        });
      }
    } else if (viewMode === 'week') {
      // Find Monday of the selected week
      const currentDay = selectedDate.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Adjust if Sunday
      const monday = new Date(selectedDate);
      monday.setDate(selectedDate.getDate() + distanceToMonday);

      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
        const dayOfWeekIndex = date.getDay();
        const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;
        cols.push({
          dateStr: getLocalDateString(date),
          label: date.getDate(),
          dayOfWeek: dayName,
          isWeekend
        });
      }
    } else {
      // Single Day View
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
      const dayOfWeekIndex = selectedDate.getDay();
      cols.push({
        dateStr: getLocalDateString(selectedDate),
        label: selectedDate.getDate(),
        dayOfWeek: dayName,
        isWeekend: dayOfWeekIndex === 0 || dayOfWeekIndex === 6
      });
    }

    setColumns(cols);
  }, [selectedDate, viewMode]);

  // Handle previous/next navigation
  const handleNavigate = (direction: 'prev' | 'next') => {
    const val = direction === 'prev' ? -1 : 1;
    const newDate = new Date(selectedDate);

    if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + val);
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + val * 7);
    } else {
      newDate.setDate(selectedDate.getDate() + val);
    }
    setSelectedDate(newDate);
  };

  // Focus the editing input when opened
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  // Start editing numeric cell
  const startEditing = (habitId: string, dateStr: string, currentVal: number | undefined) => {
    setEditingCell({ habitId, dateStr });
    setEditValue(currentVal !== undefined && currentVal !== null ? String(currentVal) : '');
  };

  // Save numeric edit
  const finishEditing = async () => {
    if (!editingCell) return;
    const { habitId, dateStr } = editingCell;
    setEditingCell(null);

    const val = editValue.trim() === '' ? null : Number(editValue);
    if (val !== null && isNaN(val)) return; // Don't save invalid numbers

    await onSaveEntry(habitId, dateStr, val, null);
  };

  // Handle cell click (simple toggle for yesno)
  const handleCellClick = async (habit: Habit, dateStr: string) => {
    if (habit.unit_type === 'yesno') {
      const currentEntry = entriesMap[habit.id]?.[dateStr];
      const nextVal = currentEntry ? !currentEntry.value_bool : true;
      await onSaveEntry(habit.id, dateStr, null, nextVal);
    }
  };

  // Format month name
  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekRangeLabel = () => {
    const currentDay = selectedDate.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `Week of ${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}, ${selectedDate.getFullYear()}`;
  };

  const getCategoryColorClass = (colorTag?: string) => {
    switch (colorTag?.toLowerCase()) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'yellow':
      case 'orange':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rose':
      case 'red':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Calculate stats for a habit (totals, goals, completion rate)
  const calculateHabitStats = (habit: Habit) => {
    const habitEntries = entriesMap[habit.id] || {};
    let total = 0;

    // We only sum up entries in the current columns view to match the Google Sheet view logic
    columns.forEach((col) => {
      const entry = habitEntries[col.dateStr];
      if (entry) {
        if (habit.unit_type === 'yesno') {
          if (entry.value_bool) total += 1;
        } else {
          total += entry.value_numeric || 0;
        }
      }
    });

    // Clean decimals
    total = Math.round(total * 100) / 100;

    const goal = habit.monthly_goal || 0;
    const rate = goal > 0 ? Math.round((total / goal) * 100) : 0;

    return { total, goal, rate };
  };

  return (
    <div className="space-y-6">
      {/* Grid Controls Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 gap-4">
        {/* View Selection Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode} view
            </button>
          ))}
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleNavigate('prev')}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center space-x-2 font-semibold text-slate-800 text-sm md:text-base min-w-[150px] justify-center">
            <Calendar className="h-4 w-4 text-indigo-500 hidden sm:block" />
            <span>
              {viewMode === 'month' && monthName}
              {viewMode === 'week' && weekRangeLabel()}
              {viewMode === 'day' && selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <button
            onClick={() => handleNavigate('next')}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        {/* Reset to Today button */}
        <button
          onClick={() => setSelectedDate(new Date())}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
        >
          Go to Today
        </button>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
        <table className="w-full border-collapse text-left text-xs text-slate-800 font-sans table-fixed min-w-[900px]">
          {/* Header Row */}
          <thead>
            {/* Top row with WKs groupings (only for month view) */}
            {viewMode === 'month' && (
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-[80px] border-r border-slate-200"></th>
                <th className="w-[180px] border-r border-slate-200"></th>
                <th className="w-[70px] border-r border-slate-200"></th>
                
                {/* Dynamically build WK headers spanning columns */}
                {Array.from({ length: Math.ceil(columns.length / 7) }).map((_, wkIdx) => {
                  const span = Math.min(7, columns.length - wkIdx * 7);
                  return (
                    <th
                      key={wkIdx}
                      colSpan={span}
                      className="text-center font-bold text-[10px] tracking-wide text-indigo-600 bg-indigo-50/50 border-r border-slate-200 uppercase py-1"
                    >
                      WK {wkIdx + 1}
                    </th>
                  );
                })}
                
                <th className="w-[65px] border-r border-slate-200"></th>
                <th className="w-[65px] border-r border-slate-200"></th>
                <th className="w-[65px]"></th>
              </tr>
            )}

            {/* Day of Week Headers */}
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <th className="w-[80px] py-2 px-3 border-r border-slate-200 text-[10px] uppercase tracking-wider">Category</th>
              <th className="w-[180px] py-2 px-3 border-r border-slate-200 text-[10px] uppercase tracking-wider">Habit</th>
              <th className="w-[70px] py-2 px-2 border-r border-slate-200 text-center text-[10px] uppercase tracking-wider">Unit</th>
              
              {/* Individual day columns */}
              {columns.map((col) => (
                <th
                  key={col.dateStr}
                  className={`text-center font-semibold border-r border-slate-200 py-1.5 px-0.5 select-none ${
                    col.isWeekend ? 'bg-rose-50 text-rose-800' : 'text-slate-600'
                  }`}
                >
                  <div className="text-[9px] font-medium leading-none">{col.dayOfWeek}</div>
                  <div className="text-xs font-bold leading-normal mt-0.5">{col.label}</div>
                </th>
              ))}

              <th className="w-[65px] py-2 px-2 text-center border-r border-slate-200 text-[10px] uppercase tracking-wider text-slate-700 bg-slate-100/60">Total</th>
              <th className="w-[65px] py-2 px-2 text-center border-r border-slate-200 text-[10px] uppercase tracking-wider text-slate-700 bg-slate-100/60">Goal</th>
              <th className="w-[65px] py-2 px-2 text-center text-[10px] uppercase tracking-wider text-slate-700 bg-slate-100/60">Rate%</th>
            </tr>
          </thead>

          {/* Table Body Rows grouped by categories */}
          <tbody>
            {categories
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((cat) => {
                const catHabits = habitsByCategory[cat.id] || [];
                if (catHabits.length === 0) return null;

                return catHabits.map((habit, habitIdx) => {
                  const { total, goal, rate } = calculateHabitStats(habit);

                  return (
                    <tr
                      key={habit.id}
                      className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Category cell - span vertically for first habit of the category */}
                      {habitIdx === 0 ? (
                        <td
                          rowSpan={catHabits.length}
                          className={`align-middle border-r border-slate-200 font-bold text-[11px] text-center uppercase py-3 px-2 ${getCategoryColorClass(
                            cat.color_tag
                          )}`}
                        >
                          {cat.name}
                        </td>
                      ) : null}

                      {/* Habit Name */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-800 truncate">
                        {habit.name}
                      </td>

                      {/* Unit Label */}
                      <td className="py-2 px-1 border-r border-slate-200 text-center font-medium text-slate-400 italic text-[10px]">
                        {habit.unit_label || habit.unit_type}
                      </td>

                      {/* Daily log input cells */}
                      {columns.map((col) => {
                        const entry = entriesMap[habit.id]?.[col.dateStr];
                        const isWeekend = col.isWeekend;

                        if (habit.unit_type === 'yesno') {
                          const isChecked = entry?.value_bool === true;
                          return (
                            <td
                              key={col.dateStr}
                              onClick={() => handleCellClick(habit, col.dateStr)}
                              className={`border-r border-slate-200 text-center cursor-pointer select-none align-middle transition-all hover:bg-indigo-50/30 ${
                                isWeekend ? 'bg-rose-50/30' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center h-full w-full py-2">
                                {isChecked && (
                                  <span className="text-emerald-600 font-extrabold text-sm select-none animate-pulse">
                                    ✓
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        } else {
                          // Numeric input fields
                          const value = entry?.value_numeric;
                          const isEditing =
                            editingCell?.habitId === habit.id && editingCell?.dateStr === col.dateStr;

                          return (
                            <td
                              key={col.dateStr}
                              onDoubleClick={() => startEditing(habit.id, col.dateStr, value ?? undefined)}
                              onClick={() => {
                                // Double click on mobile is hard, single click is fine if not already editing
                                if (!isEditing) {
                                  // Setup short delay to distinguish double click if needed, but simple trigger is fine
                                }
                              }}
                              className={`border-r border-slate-200 text-center select-none align-middle font-bold text-indigo-600 cursor-text py-1 ${
                                isWeekend ? 'bg-rose-50/30' : ''
                              } ${isEditing ? 'p-0 bg-indigo-50/50' : ''}`}
                            >
                              {isEditing ? (
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={finishEditing}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') finishEditing();
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full h-8 px-1 text-center bg-transparent border-none outline-none font-bold text-indigo-700 focus:ring-0 text-xs"
                                />
                              ) : (
                                <div className="h-full w-full py-1.5 flex items-center justify-center min-h-[24px]">
                                  {value !== undefined && value !== null ? value : ''}
                                </div>
                              )}
                            </td>
                          );
                        }
                      })}

                      {/* TOTAL Column */}
                      <td className="py-2.5 px-2 border-r border-slate-200 text-center font-bold text-slate-800 bg-slate-50/50">
                        {total}
                      </td>

                      {/* GOAL Column */}
                      <td className="py-2.5 px-2 border-r border-slate-200 text-center font-medium text-slate-500 bg-slate-50/50">
                        {goal || '-'}
                      </td>

                      {/* RATE% Column */}
                      <td
                        className={`py-2.5 px-2 text-center font-bold bg-slate-50/50 ${
                          rate >= 100
                            ? 'text-emerald-600 bg-emerald-50/10'
                            : rate >= 50
                            ? 'text-amber-600 bg-amber-50/10'
                            : 'text-rose-600 bg-rose-50/10'
                        }`}
                      >
                        {goal > 0 ? `${rate}%` : '-'}
                      </td>
                    </tr>
                  );
                });
              })}
          </tbody>
        </table>
      </div>

      {/* Grid Legend & Note */}
      <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-medium">
        <div>
          <span className="font-bold text-slate-700">Legend:</span>{' '}
          <span className="text-emerald-600 font-bold">✓</span> for yes/no tasks &bull;{' '}
          <span className="text-indigo-600 font-bold">Numbers</span> for numeric categories (e.g. km, problems, pages, minutes, steps)
        </div>
        <div className="hidden sm:block text-slate-400">
          Double-click any number cell to edit values &bull; Changes are autosaved instantly
        </div>
      </div>
    </div>
  );
}
