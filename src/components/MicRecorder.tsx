import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Pause, Play, Square, Sparkles, RefreshCw, Volume2, Globe, Check, AlertCircle } from 'lucide-react';
import { LanguageCode, FontSize, TranscriptionRecord } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface MicRecorderProps {
  fontSize: FontSize;
  searchQuery: string;
  onSaveRecord: (record: TranscriptionRecord, audioBlob: Blob | null) => void;
  currentText: string;
  setCurrentText: (text: string) => void;
}

export const MicRecorder: React.FC<MicRecorderProps> = ({
  fontSize,
  searchQuery,
  onSaveRecord,
  currentText,
  setCurrentText,
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [language, setLanguage] = useState<LanguageCode>('zh-CN');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Live refs to prevent closure staleness
  const currentTextRef = useRef(currentText);
  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);

  const recordingStateRef = useRef(recordingState);
  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  const finalizedTextRef = useRef<string>('');
  const lastFinalIndexRef = useRef<number>(-1);

  const recordingSecondsRef = useRef(recordingSeconds);
  useEffect(() => {
    recordingSecondsRef.current = recordingSeconds;
  }, [recordingSeconds]);

  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Web Audio & MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Speech Recognition setup
  const isSpeechSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Font size mapping
  const getFontSizeClass = (size: FontSize) => {
    switch (size) {
      case 'S': return 'text-sm leading-relaxed';
      case 'M': return 'text-base leading-relaxed';
      case 'L': return 'text-lg leading-relaxed';
      case 'XL': return 'text-xl sm:text-2xl leading-relaxed';
      default: return 'text-base leading-relaxed';
    }
  };

  // Timer effect
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  // Audio Visualizer setup
  const startVisualizer = (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#f87171';
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.warn("Visualizer failed to initialize", e);
    }
  };

  const stopVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
  };

  // Start Live Recording
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setCurrentText(''); // Auto-clear previous transcription text when starting new speech session
    finalizedTextRef.current = '';
    lastFinalIndexRef.current = -1;
    setAudioUrl(null);
    setCurrentBlob(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startVisualizer(stream);

      // MediaRecorder for raw audio capture
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setCurrentBlob(audioBlob);

        const finalText = currentTextRef.current.trim() || '（无语音内容）';
        const finalDuration = recordingSecondsRef.current;
        const finalLang = languageRef.current;

        // Auto save record session directly to IndexedDB & History
        const newRecord: TranscriptionRecord = {
          id: 'rec-' + Date.now(),
          title: `麦克风录音 (${new Date().toLocaleTimeString()})`,
          text: finalText,
          audioBlobUrl: url,
          duration: finalDuration,
          language: finalLang,
          createdAt: Date.now(),
          mode: 'mic',
        };
        onSaveRecord(newRecord, audioBlob);
        setSavedSuccessMsg('✅ 已自动将语音与文本保存至历史记录！');
        setTimeout(() => setSavedSuccessMsg(null), 4000);
      };

      mediaRecorder.start(500);

      // Initialize Web Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        if (language === 'zh-CN') recognition.lang = 'zh-CN';
        else if (language === 'en-US') recognition.lang = 'en-US';
        else if (language === 'fr-FR') recognition.lang = 'fr-FR';
        else recognition.lang = 'zh-CN'; // Default auto multi-lang

        recognition.onresult = (event: any) => {
          let interimAcc = '';

          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              if (i > lastFinalIndexRef.current) {
                let formattedChunk = transcript.trim();
                if (formattedChunk) {
                  // Auto punctuation if needed
                  if (/[a-zA-Z]/.test(formattedChunk) && !/[.!?]$/.test(formattedChunk)) {
                    formattedChunk += '. ';
                  } else if (!/[。！？.!?，,]$/.test(formattedChunk)) {
                    formattedChunk += '。';
                  }
                  const prev = finalizedTextRef.current.trim();
                  finalizedTextRef.current = prev ? prev + ' ' + formattedChunk : formattedChunk;
                }
                lastFinalIndexRef.current = i;
              }
            } else {
              interimAcc += transcript;
            }
          }

          const currentFinal = finalizedTextRef.current.trim();
          const currentInterim = interimAcc.trim();

          let combined = currentFinal;
          if (currentInterim) {
            combined = combined ? combined + ' ' + currentInterim : currentInterim;
          }

          setCurrentText(combined);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('无法访问麦克风，请允许网页使用麦克风权限。');
          }
        };

        recognition.onend = () => {
          // If still recording state, restart recognition for uninterrupted stream
          if (recordingStateRef.current === 'recording' && recognitionRef.current) {
            try {
              lastFinalIndexRef.current = -1;
              recognitionRef.current.start();
            } catch (e) {
              // Ignore restart error if already ended
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setRecordingSeconds(0);
      setRecordingState('recording');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setErrorMessage('开启麦克风失败：' + (err.message || '请检查网页麦克风授权'));
    }
  };

  // Pause Recording
  const handlePauseRecording = () => {
    if (recordingState === 'recording') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setRecordingState('paused');
    }
  };

  // Resume Recording
  const handleResumeRecording = () => {
    if (recordingState === 'paused') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      lastFinalIndexRef.current = -1;
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
      setRecordingState('recording');
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    setRecordingState('idle');
    stopVisualizer();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // AI Smart Auto-Punctuation & Format Polish via Gemini API
  const handleAIPolish = async () => {
    if (!currentText.trim()) return;
    setIsPolishing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: currentText }),
      });
      const data = await res.json();
      if (data.text) {
        setCurrentText(data.text);
        finalizedTextRef.current = data.text;
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      console.error('AI polish error:', err);
      setErrorMessage('智能标点优化失败，请重试。');
    } finally {
      setIsPolishing(false);
    }
  };

  // Format time display
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Highlight search keywords in live edit box preview
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-800 text-zinc-900 dark:text-white px-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Recording Control Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 landscape:p-3 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6">
          
          {/* Main Action Buttons: Start / Pause / Resume / Stop */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            
            {recordingState === 'idle' ? (
              <button
                id="btn-start-record"
                onClick={handleStartRecording}
                className="group relative flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white group-hover:scale-110 transition-transform animate-ping absolute left-6 opacity-30" />
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 relative" />
                <span className="text-xs sm:text-sm tracking-wide">点击开始说话</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Pause/Resume button */}
                {recordingState === 'recording' ? (
                  <button
                    id="btn-pause-record"
                    onClick={handlePauseRecording}
                    className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
                  >
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    暂停
                  </button>
                ) : (
                  <button
                    id="btn-resume-record"
                    onClick={handleResumeRecording}
                    className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
                  >
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    继续
                  </button>
                )}

                {/* Stop button */}
                <button
                  id="btn-stop-record"
                  onClick={handleStopRecording}
                  className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
                >
                  <Square className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                  结束转写
                </button>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Globe className="w-3.5 h-3.5 text-zinc-400 ml-1 hidden sm:block" />
              <select
                id="select-language-mode"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                disabled={recordingState !== 'idle'}
                className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 pr-1 py-1 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none"
              >
                <option value="zh-CN" className="dark:bg-zinc-800">🇨🇳 中文普通话</option>
                <option value="en-US" className="dark:bg-zinc-800">🇺🇸 English</option>
                <option value="fr-FR" className="dark:bg-zinc-800">🇫🇷 Français</option>
              </select>
            </div>

          </div>

          {/* Recording Status & Waveform Canvas */}
          {recordingState !== 'idle' ? (
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-mono font-bold border border-red-200 dark:border-red-900">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                {recordingState === 'recording' ? '转写中' : '已暂停'} ({formatSeconds(recordingSeconds)})
              </div>

              {/* Waveform Canvas */}
              <canvas
                ref={canvasRef}
                width={100}
                height={28}
                className="rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              />
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 hidden lg:block text-right">
              自然停顿将自动生成句号、逗号与结构标点
            </div>
          )}

        </div>

        {/* Error Alert if permission/audio issue */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert when saved to history */}
        {savedSuccessMsg && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{savedSuccessMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Real-time Editable Display Box */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 landscape:p-3 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-colors space-y-3 sm:space-y-4">
        
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>✍️ 实时转写与文本编辑区</span>
            </h2>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-normal hidden xs:inline">
              （可随时打字键盘纠错）
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Auto-Punctuation Polish Button */}
            <button
              id="btn-ai-polish"
              onClick={handleAIPolish}
              disabled={isPolishing || !currentText.trim()}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold active:scale-95 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              title="使用 AI Gemini 自动补充标点、停顿断句与排版优化"
            >
              {isPolishing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-red-500" />
              )}
              <span>智能标点断句</span>
            </button>

            {/* Clear current text */}
            {currentText && (
              <button
                id="btn-clear-current-text"
                onClick={() => {
                  setCurrentText('');
                  finalizedTextRef.current = '';
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-1.5 py-0.5"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {/* Text Area Input */}
        <div className="relative min-h-[150px] sm:min-h-[220px] landscape:min-h-[120px]">
          <textarea
            id="textarea-live-transcript"
            value={currentText}
            onChange={(e) => {
              const val = e.target.value;
              setCurrentText(val);
              finalizedTextRef.current = val;
            }}
            placeholder={
              recordingState === 'recording'
                ? '🎙️ 正在实时转写您的语音，说话内容将秒级呈现在这里...'
                : '点击上方红色按钮开始录音转写，或直接在此框输入/黏贴文字...'
            }
            className={`w-full min-h-[150px] sm:min-h-[220px] landscape:min-h-[120px] p-3 sm:p-4 bg-zinc-50/50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-sans resize-y ${getFontSizeClass(
              fontSize
            )}`}
          />

          {/* Keyword Search Highlight Preview */}
          {searchQuery.trim() && currentText.toLowerCase().includes(searchQuery.toLowerCase()) && (
            <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-200">
              <span className="font-semibold text-amber-700 dark:text-amber-400 mr-2">关键词匹配：</span>
              <span>{renderHighlightedText(currentText, searchQuery)}</span>
            </div>
          )}
        </div>

        {/* Bottom Audio Synchronized Double Preservation Player */}
        {audioUrl && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <AudioPlayer src={audioUrl} title="本次录音原始语音 (双重同步保存)" />
          </div>
        )}

      </div>

    </div>
  );
};
