import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MicRecorder } from './components/MicRecorder';
import { FileImporter } from './components/FileImporter';
import { HistoryView } from './components/HistoryView';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AppMode, FontSize, Theme, CloudUser, TranscriptionRecord, ExportFormat } from './types';
import { getAllRecords, saveAllRecords, saveAudioBlob, deleteAudioBlob, clearAllDatabase } from './utils/db';
import { exportTranscription } from './utils/export';
import { FileText, Download, Sparkles, Copy, Check, Trash2, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<AppMode>('mic');
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('M');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  // Current editable text in workspace
  const [currentText, setCurrentText] = useState<string>('');
  const [records, setRecords] = useState<TranscriptionRecord[]>([]);

  // Cloud account state
  const [cloudUser, setCloudUser] = useState<CloudUser>({
    email: '',
    isLoggedIn: false,
  });

  // Apply dark mode class to root HTML
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load records from IndexedDB on initial mount
  useEffect(() => {
    async function loadData() {
      try {
        const stored = await getAllRecords();
        setRecords(stored);
      } catch (err) {
        console.error('Failed to load IndexedDB records:', err);
      }
    }
    loadData();
  }, []);

  // Sync records to IndexedDB
  const handleSaveRecord = async (newRecord: TranscriptionRecord, audioBlob: Blob | null) => {
    try {
      if (audioBlob) {
        await saveAudioBlob(newRecord.id, audioBlob);
      }
      const updated = [newRecord, ...records];
      setRecords(updated);
      await saveAllRecords(updated);
    } catch (err) {
      console.error('Error saving record:', err);
    }
  };

  // Delete individual record
  const handleDeleteRecord = async (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    await saveAllRecords(updated);
    await deleteAudioBlob(id);
  };

  // Update title of a record
  const handleUpdateRecordTitle = async (id: string, newTitle: string) => {
    const updated = records.map((r) => (r.id === id ? { ...r, title: newTitle } : r));
    setRecords(updated);
    await saveAllRecords(updated);
  };

  // Clear all records
  const handleClearAllRecords = async () => {
    setRecords([]);
    setCurrentText('');
    await clearAllDatabase();
  };

  // Load record from history into live editor
  const handleLoadRecordToEditor = (record: TranscriptionRecord) => {
    setCurrentText(record.text);
    setMode(record.mode);
  };

  // One-click copy full text
  const handleCopyAll = () => {
    if (!currentText.trim()) return;
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export current workspace text
  const handleExportCurrent = (format: ExportFormat) => {
    if (!currentText.trim()) return;
    const tempRecord: TranscriptionRecord = {
      id: 'current-' + Date.now(),
      title: '转写文本导出',
      text: currentText,
      duration: 0,
      language: 'zh-CN',
      createdAt: Date.now(),
      mode: mode === 'history' ? 'mic' : mode,
    };
    exportTranscription(tempRecord, format);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 flex flex-col">
      
      {/* Top Navigation */}
      <Navbar
        mode={mode}
        setMode={setMode}
        theme={theme}
        setTheme={setTheme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Container - Optimized for Mobile Portrait View */}
      <main className="flex-1 max-w-md w-full mx-auto px-3 py-4 sm:py-6 space-y-4">
        
        {/* Workspace Toolbar: Export & Quick Actions */}
        {currentText.trim() && mode !== 'history' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5 animate-fade-in">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                字数统计: {currentText.length} 字
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">导出:</span>
              <button
                id="btn-export-current-txt"
                onClick={() => handleExportCurrent('txt')}
                className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                .TXT
              </button>
              <button
                id="btn-export-current-md"
                onClick={() => handleExportCurrent('md')}
                className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                .MD
              </button>
              <button
                id="btn-export-current-json"
                onClick={() => handleExportCurrent('json')}
                className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                .JSON
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Mode Content */}
        {mode === 'mic' && (
          <MicRecorder
            fontSize={fontSize}
            setFontSize={setFontSize}
            searchQuery={searchQuery}
            onSaveRecord={handleSaveRecord}
            currentText={currentText}
            setCurrentText={setCurrentText}
            onCopyAll={handleCopyAll}
            copied={copied}
          />
        )}

        {mode === 'file' && (
          <FileImporter
            fontSize={fontSize}
            setFontSize={setFontSize}
            onSaveRecord={handleSaveRecord}
            currentText={currentText}
            setCurrentText={setCurrentText}
            onCopyAll={handleCopyAll}
            copied={copied}
          />
        )}

        {mode === 'history' && (
          <HistoryView
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onUpdateRecordTitle={handleUpdateRecordTitle}
            onClearAllRecords={handleClearAllRecords}
            onLoadRecordToEditor={handleLoadRecordToEditor}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onExportRecord={exportTranscription}
          />
        )}

      </main>

      {/* Cloud Account Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        cloudUser={cloudUser}
        setCloudUser={setCloudUser}
        records={records}
        onSetRecords={setRecords}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 py-4 text-center text-xs text-zinc-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 语音转文字 Pro · 多语言高精准实时转写引擎</span>
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-red-500" />
            支持中/英/法/混合语言 · 自动停顿断句 · 边听边记双重保存
          </span>
        </div>
      </footer>

    </div>
  );
}
