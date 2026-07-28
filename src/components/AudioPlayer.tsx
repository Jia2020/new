import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Gauge } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  onEnded?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.playbackRate = playbackRate;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-900 text-zinc-100 rounded-xl p-4 border border-zinc-800 shadow-md">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
      />

      {title && (
        <div className="text-xs font-medium text-zinc-400 mb-2 truncate flex items-center justify-between">
          <span>{title}</span>
          <span className="text-[10px] text-zinc-500">内置音轨播放器</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        
        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="audio-btn-play"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            id="audio-btn-replay"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
                setIsPlaying(true);
              }
            }}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="重新播放"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <input
            id="audio-slider-progress"
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-red-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
          />

          <span className="text-xs font-mono text-zinc-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Speed Controls (0.5x, 1x, 1.25x, 1.5x, 2x) */}
        <div className="flex items-center gap-1.5 shrink-0 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/60">
          <Gauge className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          {[0.5, 1.0, 1.25, 1.5, 2.0].map((speed) => (
            <button
              key={speed}
              id={`audio-speed-${speed}`}
              onClick={() => handleSpeedChange(speed)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all ${
                playbackRate === speed
                  ? 'bg-red-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Volume Toggle */}
        <button
          id="audio-btn-volume"
          onClick={toggleMute}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

      </div>
    </div>
  );
};
