import React, { useState } from 'react';
import { Cloud, Check, RefreshCw, X, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { CloudUser, TranscriptionRecord } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudUser: CloudUser;
  setCloudUser: (user: CloudUser) => void;
  records: TranscriptionRecord[];
  onSetRecords: (records: TranscriptionRecord[]) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  cloudUser,
  setCloudUser,
  records,
  onSetRecords,
}) => {
  const [emailInput, setEmailInput] = useState<string>(cloudUser.email || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setMessage('请输入有效的电子邮箱地址');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cloud/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });

      const data = await res.json();
      if (data.email) {
        setCloudUser({
          email: data.email,
          isLoggedIn: true,
          lastSyncedAt: data.lastSyncedAt || Date.now(),
        });

        // Merge cloud records if any
        if (data.records && data.records.length > 0) {
          const merged = [...records];
          for (const cloudRec of data.records) {
            if (!merged.some((r) => r.id === cloudRec.id)) {
              merged.push(cloudRec);
            }
          }
          onSetRecords(merged);
        }

        setMessage('云端账号登录成功！');
      } else {
        setMessage(data.error || '登录失败，请重试。');
      }
    } catch (err: any) {
      console.error('Cloud auth error:', err);
      setMessage('云端服务器连接失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    if (!cloudUser.isLoggedIn) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cloudUser.email,
          records: records.map((r) => ({
            id: r.id,
            title: r.title,
            text: r.text,
            duration: r.duration,
            language: r.language,
            createdAt: r.createdAt,
            mode: r.mode,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCloudUser({
          ...cloudUser,
          lastSyncedAt: data.lastSyncedAt,
        });
        setMessage(`云端同步完成！成功同步 ${data.count} 条转写记录。`);
      } else {
        setMessage(data.error || '云端同步失败');
      }
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      setMessage('同步遇到错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 relative">
        
        {/* Close Button */}
        <button
          id="btn-close-cloud-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              云端账户同步
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              多设备共享转写数据与安全云端备份
            </p>
          </div>
        </div>

        {/* Auth / Account Form */}
        {!cloudUser.isLoggedIn ? (
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                云端同步邮箱账号
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="cloud-email-input"
                  type="email"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <button
              id="btn-submit-cloud-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>绑定云端账号并登录</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">已登录账号：</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">{cloudUser.email}</span>
            </div>

            {cloudUser.lastSyncedAt && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>最近云端同步时间：</span>
                <span className="font-mono">
                  {new Date(cloudUser.lastSyncedAt).toLocaleTimeString()}
                </span>
              </div>
            )}

            <button
              id="btn-trigger-cloud-sync-now"
              onClick={handleSyncNow}
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>立即同步本地数据至云端</span>
                </>
              )}
            </button>
          </div>
        )}

        {message && (
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 text-center font-medium">
            {message}
          </div>
        )}

        <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>所有语音数据均加密存储，尊重隐私安全</span>
        </div>

      </div>
    </div>
  );
};
