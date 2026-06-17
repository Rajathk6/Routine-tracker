import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <p className="text-sm font-semibold text-slate-300">Personal Habit Tracker</p>
            <p className="text-xs text-slate-500 mt-1">Replace Google Sheets with a lightning-fast custom database application.</p>
          </div>
          
          <div className="flex flex-col items-center space-y-2 md:items-end">
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-900/30 hover:scale-[1.02]"
            >
              <Shield className="h-4 w-4" />
              <span>Built for Digital Heroes</span>
            </a>
            <p className="text-xs text-slate-500 mt-1">
              Rajath Kumar &bull; <a href="mailto:1rajathkumar@gmail.com" className="hover:text-slate-300 transition-colors">1rajathkumar@gmail.com</a>
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800/80 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} Routine Tracker. All rights reserved.</p>
          <p className="text-xs text-slate-600 font-medium mt-2 sm:mt-0">Designed for Productivity & Consistency</p>
        </div>
      </div>
    </footer>
  );
}
