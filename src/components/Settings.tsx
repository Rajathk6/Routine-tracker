import React, { useState } from 'react';
import { Category, Habit, UnitType } from '@/types';
import { Plus, Trash2, Edit2, RotateCcw, AlertTriangle, Database } from 'lucide-react';

interface SettingsProps {
  categories: Category[];
  habits: Habit[];
  onAddCategory: (name: string, colorTag: string, sortOrder: number) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddHabit: (
    categoryId: string,
    name: string,
    unitType: UnitType,
    unitLabel: string,
    monthlyGoal: number,
    sortOrder: number
  ) => Promise<void>;
  onUpdateHabit: (
    id: string,
    updates: {
      name: string;
      unit_type: UnitType;
      unit_label: string;
      monthly_goal: number;
      sort_order: number;
    }
  ) => Promise<void>;
  onDeleteHabit: (id: string) => Promise<void>;
  onSeedDefaultData: () => Promise<void>;
  isSeeding: boolean;
}

export default function Settings({
  categories,
  habits,
  onAddCategory,
  onDeleteCategory,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onSeedDefaultData,
  isSeeding
}: SettingsProps) {
  // Category Form State
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('blue');
  const [catSortOrder, setCatSortOrder] = useState('0');

  // Habit Form State
  const [habCategoryId, setHabCategoryId] = useState('');
  const [habName, setHabName] = useState('');
  const [habUnitType, setHabUnitType] = useState<UnitType>('number');
  const [habUnitLabel, setHabUnitLabel] = useState('');
  const [habMonthlyGoal, setHabMonthlyGoal] = useState('');
  const [habSortOrder, setHabSortOrder] = useState('0');

  // Editing Habit State
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabName, setEditHabName] = useState('');
  const [editHabUnitType, setEditHabUnitType] = useState<UnitType>('number');
  const [editHabUnitLabel, setEditHabUnitLabel] = useState('');
  const [editHabMonthlyGoal, setEditHabMonthlyGoal] = useState('');
  const [editHabSortOrder, setEditHabSortOrder] = useState('0');

  // Set default category in habit form if categories load
  React.useEffect(() => {
    if (categories.length > 0 && !habCategoryId) {
      setHabCategoryId(categories[0].id);
    }
  }, [categories, habCategoryId]);

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await onAddCategory(catName.trim(), catColor, Number(catSortOrder) || 0);
    setCatName('');
    setCatColor('blue');
    setCatSortOrder('0');
  };

  const handleAddHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habName.trim() || !habCategoryId) return;
    await onAddHabit(
      habCategoryId,
      habName.trim(),
      habUnitType,
      habUnitLabel.trim() || (habUnitType === 'yesno' ? 'yesno' : ''),
      Number(habMonthlyGoal) || 0,
      Number(habSortOrder) || 0
    );
    setHabName('');
    setHabUnitLabel('');
    setHabMonthlyGoal('');
    setHabSortOrder('0');
  };

  const startEditingHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditHabName(habit.name);
    setEditHabUnitType(habit.unit_type);
    setEditHabUnitLabel(habit.unit_label || '');
    setEditHabMonthlyGoal(String(habit.monthly_goal));
    setEditHabSortOrder(String(habit.sort_order));
  };

  const handleSaveEditHabit = async (id: string) => {
    if (!editHabName.trim()) return;
    await onUpdateHabit(id, {
      name: editHabName.trim(),
      unit_type: editHabUnitType,
      unit_label: editHabUnitLabel.trim() || (editHabUnitType === 'yesno' ? 'yesno' : ''),
      monthly_goal: Number(editHabMonthlyGoal) || 0,
      sort_order: Number(editHabSortOrder) || 0
    });
    setEditingHabitId(null);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* DB Utility Panel */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl mt-1">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-wide text-slate-100">Starter Database Seeding</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Pre-populate the empty Supabase tables with the standard categories, habits, goals, and logged history
              for June 2026 matching the screenshot sheet values.
            </p>
          </div>
        </div>
        <button
          onClick={onSeedDefaultData}
          disabled={isSeeding || habits.length > 0}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow ${
            habits.length > 0
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40 hover:scale-[1.02]'
          }`}
        >
          <RotateCcw className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Seeding...' : habits.length > 0 ? 'DB already has data' : 'Seed Default Data'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Habit Manager (Left, 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Habit Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              <span>Add Custom Habit</span>
            </h3>
            {categories.length === 0 ? (
              <p className="text-xs text-rose-500 font-semibold">Please create at least one category first.</p>
            ) : (
              <form onSubmit={handleAddHabitSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    value={habCategoryId}
                    onChange={(e) => setHabCategoryId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Habit Name */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flute Practice"
                    value={habName}
                    onChange={(e) => setHabName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Unit Type */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Unit Type
                  </label>
                  <select
                    value={habUnitType}
                    onChange={(e) => setHabUnitType(e.target.value as UnitType)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="yesno">Yes/No Checkbox</option>
                    <option value="number">Number input</option>
                    <option value="count">Count (tally)</option>
                    <option value="pages">Pages log</option>
                  </select>
                </div>

                {/* Unit Label */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Unit Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. minutes, km, steps"
                    disabled={habUnitType === 'yesno'}
                    value={habUnitType === 'yesno' ? 'yes/no' : habUnitLabel}
                    onChange={(e) => setHabUnitLabel(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                {/* Monthly Goal */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Monthly Target Goal
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1800, 30, 310"
                    value={habMonthlyGoal}
                    onChange={(e) => setHabMonthlyGoal(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={habSortOrder}
                    onChange={(e) => setHabSortOrder(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3 flex justify-end mt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow shadow-indigo-200 transition-all hover:scale-[1.02]"
                  >
                    Add Habit
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* List of Habits grouped by Category */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Existing Habits Setup
            </h3>

            {habits.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No habits created yet.</p>
            ) : (
              <div className="space-y-6">
                {categories.map((cat) => {
                  const catHabits = habits
                    .filter((h) => h.category_id === cat.id)
                    .sort((a, b) => a.sort_order - b.sort_order);

                  if (catHabits.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-2.5">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            cat.color_tag === 'blue'
                              ? 'bg-blue-500'
                              : cat.color_tag === 'green'
                              ? 'bg-emerald-500'
                              : cat.color_tag === 'yellow' || cat.color_tag === 'orange'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{cat.name}</span>
                      </h4>

                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
                        {catHabits.map((habit) => {
                          const isEditing = editingHabitId === habit.id;

                          return (
                            <div
                              key={habit.id}
                              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 gap-3 hover:bg-slate-50 transition-colors"
                            >
                              {isEditing ? (
                                /* Inline Edit Form */
                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                  <input
                                    type="text"
                                    value={editHabName}
                                    onChange={(e) => setEditHabName(e.target.value)}
                                    className="text-xs border border-slate-200 px-2 py-1.5 rounded-lg outline-none bg-white font-semibold"
                                  />
                                  <select
                                    value={editHabUnitType}
                                    onChange={(e) => setEditHabUnitType(e.target.value as UnitType)}
                                    className="text-xs border border-slate-200 px-2 py-1.5 rounded-lg outline-none bg-white cursor-pointer"
                                  >
                                    <option value="yesno">yesno</option>
                                    <option value="number">number</option>
                                    <option value="count">count</option>
                                    <option value="pages">pages</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={editHabUnitType === 'yesno' ? 'yesno' : editHabUnitLabel}
                                    onChange={(e) => setEditHabUnitLabel(e.target.value)}
                                    disabled={editHabUnitType === 'yesno'}
                                    className="text-xs border border-slate-200 px-2 py-1.5 rounded-lg outline-none bg-white disabled:bg-slate-100"
                                  />
                                  <input
                                    type="number"
                                    value={editHabMonthlyGoal}
                                    onChange={(e) => setEditHabMonthlyGoal(e.target.value)}
                                    className="text-xs border border-slate-200 px-2 py-1.5 rounded-lg outline-none bg-white"
                                    placeholder="Goal"
                                  />
                                  <div className="flex items-center space-x-1.5 justify-end">
                                    <button
                                      onClick={() => handleSaveEditHabit(habit.id)}
                                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingHabitId(null)}
                                      className="px-2.5 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Read Only Display */
                                <>
                                  <div>
                                    <p className="font-bold text-slate-800 text-sm">{habit.name}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                      Unit: <span className="text-slate-600">{habit.unit_label || habit.unit_type}</span> &bull;{' '}
                                      Goal: <span className="text-slate-600">{habit.monthly_goal}</span> &bull;{' '}
                                      Order: <span className="text-slate-600">{habit.sort_order}</span>
                                    </p>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={() => startEditingHabit(habit)}
                                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to delete "${habit.name}"? All associated log history will be permanently deleted!`)) {
                                          onDeleteHabit(habit.id);
                                        }
                                      }}
                                      className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Category Manager (Right, 1 col) */}
        <div className="space-y-6">
          {/* Add Category Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              <span>Add Category</span>
            </h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WORK, LEISURE"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Color Tag */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Color Theme
                </label>
                <select
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="blue">Blue (JOB)</option>
                  <option value="green">Green (HEALTH)</option>
                  <option value="yellow">Yellow (MIND)</option>
                  <option value="purple">Purple</option>
                  <option value="rose">Rose</option>
                  <option value="indigo">Indigo</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow shadow-indigo-200 transition-all hover:scale-[1.02]"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>

          {/* List Categories */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Categories List
            </h3>

            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-4">No categories created yet.</p>
            ) : (
              <div className="space-y-2">
                {categories
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`h-3 w-3 rounded-full ${
                            cat.color_tag === 'blue'
                              ? 'bg-blue-500'
                              : cat.color_tag === 'green'
                              ? 'bg-emerald-500'
                              : cat.color_tag === 'yellow' || cat.color_tag === 'orange'
                              ? 'bg-amber-500'
                              : cat.color_tag === 'purple'
                              ? 'bg-purple-500'
                              : cat.color_tag === 'rose'
                              ? 'bg-rose-500'
                              : cat.color_tag === 'indigo'
                              ? 'bg-indigo-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span className="font-bold text-slate-700 text-xs uppercase">{cat.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">(Order: {cat.sort_order})</span>
                      </div>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete Category "${cat.name}"? This will delete ALL habits and ALL log entries in this category!`
                            )
                          ) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="p-1 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
