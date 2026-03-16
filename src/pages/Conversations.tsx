import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Conversations() {
  const overview = useAppStore((state) => state.overview);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('全部');

  const channelOptions = useMemo(() => ['全部', ...new Set((overview?.sessions || []).map((item) => item.channel))], [overview?.sessions]);

  if (!overview) return null;

  const sessions = overview.sessions.filter((item) => {
    const matchSearch = !search || item.key.includes(search) || item.preview.includes(search);
    const matchChannel = channel === '全部' || item.channel === channel;
    return matchSearch && matchChannel;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">真实会话索引</h1>
        <p className="text-slate-400 text-sm mt-1">来自 openclaw sessions --json。当前版本不再展示假的消息正文。</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 session key / model..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {channelOptions.map((item) => (
            <button
              key={item}
              onClick={() => setChannel(item)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${channel === item ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white break-all">{session.key}</p>
                <p className="text-xs text-slate-500 mt-1">{session.preview}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>{session.model}</div>
                <div>{session.kind}</div>
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <div className="text-slate-500 py-10 text-center">没有匹配的会话</div>}
      </div>
    </div>
  );
}
