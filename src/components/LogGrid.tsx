"use client";
import { useState, useEffect, useRef } from 'react';
import { Category, Habit, Entry } from '@/types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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

type ViewMode = 'month' | 'week' | 'day';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Detect mobile via window width (SSR-safe)
const getDefaultView = (): ViewMode => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) return 'week';
  return 'month';
};

export default function LogGrid({
  categories,
  habits,
  entries,
  onSaveEntry,
  selectedDate,
  setSelectedDate
}: LogGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(getDefaultView);
  const [editingCell, setEditingCell] = useState<{ habitId: string; dateStr: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(currentYear, 2030); // allow selecting through 2030

  // ── Entry lookup map ────────────────────────────────────────────────────
  const entriesMap = entries.reduce((acc, entry) => {
    if (!acc[entry.habit_id]) acc[entry.habit_id] = {};
    acc[entry.habit_id][entry.entry_date] = entry;
    return acc;
  }, {} as Record<string, Record<string, Entry>>);

  // ── Habits grouped by category ──────────────────────────────────────────
  const habitsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = habits
      .filter((h) => h.category_id === cat.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    return acc;
  }, {} as Record<string, Habit[]>);

  // ── Date helpers ────────────────────────────────────────────────────────
  const localDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const dayAbbr = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);

  // ── Generate columns ────────────────────────────────────────────────────
  type ColInfo = { dateStr: string; label: number; dayOfWeek: string; isWeekend: boolean };

  const buildColumns = (): ColInfo[] => {
    const cols: ColInfo[] = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    if (viewMode === 'month') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dow = date.getDay();
        cols.push({ dateStr: localDateStr(date), label: d, dayOfWeek: dayAbbr(date), isWeekend: dow === 0 || dow === 6 });
      }
    } else if (viewMode === 'week') {
      const dow = selectedDate.getDay();
      const toMon = dow === 0 ? -6 : 1 - dow;
      const monday = new Date(selectedDate);
      monday.setDate(selectedDate.getDate() + toMon);
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const d = date.getDay();
        cols.push({ dateStr: localDateStr(date), label: date.getDate(), dayOfWeek: dayAbbr(date), isWeekend: d === 0 || d === 6 });
      }
    } else {
      const d = selectedDate.getDay();
      cols.push({ dateStr: localDateStr(selectedDate), label: selectedDate.getDate(), dayOfWeek: dayAbbr(selectedDate), isWeekend: d === 0 || d === 6 });
    }
    return cols;
  };

  const [columns, setColumns] = useState<ColInfo[]>(buildColumns);
  useEffect(() => { setColumns(buildColumns()); }, [selectedDate, viewMode]);

  // ── Navigation ──────────────────────────────────────────────────────────
  const navigate = (dir: 'prev' | 'next') => {
    const v = dir === 'prev' ? -1 : 1;
    const d = new Date(selectedDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + v);
    else if (viewMode === 'week') d.setDate(d.getDate() + v * 7);
    else d.setDate(d.getDate() + v);
    // Cap at maxYear
    if (d.getFullYear() > maxYear) return;
    setSelectedDate(d);
  };

  // ── Month/Year selectors ────────────────────────────────────────────────
  const setMonth = (m: number) => {
    const d = new Date(selectedDate);
    d.setMonth(m);
    setSelectedDate(d);
  };

  const setYear = (y: number) => {
    const d = new Date(selectedDate);
    d.setFullYear(y);
    setSelectedDate(d);
  };

  // Year options: 2020 through 2030
  const yearOptions = Array.from({ length: 2030 - 2019 }, (_, i) => 2020 + i);

  // ── Label strings ───────────────────────────────────────────────────────
  const weekRangeLabel = () => {
    const dow = selectedDate.getDay();
    const toMon = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + toMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(monday)} – ${fmt(sunday)}, ${monday.getFullYear()}`;
  };

  // ── Week group headers for month view ───────────────────────────────────
  const buildWeekGroups = () => {
    const groups: { label: string; span: number }[] = [];
    let i = 0;
    while (i < columns.length) {
      const wkStart = columns[i];
      const startDate = new Date(wkStart.dateStr);
      // Week ends on Sunday or last day of the month in this group
      let span = 0;
      let j = i;
      while (j < columns.length) {
        span++;
        const dayOfWeek = new Date(columns[j].dateStr).getDay();
        j++;
        if (dayOfWeek === 0) break; // Sunday ends the week
      }
      const wkEndDate = new Date(columns[Math.min(j - 1, columns.length - 1)].dateStr);
      const label = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${wkEndDate.toLocaleDateString('en-US', { day: 'numeric' })}`;
      groups.push({ label, span });
      i = j;
    }
    return groups;
  };

  // ── Editing ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const startEditing = (habitId: string, dateStr: string, currentVal: number | undefined) => {
    setEditingCell({ habitId, dateStr });
    setEditValue(currentVal !== undefined && currentVal !== null ? String(currentVal) : '');
  };

  const parseEntryValue = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    if (/^[✓✔]$/.test(trimmed)) return 1;
    const normalized = trimmed.replace(/,/g, '');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const finishEditing = async () => {
    if (!editingCell) return;
    const { habitId, dateStr } = editingCell;
    setEditingCell(null);
    const val = editValue.trim() === '' ? null : parseEntryValue(editValue);
    if (val === null && editValue.trim() !== '') return;
    await onSaveEntry(habitId, dateStr, val, null);
  };

  const handleCellClick = async (habit: Habit, dateStr: string) => {
    if (habit.unit_type === 'yesno') {
      const entry = entriesMap[habit.id]?.[dateStr];
      await onSaveEntry(habit.id, dateStr, null, entry ? !entry.value_bool : true);
    } else {
      const entry = entriesMap[habit.id]?.[dateStr];
      startEditing(habit.id, dateStr, entry?.value_numeric ?? undefined);
    }
  };

  // ── Category color ──────────────────────────────────────────────────────
  const catColorClass = (colorTag?: string) => {
    switch (colorTag?.toLowerCase()) {
      case 'blue':   return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green':  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'yellow':
      case 'orange': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rose':
      case 'red':    return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:       return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // ── Stats ───────────────────────────────────────────────────────────────
  const calcStats = (habit: Habit) => {
    const map = entriesMap[habit.id] || {};
    let total = 0;
    columns.forEach((col) => {
      const e = map[col.dateStr];
      if (!e) return;
      if (habit.unit_type === 'yesno') { if (e.value_bool) total += 1; }
      else total += e.value_numeric || 0;
    });
    total = Math.round(total * 100) / 100;
    const goal = habit.monthly_goal || 0;
    const rate = goal > 0 ? Math.round((total / goal) * 100) : 0;
    return { total, goal, rate };
  };

  const weekGroups = viewMode === 'month' ? buildWeekGroups() : [];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Controls Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">

        {/* View toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('prev')}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {viewMode === 'month' ? (
            /* Month + Year selectors */
            <div className="flex items-center gap-1.5">
              <select
                value={selectedDate.getMonth()}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 cursor-pointer"
              >
                {MONTHS.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
              <select
                value={selectedDate.getFullYear()}
                onChange={(e) => setYear(Number(e.target.value))}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-xs sm:text-sm min-w-[140px] sm:min-w-[200px] justify-center">
              <Calendar className="h-4 w-4 text-indigo-500 hidden sm:block" />
              <span>
                {viewMode === 'week' && weekRangeLabel()}
                {viewMode === 'day' && selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}

          <button
            onClick={() => navigate('next')}
            disabled={selectedDate.getFullYear() >= maxYear && selectedDate.getMonth() === 11 && viewMode === 'month'}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Today */}
        <button
          onClick={() => setSelectedDate(new Date())}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
        >
          Go to Today
        </button>
      </div>

      {/* ── Spreadsheet ──────────────────────────────────────────────── */}
      {/*
        Layout strategy:
        - Outer div: overflow-x-auto (horizontal scroll)
        - sticky left: Category, Habit, Unit columns
        - sticky right: Total, Goal, Rate% columns
        - scrollable middle: day columns
      */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse text-left text-xs text-slate-800 font-sans" style={{ minWidth: `${330 + columns.length * 38 + 195}px` }}>
            <thead>
              {/* Week group header row (month view only) */}
              {viewMode === 'month' && weekGroups.length > 0 && (
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* Sticky left placeholders */}
                  <th className="sticky left-0 z-20 bg-slate-50 w-[90px] border-r border-slate-200" />
                  <th className="sticky left-[90px] z-20 bg-slate-50 w-[160px] border-r border-slate-200" />
                  <th className="sticky left-[250px] z-20 bg-slate-50 w-[80px] border-r border-slate-200" />
                  {/* Week group spans */}
                  {weekGroups.map((wk, i) => (
                    <th
                      key={i}
                      colSpan={wk.span}
                      className="text-center font-bold text-[10px] tracking-wide text-indigo-600 bg-indigo-50/50 border-r border-slate-200 uppercase py-1 whitespace-nowrap px-1"
                    >
                      {wk.label}
                    </th>
                  ))}
                  {/* Sticky right placeholders */}
                  <th className="sticky right-[130px] z-20 bg-slate-100 w-[65px] border-l border-slate-200" />
                  <th className="sticky right-[65px] z-20 bg-slate-100 w-[65px] border-l border-slate-200" />
                  <th className="sticky right-0 z-20 bg-slate-100 w-[65px] border-l border-slate-200" />
                </tr>
              )}

              {/* Column headers */}
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="sticky left-0 z-20 bg-slate-50/90 backdrop-blur-sm w-[90px] py-2 px-3 border-r border-slate-200 text-[10px] uppercase tracking-wider whitespace-nowrap">
                  Category
                </th>
                <th className="sticky left-[90px] z-20 bg-slate-50/90 backdrop-blur-sm w-[160px] py-2 px-3 border-r border-slate-200 text-[10px] uppercase tracking-wider whitespace-nowrap">
                  Habit
                </th>
                <th className="sticky left-[250px] z-20 bg-slate-50/90 backdrop-blur-sm w-[80px] py-2 px-2 border-r border-slate-200 text-center text-[10px] uppercase tracking-wider whitespace-nowrap">
                  Unit
                </th>

                {/* Day columns (scrollable) */}
                {columns.map((col) => (
                  <th
                    key={col.dateStr}
                    className={`text-center font-semibold border-r border-slate-200 py-1.5 px-0 select-none w-[38px] min-w-[38px] ${
                      col.isWeekend ? 'bg-rose-50 text-rose-700' : 'text-slate-600'
                    }`}
                  >
                    <div className="text-[9px] font-medium leading-none">{col.dayOfWeek}</div>
                    <div className="text-[11px] font-bold leading-normal mt-0.5">{col.label}</div>
                  </th>
                ))}

                {/* Sticky right stat columns */}
                <th className="sticky right-[130px] z-20 bg-slate-100/90 backdrop-blur-sm w-[65px] py-2 px-2 text-center border-l border-slate-200 text-[10px] uppercase tracking-wider text-slate-700 whitespace-nowrap">
                  Total
                </th>
                <th className="sticky right-[65px] z-20 bg-slate-100/90 backdrop-blur-sm w-[65px] py-2 px-2 text-center border-l border-slate-200 text-[10px] uppercase tracking-wider text-slate-700 whitespace-nowrap">
                  Goal
                </th>
                <th className="sticky right-0 z-20 bg-slate-100/90 backdrop-blur-sm w-[65px] py-2 px-2 text-center border-l border-slate-200 text-[10px] uppercase tracking-wider text-slate-700 whitespace-nowrap">
                  Rate%
                </th>
              </tr>
            </thead>

            <tbody>
              {categories
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((cat) => {
                  const catHabits = habitsByCategory[cat.id] || [];
                  if (catHabits.length === 0) return null;

                  return catHabits.map((habit, habitIdx) => {
                    const { total, goal, rate } = calcStats(habit);

                    return (
                      <tr key={habit.id} className="border-b border-slate-200 hover:bg-slate-50/60 transition-colors">
                        {/* Category — sticky left, rowSpan */}
                        {habitIdx === 0 && (
                          <td
                            rowSpan={catHabits.length}
                            className={`sticky left-0 z-10 align-middle border-r border-slate-200 font-bold text-[11px] text-center uppercase py-3 px-2 ${catColorClass(cat.color_tag)}`}
                          >
                            {cat.name}
                          </td>
                        )}

                        {/* Habit name — sticky */}
                        <td className="sticky left-[90px] z-10 bg-white py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-800 whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis">
                          {habit.name}
                        </td>

                        {/* Unit — sticky */}
                        <td className="sticky left-[250px] z-10 bg-white py-2 px-1 border-r border-slate-200 text-center font-medium text-slate-400 italic text-[10px] whitespace-nowrap">
                          {habit.unit_label || habit.unit_type}
                        </td>

                        {/* Day cells */}
                        {columns.map((col) => {
                          const entry = entriesMap[habit.id]?.[col.dateStr];
                          const isWeekend = col.isWeekend;

                          if (habit.unit_type === 'yesno') {
                            const isChecked = entry?.value_bool === true;
                            return (
                              <td
                                key={col.dateStr}
                                onClick={() => handleCellClick(habit, col.dateStr)}
                                className={`border-r border-slate-200 text-center cursor-pointer select-none align-middle transition-all hover:bg-indigo-50/40 w-[38px] min-w-[38px] ${
                                  isWeekend ? 'bg-rose-50/40' : ''
                                }`}
                              >
                                <div className="flex items-center justify-center h-full py-2">
                                  {isChecked && (
                                    <span className="text-emerald-600 font-extrabold text-base select-none">✓</span>
                                  )}
                                </div>
                              </td>
                            );
                          } else {
                            const value = entry?.value_numeric;
                            const displayValue = value !== undefined && value !== null
                              ? habit.unit_type === 'tick' && value === 1
                                ? '✓'
                                : value
                              : '';
                            const isEditing =
                              editingCell?.habitId === habit.id && editingCell?.dateStr === col.dateStr;

                            return (
                              <td
                                key={col.dateStr}
                                onClick={() => {
                                  if (!isEditing) startEditing(habit.id, col.dateStr, value ?? undefined);
                                }}
                                className={`border-r border-slate-200 text-center select-none align-middle cursor-pointer w-[38px] min-w-[38px] ${
                                  isWeekend ? 'bg-rose-50/40' : ''
                                } ${isEditing ? 'bg-indigo-50/60 p-0' : 'font-bold text-indigo-600 py-1'}`}
                              >
                                {isEditing ? (
                                  <input
                                    ref={editInputRef}
                                    type="text"
                                    inputMode="decimal"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={finishEditing}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEditing();
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-full h-8 px-0.5 text-center bg-transparent border-none outline-none font-bold text-indigo-700 text-xs"
                                  />
                                ) : (
                                  <div className="h-full w-full py-1.5 flex items-center justify-center min-h-[24px] text-xs">
                                    {displayValue}
                                  </div>
                                )}
                              </td>
                            );
                          }
                        })}

                        {/* Total — sticky right */}
                        <td className="sticky right-[130px] z-10 bg-slate-50/90 py-2.5 px-2 border-l border-slate-200 text-center font-bold text-slate-800 whitespace-nowrap text-xs">
                          {total}
                        </td>

                        {/* Goal — sticky right */}
                        <td className="sticky right-[65px] z-10 bg-slate-50/90 py-2.5 px-2 border-l border-slate-200 text-center font-medium text-slate-500 whitespace-nowrap text-xs">
                          {goal || '–'}
                        </td>

                        {/* Rate% — sticky right */}
                        <td
                          className={`sticky right-0 z-10 py-2.5 px-2 border-l border-slate-200 text-center font-bold whitespace-nowrap text-xs ${
                            rate >= 100
                              ? 'bg-emerald-50 text-emerald-700'
                              : rate >= 50
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {goal > 0 ? `${rate}%` : '–'}
                        </td>
                      </tr>
                    );
                  });
                })}

              {habits.length === 0 && (
                <tr>
                  <td colSpan={3 + columns.length + 3} className="text-center py-16 text-slate-400 font-medium text-sm">
                    No habits yet. Go to <strong>Settings</strong> to add categories and habits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-medium">
        <div>
          <span className="font-bold text-slate-700">Legend: </span>
          <span className="text-emerald-600 font-bold">✓</span> Use this tick symbol in Settings for tick habits &bull;{' '}
          <span className="text-indigo-600 font-bold">Numbers</span> — click any cell to edit &bull; auto-saved instantly
        </div>
        <div className="text-slate-400 hidden sm:block">
          Category · Habit · Unit columns stay fixed &bull; Scroll ← → to see all dates
        </div>
      </div>
    </div>
  );
}
