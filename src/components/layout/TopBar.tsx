import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TopBar() {
  const { overview, refresh, refreshing } = useAppStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  const online = overview?.gateway.status === 'online';

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-slate-900/60 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'}`} />
        <span className="text-sm text-slate-300">Gateway {online ? '在线' : '需处理'}</span>
        {overview && <span className="text-xs text-slate-500">· {overview.systemInfo.openclawVersion}</span>}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          刷新
        </button>
        <span className="text-sm text-slate-400">{dateStr}</span>
        <span className="text-sm font-mono text-slate-300">{timeStr}</span>
      </div>
    </header>
  );
}
