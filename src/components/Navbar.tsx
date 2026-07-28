import React, { useState } from 'react';
import { Mic, FileAudio, History, Sun, Moon, Cloud, Copy, Check, Search, Type, SlidersHorizontal, X } from 'lucide-react';
import { AppMode, FontSize, Theme, CloudUser } from '../types';

interface NavbarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  cloudUser: CloudUser;
  onOpenCloudModal: () => void;
  onCopyAll: () => void;
  copied: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hasCurrentContent: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  setMode,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  cloudUser,
  onOpenCloudModal,
  onCopyAll,
  copied,
  searchQuery,
  setSearchQuery,
}) => {
  const [showTools, setShowTools] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Main Sleek Navbar */}
        <div className="flex items-center justify-between h-13 sm:h-15 gap-2 sm:gap-4">
          
          {/* Brand Logo - Concise & Clean */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold border border-red-500/20 shadow-xs">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap">
              语音转文字
            </span>
          </div>

          {/* Center Mode Switcher - Compact Pill Design */}
          <nav className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
            <button
              id="nav-mode-mic"
              onClick={() => setMode('mic')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                mode === 'mic'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>麦克风</span>
            </button>

            <button
              id="nav-mode-file"
              onClick={() => setMode('file')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                mode === 'file'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <FileAudio className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>文件导入</span>
            </button>

            <button
              id="nav-mode-history"
              onClick={() => setMode('history')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                mode === 'history'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>历史</span>
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Prominent White Capsule Button: 一键复制 */}
            <button
              id="btn-copy-capsule"
              onClick={onCopyAll}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-full bg-white dark:bg-zinc-100 text-zinc-900 hover:bg-zinc-50 dark:hover:bg-white border border-zinc-300 dark:border-zinc-200 shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="一键复制全文"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-semibold hidden xs:inline">已复制</span>
                  <span className="text-emerald-700 font-semibold xs:hidden">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <span>复制</span>
                </>
              )}
            </button>

            {/* Quick Tools Drawer Toggle (Search & Font Size) */}
            <button
              id="btn-toggle-tools"
              onClick={() => setShowTools(!showTools)}
              className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                showTools || searchQuery
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              title="搜索与排版工具"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Cloud Sync Status */}
            <button
              id="btn-cloud-sync"
              onClick={onOpenCloudModal}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                cloudUser.isLoggedIn
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              title={cloudUser.isLoggedIn ? '云端已同步' : '点击开启云端同步'}
            >
              <Cloud className={`w-3.5 h-3.5 ${cloudUser.isLoggedIn ? 'text-emerald-500' : 'text-zinc-400'}`} />
              <span className="hidden md:inline">
                {cloudUser.isLoggedIn ? '云端' : '同步'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              id="btn-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 sm:p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="切换明暗主题"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
            </button>

          </div>

        </div>

        {/* Collapsible Secondary Tools Bar (Search & Font Size) */}
        {(showTools || searchQuery) && (
          <div className="py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
            
            {/* Search Box */}
            <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="global-keyword-search"
                type="text"
                placeholder="搜索文本或关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="px-2 text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <Type className="w-3 h-3" />
                字号
              </span>
              {(['S', 'M', 'L', 'XL'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  id={`btn-fontsize-${size}`}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    fontSize === size
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

          </div>
        )}

      </div>
    </header>
  );
};

