import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Bell, Moon } from 'lucide-react';

export default function TopBar() {
  const { agentStatus } = useAppStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-slate-900/60 backdrop-blur">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            agentStatus.status === 'online' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'
          }`}
        />
        <span className="text-sm text-slate-300">
          Agent {agentStatus.status === 'online' ? '在线' : '离线'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">{dateStr}</span>
        <span className="text-sm font-mono text-slate-300">{timeStr}</span>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <Bell size={16} />
        </button>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <Moon size={16} />
        </button>
      </div>
    </header>
  );
}
