import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Sparkles, RefreshCw, AlertCircle, CheckCircle, Music, Copy, Check, Type } from 'lucide-react';
import { LanguageCode, FontSize, TranscriptionRecord } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface FileImporterProps {
  fontSize: FontSize;
  setFontSize?: (size: FontSize) => void;
  onSaveRecord: (record: TranscriptionRecord, audioBlob: Blob | null) => void;
  currentText: string;
  setCurrentText: (text: string) => void;
  onCopyAll?: () => void;
  copied?: boolean;
}

export const FileImporter: React.FC<FileImporterProps> = ({
  fontSize,
  setFontSize,
  onSaveRecord,
  currentText,
  setCurrentText,
  onCopyAll,
  copied,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('zh-CN');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Font size styling
  const getFontSizeClass = (size: FontSize) => {
    switch (size) {
      case 'S': return 'text-sm leading-relaxed';
      case 'M': return 'text-base leading-relaxed';
      case 'L': return 'text-lg leading-relaxed';
      case 'XL': return 'text-xl sm:text-2xl leading-relaxed';
      default: return 'text-base leading-relaxed';
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;
    setErrorMessage(null);

    // Validate format
    const validFormats = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'audio/webm', 'audio/ogg', 'audio/aac'];
    if (!selectedFile.type.startsWith('audio/') && !validFormats.some((fmt) => selectedFile.name.toLowerCase().endsWith(fmt.split('/')[1]))) {
      setErrorMessage('请选择有效的音频文件 (MP3, WAV, M4A, WEBM, OGG 等)');
      return;
    }

    // Check size limit (max 25MB for inline base64)
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('文件大小超过 25MB 限制，请上传 25MB 以内音频文件。');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleTranscribeFile = async () => {
    if (!file) return;
    setIsTranscribing(true);
    setErrorMessage(null);
    setCurrentText(''); // Auto-clear previous text on new file transcribe start

    try {
      // Convert file to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result as string;

        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Audio: base64Data,
            mimeType: file.type || 'audio/mp3',
            language,
          }),
        });

        const data = await response.json();
        if (data.text) {
          setCurrentText(data.text);

          // Save record
          const newRecord: TranscriptionRecord = {
            id: 'file-' + Date.now(),
            title: `文件转写: ${file.name}`,
            text: data.text,
            audioBlobUrl: audioUrl || undefined,
            duration: 0, // Calculated during audio playback
            language,
            createdAt: Date.now(),
            mode: 'file',
          };
          onSaveRecord(newRecord, file);
        } else {
          setErrorMessage(data.error || '语音识别失败，请检查文件格式。');
        }
        setIsTranscribing(false);
      };

      reader.onerror = () => {
        setErrorMessage('文件读取失败，请重新选择文件。');
        setIsTranscribing(false);
      };
    } catch (err: any) {
      console.error('File transcribe error:', err);
      setErrorMessage('转写失败：' + (err.message || '网络连接错误'));
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* File Upload & Drop Zone */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 landscape:p-3 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-all space-y-3 sm:space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-blue-500" />
              本地语音文件导入识别
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              支持 MP3、WAV、M4A、WEBM、OGG、AAC 等各类音频
            </p>
          </div>

          {/* Language selection for file */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <span className="text-[11px] text-zinc-400 pl-1">语言提示:</span>
            <select
              id="select-file-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 pr-1 py-1 focus:outline-none cursor-pointer"
            >
              <option value="zh-CN" className="dark:bg-zinc-800">🇨🇳 中文普通话</option>
              <option value="en-US" className="dark:bg-zinc-800">🇺🇸 English</option>
              <option value="fr-FR" className="dark:bg-zinc-800">🇫🇷 Français</option>
            </select>
          </div>
        </div>

        {/* Drop Box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-sky-400 dark:hover:border-sky-500/80 bg-zinc-50/50 dark:bg-zinc-800/30'
          }`}
        >
          <input
            id="file-input-hidden"
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-xs">
            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {file ? `已选择: ${file.name}` : '点击选择音频文件 或 将文件拖拽至此处'}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · 格式 ${file.type || 'Audio'}` : '支持单文件最大 25MB · 高精准多语言提取'}
          </p>
        </div>

        {/* File Player & Transcribe Trigger Button */}
        {file && audioUrl && (
          <div className="space-y-3 pt-1">
            <AudioPlayer src={audioUrl} title={`音频文件: ${file.name}`} />

            <div className="flex justify-end">
              <button
                id="btn-start-file-transcribe"
                onClick={handleTranscribeFile}
                disabled={isTranscribing}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
              >
                {isTranscribing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI 引擎高精转写中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>开始 AI 高精转写</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

      </div>

      {/* Editable Transcribed Text Display */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 landscape:p-3 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-colors space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5 flex-wrap gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
            ✍️ 文件识别结果
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Font Size Selector */}
            {setFontSize && (
              <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <span className="px-1 text-[10px] text-zinc-400 font-medium flex items-center gap-0.5">
                  <Type className="w-2.5 h-2.5" />
                </span>
                {(['S', 'M', 'L', 'XL'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-all cursor-pointer ${
                      fontSize === size
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-bold'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}

            {/* Copy Button */}
            {onCopyAll && (
              <button
                id="btn-copy-file-text"
                onClick={onCopyAll}
                disabled={!currentText.trim()}
                className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs active:scale-95 transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap"
                title="复制全部文字"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-600 dark:text-zinc-300 shrink-0" />
                    <span className="text-[11px]">复制</span>
                  </>
                )}
              </button>
            )}

            {currentText && (
              <button
                id="btn-clear-file-text"
                onClick={() => setCurrentText('')}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1 py-0.5"
              >
                清空
              </button>
            )}
          </div>
        </div>

        <textarea
          id="textarea-file-transcript"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="上传音频文件并点击“开始 AI 高精转写”，转换出的文本将呈现在此..."
          className={`w-full min-h-[150px] sm:min-h-[220px] landscape:min-h-[120px] p-3 sm:p-4 bg-zinc-50/50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-sans resize-y ${getFontSizeClass(
            fontSize
          )}`}
        />
      </div>

    </div>
  );
};
