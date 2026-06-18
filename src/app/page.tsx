"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, Habit, Entry, UnitType } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogGrid from '@/components/LogGrid';
import Dashboard from '@/components/Dashboard';
import Settings from '@/components/Settings';
import { AlertTriangle } from 'lucide-react';

export default function HomePage() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'log' | 'dashboard' | 'settings'>('log');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>('');
  const [showRlsInfo, setShowRlsInfo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const isSupabaseError = (err: unknown): err is { code?: string } =>
    typeof err === 'object' && err !== null && 'code' in err;

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : fallback;

  const handleRlsError = useCallback((err: unknown) => {
    if (isSupabaseError(err) && err.code === '42501') setShowRlsInfo(true);
  }, []);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: catsData, error: catsErr } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (catsErr) throw catsErr;

      const { data: habsData, error: habsErr } = await supabase
        .from('habits')
        .select('*')
        .order('sort_order');
      if (habsErr) throw habsErr;

      const { data: entsData, error: entsErr } = await supabase
        .from('entries')
        .select('*');
      if (entsErr) throw entsErr;

      setCategories(catsData ?? []);
      setHabits(habsData ?? []);
      setEntries(entsData ?? []);
      setSyncStatus('synced');

      // Show intro popup if user has no data yet
      if ((catsData ?? []).length === 0) {
        setShowIntro(true);
      }
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(getErrorMessage(err, 'Failed to fetch data from Supabase.'));
      handleRlsError(err);
    } finally {
      setLoading(false);
    }
  }, [handleRlsError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Entry Handlers ───────────────────────────────────────────────────────
  const handleSaveEntry = async (
    habitId: string,
    dateStr: string,
    numericVal: number | null,
    boolVal: boolean | null
  ) => {
    const isDelete = numericVal === null && boolVal === null;

    // Optimistic UI update
    setEntries((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex(
        (e) => e.habit_id === habitId && e.entry_date === dateStr
      );
      if (idx > -1) {
        if (isDelete) {
          updated.splice(idx, 1);
        } else {
          updated[idx] = { ...updated[idx], value_numeric: numericVal, value_bool: boolVal };
        }
      } else if (!isDelete) {
        updated.push({ habit_id: habitId, entry_date: dateStr, value_numeric: numericVal, value_bool: boolVal });
      }
      return updated;
    });

    setSyncStatus('syncing');

    try {
      if (isDelete) {
        const { error } = await supabase
          .from('entries')
          .delete()
          .match({ habit_id: habitId, entry_date: dateStr });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('entries')
          .upsert(
            { habit_id: habitId, entry_date: dateStr, value_numeric: numericVal, value_bool: boolVal },
            { onConflict: 'habit_id,entry_date' }
          );
        if (error) throw error;
      }
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error('Save entry error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(getErrorMessage(err, 'Failed to sync entry.'));
      handleRlsError(err);
      // Revert optimistic update
      fetchData();
    }
  };

  // ─── Category Handlers ────────────────────────────────────────────────────
  const handleAddCategory = async (name: string, colorTag: string, sortOrder: number) => {
    try {
      setSyncStatus('syncing');
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, color_tag: colorTag, sort_order: sortOrder }])
        .select();
      if (error) throw error;
      if (data) {
        setCategories((prev) =>
          [...prev, ...data].sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(getErrorMessage(err, 'Error adding category.'));
      handleRlsError(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setHabits((prev) => prev.filter((h) => h.category_id !== id));
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(getErrorMessage(err, 'Error deleting category.'));
    }
  };

  // ─── Habit Handlers ───────────────────────────────────────────────────────
  const handleAddHabit = async (
    categoryId: string,
    name: string,
    unitType: UnitType,
    unitLabel: string,
    monthlyGoal: number,
    sortOrder: number
  ) => {
    try {
      setSyncStatus('syncing');
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            category_id: categoryId,
            name,
            unit_type: unitType,
            unit_label: unitLabel,
            monthly_goal: monthlyGoal,
            sort_order: sortOrder,
          },
        ])
        .select();
      if (error) throw error;
      if (data) {
        setHabits((prev) =>
          [...prev, ...data].sort((a, b) => a.sort_order - b.sort_order)
        );
      }
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(getErrorMessage(err, 'Error adding habit.'));
      handleRlsError(err);
    }
  };

  const handleUpdateHabit = async (
    id: string,
    updates: {
      name: string;
      unit_type: UnitType;
      unit_label: string;
      monthly_goal: number;
      sort_order: number;
    }
  ) => {
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('habits').update(updates).eq('id', id);
      if (error) throw error;
      setHabits((prev) =>
        prev
          .map((h) => (h.id === id ? { ...h, ...updates } : h))
          .sort((a, b) => a.sort_order - b.sort_order)
      );
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(getErrorMessage(err, 'Error updating habit.'));
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setSyncStatus('synced');
    } catch (err: unknown) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(getErrorMessage(err, 'Error deleting habit.'));
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncStatus={syncStatus}
        syncErrorMessage={syncErrorMessage}
        onRetrySync={fetchData}
      />

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Intro popup */}
        {showIntro && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
              <h2 className="text-2xl font-bold mb-3 text-slate-800 dark:text-slate-100">👋 Welcome!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Get started by adding your first category and habit in{' '}
                <strong>Settings</strong>.
              </p>
              <button
                onClick={() => {
                  setShowIntro(false);
                  setActiveTab('settings');
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors"
              >
                Go to Settings
              </button>
              <button
                onClick={() => setShowIntro(false)}
                className="block mx-auto mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* RLS notice banner */}
        {showRlsInfo && (
          <div className="mb-6 bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl shadow-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-bold text-rose-800">
                  Supabase Row Level Security (RLS) Notice
                </h3>
                <div className="mt-1 text-xs text-rose-700 space-y-2">
                  <p>
                    RLS is enabled but no policies are configured for client writes. Run
                    this SQL in your{' '}
                    <strong>Supabase Dashboard → SQL Editor</strong>:
                  </p>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[10px] font-mono leading-relaxed select-all">
{`ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;`}
                  </pre>
                  <p className="font-medium">
                    Then click <strong>Retry Connection</strong> to reconnect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync error alert */}
        {syncStatus === 'error' && !showRlsInfo && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>{syncErrorMessage || 'Sync error. Check your connection or Supabase settings.'}</span>
            </div>
            <button
              onClick={fetchData}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">
              Loading tracker…
            </p>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {activeTab === 'log' && (
              <LogGrid
                categories={categories}
                habits={habits}
                entries={entries}
                onSaveEntry={handleSaveEntry}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            )}
            {activeTab === 'dashboard' && (
              <Dashboard
                categories={categories}
                habits={habits}
                entries={entries}
                selectedDate={selectedDate}
              />
            )}
            {activeTab === 'settings' && (
              <Settings
                categories={categories}
                habits={habits}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddHabit={handleAddHabit}
                onUpdateHabit={handleUpdateHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
