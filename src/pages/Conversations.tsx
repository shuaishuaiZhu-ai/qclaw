import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import ConversationList from '../components/conversations/ConversationList';
import ConversationDrawer from '../components/conversations/ConversationDrawer';
import type { Conversation } from '../types';

const channels = ['全部', '飞书', '微信', 'Telegram', 'QQ'];

export default function Conversations() {
  const { conversations } = useAppStore();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('全部');
  const [selected, setSelected] = useState<Conversation | null>(null);

  const filtered = conversations.filter((c) => {
    const matchChannel = channelFilter === '全部' || c.channel === channelFilter;
    const matchSearch = !search || c.title.includes(search) || c.preview.includes(search);
    return matchChannel && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">对话历史</h1>
        <p className="text-slate-400 text-sm mt-1">查看所有历史对话记录</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索对话..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
          />
        </div>
        {/* Channel filter */}
        <div className="flex gap-1">
          {channels.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                channelFilter === ch
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 ml-auto">{filtered.length} 条记录</span>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <ConversationList
          conversations={filtered}
          onSelect={setSelected}
          selectedId={selected?.id}
        />
      ) : (
        <div className="text-center py-16 text-slate-500">
          <p>没有找到匹配的对话</p>
        </div>
      )}

      {/* Drawer */}
      <ConversationDrawer conversation={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
