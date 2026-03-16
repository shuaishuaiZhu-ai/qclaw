import type { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  selectedId?: string;
}

const channelColors: Record<string, string> = {
  '飞书': 'text-blue-400 bg-blue-400/10',
  '微信': 'text-emerald-400 bg-emerald-400/10',
  'Telegram': 'text-cyan-400 bg-cyan-400/10',
  'QQ': 'text-indigo-400 bg-indigo-400/10',
};

// S2: This component currently has no search input. When search is added,
// debounce the onChange handler (e.g., useDebounce hook or setTimeout 300ms)
// before filtering conversations to avoid excessive re-renders.
export default function ConversationList({ conversations, onSelect, selectedId }: ConversationListProps) {
  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
            selectedId === conv.id
              ? 'bg-indigo-500/15 border-indigo-500/40'
              : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
          }`}
        >
          <span className="text-2xl flex-shrink-0">{conv.channelIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${channelColors[conv.channel] || 'text-slate-400 bg-slate-400/10'}`}>
                {conv.channel}
              </span>
              <span className="text-xs text-slate-500">{conv.user}</span>
              <span className="text-xs text-slate-600 ml-auto">{conv.timestamp}</span>
            </div>
            <p className="text-sm font-medium text-slate-200 truncate">{conv.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{conv.preview}</p>
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0 mt-1">{conv.messageCount} 条</span>
        </div>
      ))}
    </div>
  );
}
