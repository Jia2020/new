export type AppMode = 'mic' | 'file' | 'history';

export type LanguageCode = 'zh-CN' | 'en-US' | 'fr-FR';

export type FontSize = 'S' | 'M' | 'L' | 'XL';

export type ExportFormat = 'txt' | 'md' | 'json';

export interface TranscriptionRecord {
  id: string;
  title: string;
  text: string;
  audioBlobUrl?: string; // Blob URL for playback
  audioDataUrl?: string; // Base64 data if synced
  duration: number; // in seconds
  language: LanguageCode;
  createdAt: number; // timestamp
  mode: 'mic' | 'file';
  syncedToCloud?: boolean;
}

export interface CloudUser {
  email: string;
  isLoggedIn: boolean;
  lastSyncedAt?: number;
}

export type Theme = 'light' | 'dark' | 'system';
