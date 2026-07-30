import React from 'react';
import { Mic, FileAudio, History, Search, X } from 'lucide-react';
import { AppMode, Theme } from '../types';

interface NavbarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  theme?: Theme;
  setTheme?: (theme: Theme) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  setMode,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors pt-3.5 sm:pt-5 pb-2.5">
      <div className="max-w-md w-full mx-auto px-3 space-y-2">
        
        {/* Main Mobile Top Row: Logo, Mode Switcher */}
        <div className="flex items-center justify-between gap-1.5">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold border border-sky-500/20 shadow-xs">
              <Mic className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap">
              语音转文字
            </span>
          </div>

          {/* Center Mode Switcher - Mobile Portrait Pill Design */}
          <nav className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
            <button
              id="nav-mode-mic"
              onClick={() => setMode('mic')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                mode === 'mic'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Mic className="w-3 h-3 text-sky-500 shrink-0" />
              <span>录音</span>
            </button>

            <button
              id="nav-mode-file"
              onClick={() => setMode('file')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                mode === 'file'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <FileAudio className="w-3 h-3 text-blue-500 shrink-0" />
              <span>文件</span>
            </button>

            <button
              id="nav-mode-history"
              onClick={() => setMode('history')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                mode === 'history'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <History className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>历史</span>
            </button>
          </nav>

        </div>

        {/* Search Bar - Directly Displayed */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="global-keyword-search"
            type="text"
            placeholder="搜索文本或关键词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-7 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

