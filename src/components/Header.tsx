import React from 'react';
import { LayoutGrid, BarChart3, Settings as SettingsIcon, Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'log' | 'dashboard' | 'settings';
  setActiveTab: (tab: 'log' | 'dashboard' | 'settings') => void;
  syncStatus: 'synced' | 'syncing' | 'error';
  syncErrorMessage?: string;
  onRetrySync?: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  syncStatus,
  syncErrorMessage,
  onRetrySync
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Routine Tracker</h1>
              <p className="text-xs text-slate-500 font-medium">Personal Habit Dashboard</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'log'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Spreadsheet Log</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* User Profile & Sync Status */}
          <div className="flex items-center space-x-6">
            {/* Sync Indicator */}
            <div className="flex items-center">
              {syncStatus === 'synced' && (
                <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Synced</span>
                </div>
              )}
              {syncStatus === 'syncing' && (
                <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              {syncStatus === 'error' && (
                <button
                  onClick={onRetrySync}
                  title={syncErrorMessage || 'Click to retry'}
                  className="flex items-center space-x-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1 rounded-full text-xs font-semibold border border-rose-200 cursor-pointer transition-colors"
                >
                  <CloudOff className="h-3.5 w-3.5" />
                  <span>Sync Error</span>
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">Rajath Kumar</p>
                <p className="text-xs text-slate-500 font-medium">1rajathkumar@gmail.com</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                R
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
