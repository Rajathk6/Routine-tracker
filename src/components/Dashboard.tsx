import React, { useState, useMemo } from 'react';
import { Category, Habit, Entry } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { Award, CheckCircle2, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  categories: Category[];
  habits: Habit[];
  entries: Entry[];
  selectedDate: Date;
}

export default function Dashboard({ categories, habits, entries, selectedDate }: DashboardProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');

  // 1. Get current month dates
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get date strings for all days in the current selected month
  const currentMonthDateStrings = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    return dates;
  }, [currentYear, currentMonth]);

  // Create lookup maps for fast access
  const entriesMap = useMemo(() => {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.habit_id]) {
        acc[entry.habit_id] = {};
      }
      acc[entry.habit_id][entry.entry_date] = entry;
      return acc;
    }, {} as Record<string, Record<string, Entry>>);
  }, [entries]);

  // 2. Calculations: Stats for each habit
  const habitStats = useMemo(() => {
    return habits.map((habit) => {
      const habitEntries = entriesMap[habit.id] || {};
      let total = 0;

      currentMonthDateStrings.forEach((dateStr) => {
        const entry = habitEntries[dateStr];
        if (entry) {
          if (habit.unit_type === 'yesno') {
            if (entry.value_bool) total += 1;
          } else {
            total += entry.value_numeric || 0;
          }
        }
      });

      total = Math.round(total * 100) / 100;
      const goal = habit.monthly_goal || 0;
      const rate = goal > 0 ? (total / goal) * 100 : 0;

      return {
        ...habit,
        total,
        goal,
        rate: Math.min(Math.round(rate * 10) / 10, 1000) // cap logical displays, keep accuracy
      };
    });
  }, [habits, entriesMap, currentMonthDateStrings]);

  // Set default selected habit if not set
  useMemo(() => {
    if (habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits, selectedHabitId]);

  // 3. Category Completion Averages
  const categoryData = useMemo(() => {
    return categories.map((cat) => {
      const catHabits = habitStats.filter((h) => h.category_id === cat.id);
      if (catHabits.length === 0) return { name: cat.name, color_tag: cat.color_tag, rate: 0 };

      const totalRate = catHabits.reduce((sum, h) => sum + h.rate, 0);
      const avgRate = Math.round(totalRate / catHabits.length);

      return {
        name: cat.name,
        color_tag: cat.color_tag,
        rate: avgRate
      };
    });
  }, [categories, habitStats]);

  // 4. Overall Completion Rate
  const overallStats = useMemo(() => {
    if (habitStats.length === 0) return { rate: 0, completed: 0, total: 0 };
    const validGoalsCount = habitStats.filter((h) => h.goal > 0).length;
    if (validGoalsCount === 0) return { rate: 0, completed: 0, total: 0 };

    const totalRateSum = habitStats.reduce((sum, h) => sum + h.rate, 0);
    const avgRate = Math.round(totalRateSum / habitStats.length);

    // Count habits meeting or exceeding goal
    const completedHabitsCount = habitStats.filter((h) => h.total >= h.goal && h.goal > 0).length;

    return {
      rate: avgRate,
      completed: completedHabitsCount,
      total: validGoalsCount
    };
  }, [habitStats]);

  // 5. Selected Habit Daily Progress Trend Data
  const trendData = useMemo(() => {
    if (!selectedHabitId) return [];
    const habit = habits.find((h) => h.id === selectedHabitId);
    if (!habit) return [];

    const habitEntries = entriesMap[selectedHabitId] || {};
    let cumulative = 0;

    return currentMonthDateStrings.map((dateStr) => {
      const entry = habitEntries[dateStr];
      const dayNum = Number(dateStr.split('-')[2]);
      let value = 0;

      if (entry) {
        if (habit.unit_type === 'yesno') {
          value = entry.value_bool ? 1 : 0;
        } else {
          value = entry.value_numeric || 0;
        }
      }

      cumulative += value;

      return {
        day: dayNum,
        dateStr,
        value,
        cumulative: Math.round(cumulative * 100) / 100
      };
    });
  }, [selectedHabitId, habits, entriesMap, currentMonthDateStrings]);

  const selectedHabit = habits.find((h) => h.id === selectedHabitId);

  // Helper colors
  const getCategoryColor = (tag?: string) => {
    switch (tag?.toLowerCase()) {
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'yellow':
      case 'orange': return '#f59e0b';
      case 'purple': return '#8b5cf6';
      case 'rose':
      case 'red': return '#f43f5e';
      default: return '#64748b';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Monthly Rollup Analysis</h2>
          <p className="text-xs text-slate-500 font-medium">Aggregated data visualization for {monthName}</p>
        </div>
        <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
          {monthName}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Overall Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Completion</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{overallStats.rate}%</h3>
            <p className="text-xs text-slate-500 mt-0.5">Average across all habits</p>
          </div>
        </div>

        {/* Goals Met */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Goals Achieved</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {overallStats.completed} / {overallStats.total}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Habits hitting 100%+ goals</p>
          </div>
        </div>

        {/* Active Habits count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Habits Tracked</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{habits.length}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Active custom habits</p>
          </div>
        </div>

        {/* Top Performing Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Best Category</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {categoryData.length > 0
                ? categoryData.reduce((prev, current) => (prev.rate > current.rate ? prev : current)).name
                : 'None'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Highest average progress</p>
          </div>
        </div>
      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Completion Bar Chart */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Category Completion</h3>
          <div className="flex-1 min-h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} stroke="#94a3b8" fontSize={11} fontWeight={600} />
                  <YAxis domain={[0, 100]} tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-md border border-slate-800 text-xs font-semibold">
                            <p className="font-bold text-indigo-300">{payload[0].name}</p>
                            <p className="mt-0.5">Average: {payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="rate" radius={[8, 8, 0, 0]} barSize={45}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.color_tag)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
                No categories found. Build habits first.
              </div>
            )}
          </div>
        </div>

        {/* Selected Habit Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Habit Trend Line</h3>
            
            {/* Habit Dropdown */}
            {habits.length > 0 && (
              <select
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name} ({habit.unit_label || habit.unit_type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex-1 min-h-[300px]">
            {selectedHabitId && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" name="Day" tickLine={false} stroke="#94a3b8" fontSize={10} />
                  <YAxis tickLine={false} stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-md border border-slate-800 text-xs font-semibold">
                            <p className="font-bold text-indigo-300">
                              Day {payload[0].payload.day} ({selectedDate.toLocaleString('en-US', { month: 'short' })})
                            </p>
                            <p className="mt-1">
                              Logged: {payload[0].payload.value} {selectedHabit?.unit_label || ''}
                            </p>
                            <p className="text-emerald-400 font-bold mt-0.5">
                              Cumulative: {payload[0].payload.cumulative} / {selectedHabit?.monthly_goal || 0}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Daily Log"
                    stroke="#a5b4fc"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative Sum"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
                Select a habit from the settings to analyze progress trend.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
