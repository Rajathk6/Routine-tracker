'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, Habit, Entry, UnitType } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogGrid from '@/components/LogGrid';
import Dashboard from '@/components/Dashboard';
import Settings from '@/components/Settings';
import { AlertTriangle, Info, Terminal } from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'log' | 'dashboard' | 'settings'>('log');
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  
  // Loading and Sync states
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [showRlsInfo, setShowRlsInfo] = useState(false);

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 17)); // Default to June 17, 2026 as per local time context

  // Fetch all data from Supabase
  const fetchData = async () => {
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

      setCategories(catsData || []);
      setHabits(habsData || []);
      setEntries(entsData || []);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Fetch error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Failed to fetch data from Supabase.');
      if (err.code === '42501') {
        setShowRlsInfo(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync / Upsert an entry (optimistic UI update)
  const handleSaveEntry = async (
    habitId: string,
    dateStr: string,
    numericVal: number | null,
    boolVal: boolean | null
  ) => {
    // 1. Optimistic Update (Locally update UI instantly)
    const updatedEntries = [...entries];
    const existingIndex = updatedEntries.findIndex(
      (e) => e.habit_id === habitId && e.entry_date === dateStr
    );

    const isDelete = numericVal === null && boolVal === null;

    if (existingIndex > -1) {
      if (isDelete) {
        updatedEntries.splice(existingIndex, 1);
      } else {
        updatedEntries[existingIndex] = {
          ...updatedEntries[existingIndex],
          value_numeric: numericVal,
          value_bool: boolVal
        };
      }
    } else if (!isDelete) {
      updatedEntries.push({
        habit_id: habitId,
        entry_date: dateStr,
        value_numeric: numericVal,
        value_bool: boolVal
      });
    }

    // Set local state immediately for smooth UI
    setEntries(updatedEntries);
    setSyncStatus('syncing');

    // 2. Perform Supabase operation
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
            {
              habit_id: habitId,
              entry_date: dateStr,
              value_numeric: numericVal,
              value_bool: boolVal
            },
            {
              onConflict: 'habit_id,entry_date'
            }
          );

        if (error) throw error;
      }

      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Failed to sync entry to database.');
      if (err.code === '42501') {
        setShowRlsInfo(true);
      }
      // Revert local state on error
      fetchData();
    }
  };

  // Add Category
  const handleAddCategory = async (name: string, colorTag: string, sortOrder: number) => {
    try {
      setSyncStatus('syncing');
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, color_tag: colorTag, sort_order: sortOrder }])
        .select();

      if (error) throw error;
      if (data) {
        setCategories((prev) => [...prev, ...data].sort((a, b) => a.sort_order - b.sort_order));
      }
      setSyncStatus('synced');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Error adding category.');
      if (err.code === '42501') setShowRlsInfo(true);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setHabits((prev) => prev.filter((h) => h.category_id !== id));
      setSyncStatus('synced');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Error deleting category.');
    }
  };

  // Add Habit
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
        .insert([{
          category_id: categoryId,
          name,
          unit_type: unitType,
          unit_label: unitLabel,
          monthly_goal: monthlyGoal,
          sort_order: sortOrder
        }])
        .select();

      if (error) throw error;
      if (data) {
        setHabits((prev) => [...prev, ...data].sort((a, b) => a.sort_order - b.sort_order));
      }
      setSyncStatus('synced');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Error adding habit.');
      if (err.code === '42501') setShowRlsInfo(true);
    }
  };

  // Update Habit
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
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Error updating habit.');
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (id: string) => {
    try {
      setSyncStatus('syncing');
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;

      setHabits((prev) => prev.filter((h) => h.id !== id));
      setSyncStatus('synced');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Error deleting habit.');
    }
  };

  // Seeder for Default Google Sheet mock data
  const handleSeedDefaultData = async () => {
    setIsSeeding(true);
    setSyncStatus('syncing');
    try {
      // 1. Seed Categories
      const categoriesToSeed = [
        { name: 'JOB', color_tag: 'blue', sort_order: 1 },
        { name: 'HEALTH', color_tag: 'green', sort_order: 2 },
        { name: 'MIND', color_tag: 'yellow', sort_order: 3 }
      ];

      const { data: seededCats, error: catsErr } = await supabase
        .from('categories')
        .insert(categoriesToSeed)
        .select();

      if (catsErr) throw catsErr;
      if (!seededCats) throw new Error('Failed to seed categories.');

      const jobCat = seededCats.find((c) => c.name === 'JOB')!;
      const healthCat = seededCats.find((c) => c.name === 'HEALTH')!;
      const mindCat = seededCats.find((c) => c.name === 'MIND')!;

      // 2. Seed Habits
      const habitsToSeed = [
        // JOB habits
        { category_id: jobCat.id, name: 'DSA Problems', unit_type: 'number', unit_label: 'problems', monthly_goal: 62, sort_order: 1 },
        { category_id: jobCat.id, name: 'Development', unit_type: 'number', unit_label: 'minutes', monthly_goal: 1800, sort_order: 2 },
        { category_id: jobCat.id, name: 'Job Applications', unit_type: 'count', unit_label: 'count', monthly_goal: 300, sort_order: 3 },
        
        // HEALTH habits
        { category_id: healthCat.id, name: 'Jog', unit_type: 'number', unit_label: 'km', monthly_goal: 31, sort_order: 1 },
        { category_id: healthCat.id, name: 'Calisthenics', unit_type: 'yesno', unit_label: 'yes/no', monthly_goal: 31, sort_order: 2 },
        { category_id: healthCat.id, name: 'Walk', unit_type: 'number', unit_label: 'steps', monthly_goal: 248000, sort_order: 3 },
        { category_id: healthCat.id, name: 'Sleep 11-7', unit_type: 'yesno', unit_label: 'yes/no', monthly_goal: 31, sort_order: 4 },
        { category_id: healthCat.id, name: 'No Screen Rule', unit_type: 'yesno', unit_label: 'yes/no', monthly_goal: 31, sort_order: 5 },
        
        // MIND habits
        { category_id: mindCat.id, name: 'Books', unit_type: 'pages', unit_label: 'pages', monthly_goal: 310, sort_order: 1 },
        { category_id: mindCat.id, name: 'Flute', unit_type: 'number', unit_label: 'minutes', monthly_goal: 930, sort_order: 2 },
        { category_id: mindCat.id, name: 'Sketching', unit_type: 'number', unit_label: 'minutes', monthly_goal: 930, sort_order: 3 }
      ];

      const { data: seededHabs, error: habsErr } = await supabase
        .from('habits')
        .insert(habitsToSeed)
        .select();

      if (habsErr) throw habsErr;
      if (!seededHabs) throw new Error('Failed to seed habits.');

      // Find individual habit IDs to seed entries
      const devHab = seededHabs.find((h) => h.name === 'Development')!;
      const jobAppsHab = seededHabs.find((h) => h.name === 'Job Applications')!;
      const jogHab = seededHabs.find((h) => h.name === 'Jog')!;
      const calisHab = seededHabs.find((h) => h.name === 'Calisthenics')!;
      const walkHab = seededHabs.find((h) => h.name === 'Walk')!;
      const sleepHab = seededHabs.find((h) => h.name === 'Sleep 11-7')!;
      const screenHab = seededHabs.find((h) => h.name === 'No Screen Rule')!;
      const booksHab = seededHabs.find((h) => h.name === 'Books')!;
      const fluteHab = seededHabs.find((h) => h.name === 'Flute')!;
      const sketchHab = seededHabs.find((h) => h.name === 'Sketching')!;

      // 3. Seed Entries matching June 2026 sheet
      const entriesToSeed: any[] = [];

      // Development (minutes)
      const devLogs = { 1: 70, 2: 60, 5: 100, 6: 300, 7: 360, 8: 180, 9: 200, 10: 180, 11: 150, 13: 250, 15: 40 };
      Object.entries(devLogs).forEach(([d, val]) => {
        entriesToSeed.push({
          habit_id: devHab.id,
          entry_date: `2026-06-${d.padStart(2, '0')}`,
          value_numeric: val,
          value_bool: null
        });
      });

      // Job Applications (count)
      const jobAppsLogs = { 1: 10, 2: 5, 3: 3, 4: 1, 5: 10, 6: 5, 7: 5, 8: 10, 9: 10, 10: 10, 12: 2, 14: 10, 15: 6 };
      Object.entries(jobAppsLogs).forEach(([d, val]) => {
        entriesToSeed.push({
          habit_id: jobAppsHab.id,
          entry_date: `2026-06-${d.padStart(2, '0')}`,
          value_numeric: val,
          value_bool: null
        });
      });

      // Jog (km)
      const jogLogs = { 1: 1.58, 2: 5.12, 3: 2.22, 4: 2.12, 5: 3.01, 6: 4.51, 9: 4.19, 11: 3.12, 14: 4 };
      Object.entries(jogLogs).forEach(([d, val]) => {
        entriesToSeed.push({
          habit_id: jogHab.id,
          entry_date: `2026-06-${d.padStart(2, '0')}`,
          value_numeric: val,
          value_bool: null
        });
      });

      // Calisthenics (yesno)
      const calisDays = [3, 4, 8, 9, 10, 11, 14];
      calisDays.forEach((d) => {
        entriesToSeed.push({
          habit_id: calisHab.id,
          entry_date: `2026-06-${String(d).padStart(2, '0')}`,
          value_numeric: null,
          value_bool: true
        });
      });

      // Walk (steps)
      const walkLogs = { 1: 7572, 2: 11495, 3: 6608, 4: 14445, 5: 9077, 6: 9354, 7: 3547, 8: 3897, 9: 9952, 10: 3622, 11: 6329, 12: 12780, 13: 2002 };
      Object.entries(walkLogs).forEach(([d, val]) => {
        entriesToSeed.push({
          habit_id: walkHab.id,
          entry_date: `2026-06-${d.padStart(2, '0')}`,
          value_numeric: val,
          value_bool: null
        });
      });

      // Sleep 11-7 (yesno)
      const sleepDays = [2, 3, 4, 8, 9, 10, 11, 12];
      sleepDays.forEach((d) => {
        entriesToSeed.push({
          habit_id: sleepHab.id,
          entry_date: `2026-06-${String(d).padStart(2, '0')}`,
          value_numeric: null,
          value_bool: true
        });
      });

      // No Screen Rule (yesno)
      const screenDays = [2, 3, 4, 8, 9, 10, 11, 12];
      screenDays.forEach((d) => {
        entriesToSeed.push({
          habit_id: screenHab.id,
          entry_date: `2026-06-${String(d).padStart(2, '0')}`,
          value_numeric: null,
          value_bool: true
        });
      });

      // Books (pages)
      entriesToSeed.push({
        habit_id: booksHab.id,
        entry_date: '2026-06-02',
        value_numeric: 8,
        value_bool: null
      });

      // Flute (minutes)
      const fluteLogs = { 1: 30, 2: 20, 3: 10, 4: 0, 5: 15, 8: 30, 9: 20, 10: 40, 11: 20, 14: 20, 15: 40 };
      Object.entries(fluteLogs).forEach(([d, val]) => {
        entriesToSeed.push({
          habit_id: fluteHab.id,
          entry_date: `2026-06-${d.padStart(2, '0')}`,
          value_numeric: val,
          value_bool: null
        });
      });

      // Sketching (minutes)
      const sketchLogs = { 1: 50, 2: 25, 3: 25, 4: 0, 5: 0, 8: 80, 9: 60 };
      Object.entries(sketchLogs).forEach(([d, val]) => {
        entriesToSeed.push({
          habit_id: sketchHab.id,
          entry_date: `2026-06-${d.padStart(2, '0')}`,
          value_numeric: val,
          value_bool: null
        });
      });

      // Insert all entries in chunks to avoid single large request limitations
      const { error: entsErr } = await supabase.from('entries').insert(entriesToSeed);
      if (entsErr) throw entsErr;

      // Re-fetch all data to load onto grid
      await fetchData();
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Seeding error:', err);
      setSyncStatus('error');
      setSyncErrorMessage(err.message || 'Error seeding default data.');
      if (err.code === '42501') {
        setShowRlsInfo(true);
      }
    } finally {
      setIsSeeding(false);
    }
  };

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

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* RLS Policy Notice Banner */}
        {showRlsInfo && (
          <div className="mb-6 bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-rose-800">Supabase Row Level Security (RLS) Notice</h3>
                <div className="mt-1 text-xs text-rose-700 space-y-2">
                  <p>
                    Your database has RLS enabled but does not have policies configured to allow client-side writes. 
                    To enable saving logs and custom fields, please copy and paste the following SQL into the 
                    <strong className="font-bold"> SQL Editor</strong> in your Supabase Dashboard:
                  </p>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[10px] font-mono leading-relaxed select-all">
{`-- Disable RLS on tables to allow anonymous client log writes
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;`}
                  </pre>
                  <p className="font-medium">
                    After running the SQL, click the <strong>Sync Error</strong> status indicator at the top right to retry connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Error Indicator Alert */}
        {syncStatus === 'error' && !showRlsInfo && (
          <div className="mb-6 bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>{syncErrorMessage || 'Sync error. Check your connection or Supabase settings.'}</span>
            </div>
            <button
              onClick={fetchData}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">Loading tracker database...</p>
          </div>
        ) : (
          /* Render Active View Tab */
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
                onSeedDefaultData={handleSeedDefaultData}
                isSeeding={isSeeding}
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
