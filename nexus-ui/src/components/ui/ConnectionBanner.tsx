import { RefreshCw, CheckCircle, WifiOff, AlertCircle } from 'lucide-react';
import type { ConnectionStatus } from '@/types';

interface ConnectionBannerProps {
  status: ConnectionStatus;
}

export function ConnectionBanner({ status }: ConnectionBannerProps) {
  if (status.type === 'connected') {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-200/90 dark:bg-slate-800/55 border-b border-slate-300 dark:border-slate-600/35 text-slate-700 dark:text-slate-300 text-xs font-medium animate-slide-down">
        <CheckCircle size={12} />
        <span>CONNECTION ESTABLISHED</span>
        {status.latency !== undefined && status.latency > 0 && (
          <span className="ml-auto text-slate-500 dark:text-slate-500">Latency: {status.latency}ms</span>
        )}
      </div>
    );
  }
  if (status.type === 'connecting') {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-900/30 border-b border-amber-500/20 text-amber-400 text-xs font-medium animate-slide-down">
        <RefreshCw size={12} className="animate-spin" />
        <span>{status.message?.toUpperCase() ?? 'RECONNECTING...'}</span>
      </div>
    );
  }
  if (status.type === 'error' || status.type === 'disconnected') {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-red-900/20 border-b border-red-500/20 text-red-400 text-xs font-medium">
        {status.type === 'error' ? <AlertCircle size={12} /> : <WifiOff size={12} />}
        <span>{(status.message ?? 'DISCONNECTED').toUpperCase()}</span>
      </div>
    );
  }
  return null;
}
