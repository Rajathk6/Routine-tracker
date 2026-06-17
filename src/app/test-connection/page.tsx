'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestConnectionPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    categories: { data: any; error: any };
    habits: { data: any; error: any };
    entries: { data: any; error: any };
  }>({
    categories: { data: null, error: null },
    habits: { data: null, error: null },
    entries: { data: null, error: null },
  });

  useEffect(() => {
    async function testDB() {
      const categoriesRes = await supabase.from('categories').select('*');
      const habitsRes = await supabase.from('habits').select('*');
      const entriesRes = await supabase.from('entries').select('*');

      setResults({
        categories: { data: categoriesRes.data, error: categoriesRes.error },
        habits: { data: habitsRes.data, error: habitsRes.error },
        entries: { data: entriesRes.data, error: entriesRes.error },
      });
      setLoading(false);
    }

    testDB();
  }, []);

  if (loading) {
    return <div className="p-8 text-white font-mono bg-slate-900 min-h-screen">Loading database test...</div>;
  }

  return (
    <div className="p-8 font-mono bg-slate-900 text-slate-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-emerald-400">Supabase Connection Test</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold border-b border-slate-700 pb-2 mb-2 text-blue-400">Categories Table</h2>
          {results.categories.error ? (
            <p className="text-rose-400">Error: {results.categories.error.message}</p>
          ) : (
            <pre className="bg-slate-950 p-4 rounded overflow-auto max-h-48 text-xs text-emerald-300">
              {JSON.stringify(results.categories.data, null, 2)}
            </pre>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold border-b border-slate-700 pb-2 mb-2 text-blue-400">Habits Table</h2>
          {results.habits.error ? (
            <p className="text-rose-400">Error: {results.habits.error.message}</p>
          ) : (
            <pre className="bg-slate-950 p-4 rounded overflow-auto max-h-48 text-xs text-emerald-300">
              {JSON.stringify(results.habits.data, null, 2)}
            </pre>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold border-b border-slate-700 pb-2 mb-2 text-blue-400">Entries Table</h2>
          {results.entries.error ? (
            <p className="text-rose-400">Error: {results.entries.error.message}</p>
          ) : (
            <pre className="bg-slate-950 p-4 rounded overflow-auto max-h-48 text-xs text-emerald-300">
              {JSON.stringify(results.entries.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
