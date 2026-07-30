import React, { useState } from 'react';
import { History, Trash2, Play, Download, Search, Cloud, Copy, Check, Calendar, Clock, Mic, FileAudio, Filter, Globe, Edit2, Save, X } from 'lucide-react';
import { TranscriptionRecord, ExportFormat, LanguageCode } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface HistoryViewProps {
  records: TranscriptionRecord[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecordTitle?: (id: string, newTitle: string) => void;
  onClearAllRecords: () => void;
  onLoadRecordToEditor: (record: TranscriptionRecord) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExportRecord: (record: TranscriptionRecord, format: ExportFormat) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onDeleteRecord,
  onUpdateRecordTitle,
  onClearAllRecords,
  onLoadRecordToEditor,
  searchQuery,
  setSearchQuery,
  onExportRecord,
}) => {
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<'all' | LanguageCode>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  // Language count badge calculation
  const counts = {
    all: records.length,
    'zh-CN': records.filter((r) => r.language === 'zh-CN').length,
    'en-US': records.filter((r) => r.language === 'en-US').length,
    'fr-FR': records.filter((r) => r.language === 'fr-FR').length,
  };

  // Filter records by language and search query
  const filteredRecords = records.filter((rec) => {
    // Language filter
    if (selectedLanguageFilter !== 'all') {
      if (rec.language !== selectedLanguageFilter) return false;
    }
    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return rec.title.toLowerCase().includes(q) || rec.text.toLowerCase().includes(q);
  });

  const handleStartEditTitle = (record: TranscriptionRecord) => {
    setEditingId(record.id);
    setEditingTitle(record.title);
  };

  const handleSaveTitle = (id: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed && onUpdateRecordTitle) {
      onUpdateRecordTitle(id, trimmed);
    }
    setEditingId(null);
  };

  const handleCopyRecordText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
      .getDate()
      .toString()
      .padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // Helper to render distinct language badges
  const renderLanguageBadge = (langCode: string) => {
    switch (langCode) {
      case 'zh-CN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
            🇨🇳 中文普通话
          </span>
        );
      case 'en-US':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
            🇺🇸 English
          </span>
        );
      case 'fr-FR':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
            🇫🇷 Français
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700">
            🌐 {langCode}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* History Header & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-all space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500 shrink-0" />
              转写历史记录 ({records.length} 条记录)
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              区分语言清晰归档，点击随时在线重听、查看或重新载入编辑
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Keyword Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="history-search-input"
                type="text"
                placeholder="搜索内容或标题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* One-click Clear All Button */}
            {records.length > 0 && (
              <button
                id="btn-clear-all-history"
                onClick={() => setShowClearConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">一键清空</span>
              </button>
            )}
          </div>
        </div>

        {/* Language Filter Tabs (中文 / 英语 / 法语) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-zinc-400" />
            语言筛选:
          </span>

          <button
            id="filter-lang-all"
            onClick={() => setSelectedLanguageFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedLanguageFilter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>全部记录</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-zinc-200/60 dark:bg-zinc-700/60">
              {counts.all}
            </span>
          </button>

          <button
            id="filter-lang-zh"
            onClick={() => setSelectedLanguageFilter('zh-CN')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedLanguageFilter === 'zh-CN'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>🇨🇳 中文</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/10 dark:bg-white/10">
              {counts['zh-CN']}
            </span>
          </button>

          <button
            id="filter-lang-en"
            onClick={() => setSelectedLanguageFilter('en-US')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedLanguageFilter === 'en-US'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>🇺🇸 英语</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/10 dark:bg-white/10">
              {counts['en-US']}
            </span>
          </button>

          <button
            id="filter-lang-fr"
            onClick={() => setSelectedLanguageFilter('fr-FR')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedLanguageFilter === 'fr-FR'
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>🇫🇷 法语</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-black/10 dark:bg-white/10">
              {counts['fr-FR']}
            </span>
          </button>
        </div>

      </div>

      {/* History List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 sm:p-12 text-center border border-zinc-200 dark:border-zinc-800">
          <History className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {searchQuery || selectedLanguageFilter !== 'all'
              ? '未找到符合条件的转写历史记录'
              : '暂无语音转写历史记录'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            切换至“麦克风”或“文件导入”模式进行语音实时转换吧！
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              {/* Record Metadata Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg text-xs shrink-0 ${
                    record.mode === 'mic'
                      ? 'bg-red-50 dark:bg-red-950 text-red-600'
                      : 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                  }`}>
                    {record.mode === 'mic' ? <Mic className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {editingId === record.id ? (
                        <div className="flex items-center gap-1.5 my-0.5">
                          <input
                            id={`input-edit-title-${record.id}`}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(record.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="px-2 py-0.5 text-xs sm:text-sm font-bold bg-zinc-100 dark:bg-zinc-800 border border-red-400 dark:border-red-500 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <button
                            id={`btn-save-title-${record.id}`}
                            title="保存标题"
                            onClick={() => handleSaveTitle(record.id)}
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md transition-colors cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-cancel-title-${record.id}`}
                            title="取消"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group">
                          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-[320px]">
                            {record.title}
                          </h3>
                          <button
                            id={`btn-edit-title-${record.id}`}
                            title="重命名标题"
                            onClick={() => handleStartEditTitle(record)}
                            className="p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {renderLanguageBadge(record.language)}
                    </div>
                    
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.createdAt)}
                      </span>
                      {record.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(record.duration / 60)}分{record.duration % 60}秒
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Record Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Load to Main Editor */}
                  <button
                    id={`btn-load-record-${record.id}`}
                    onClick={() => onLoadRecordToEditor(record)}
                    className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    载入编辑
                  </button>

                  {/* Copy Record Text */}
                  <button
                    id={`btn-copy-record-${record.id}`}
                    onClick={() => handleCopyRecordText(record.id, record.text)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="复制此条文字"
                  >
                    {copiedId === record.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Delete Record */}
                  <button
                    id={`btn-delete-record-${record.id}`}
                    onClick={() => onDeleteRecord(record.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                    title="删除此记录"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Snippet */}
              <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-50/70 dark:bg-zinc-800/50 p-3 sm:p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 font-sans leading-relaxed whitespace-pre-wrap">
                {record.text}
              </div>

              {/* Audio Playback Toggle or Embedded Player */}
              {record.audioBlobUrl && (
                <div>
                  {activeAudioId === record.id ? (
                    <AudioPlayer src={record.audioBlobUrl} title={`录音重听: ${record.title}`} />
                  ) : (
                    <button
                      id={`btn-toggle-audio-${record.id}`}
                      onClick={() => setActiveAudioId(record.id)}
                      className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      点击展开内置播放器重听原始语音（支持 2 倍速）
                    </button>
                  )}
                </div>
              )}

              {/* Export Buttons */}
              <div className="flex items-center justify-end gap-2 text-xs pt-1">
                <span className="text-[11px] text-zinc-400 mr-1">导出格式:</span>
                {(['txt', 'md', 'json'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    id={`btn-export-${fmt}-${record.id}`}
                    onClick={() => onExportRecord(record, fmt)}
                    className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded font-mono uppercase text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    .{fmt}
                  </button>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Safety Modal for One-click Clear All */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              确定要一键清空所有历史记录吗？
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              此操作将清除所有本地保存的语音转写文本与原始音频录音，无法撤销。
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-cancel-clear-all"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                取消
              </button>
              <button
                id="btn-confirm-clear-all"
                onClick={() => {
                  onClearAllRecords();
                  setShowClearConfirmModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
