import type { Conversation } from '../../types';

interface RecentActivityProps {
  conversations: Conversation[];
}

const channelColors: Record<string, string> = {
  '飞书': 'text-blue-400 bg-blue-400/10',
  '微信': 'text-emerald-400 bg-emerald-400/10',
  'Telegram': 'text-cyan-400 bg-cyan-400/10',
  'QQ': 'text-indigo-400 bg-indigo-400/10',
};

export default function RecentActivity({ conversations }: RecentActivityProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-5">
      <h3 className="text-sm font-medium text-slate-300 mb-4">最近活动</h3>
      <div className="space-y-3">
        {conversations.slice(0, 5).map((conv) => (
          <div key={conv.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all">
            <span className="text-lg flex-shrink-0">{conv.channelIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${channelColors[conv.channel] || 'text-slate-400 bg-slate-400/10'}`}>
                  {conv.channel}
                </span>
                <span className="text-xs text-slate-500">{conv.timestamp}</span>
              </div>
              <p className="text-sm text-slate-300 truncate">{conv.preview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
