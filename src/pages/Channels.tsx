import { useAppStore } from '../store/useAppStore';
import ChannelCard from '../components/channels/ChannelCard';

export default function Channels() {
  const { channels } = useAppStore();
  const connected = channels.filter((c) => c.status === 'connected').length;
  const totalToday = channels.reduce((sum, c) => sum + c.todayMessages, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">消息渠道</h1>
        <p className="text-slate-400 text-sm mt-1">
          {connected}/{channels.length} 个渠道已连接 · 今日共 {totalToday} 条消息
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '已连接', value: connected, color: 'text-emerald-400' },
          { label: '今日消息', value: totalToday, color: 'text-indigo-400' },
          { label: '总消息量', value: channels.reduce((s, c) => s + c.totalMessages, 0).toLocaleString(), color: 'text-blue-400' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
    </div>
  );
}
