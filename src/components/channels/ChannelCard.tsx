import type { Channel } from '../../types';

interface ChannelCardProps {
  channel: Channel;
}

const statusConfig = {
  connected: { label: '已连接', dot: 'bg-emerald-400 shadow-[0_0_6px_#34d399]', text: 'text-emerald-400' },
  disconnected: { label: '未连接', dot: 'bg-slate-500', text: 'text-slate-500' },
  error: { label: '错误', dot: 'bg-red-400 shadow-[0_0_6px_#f87171]', text: 'text-red-400' },
};

export default function ChannelCard({ channel }: ChannelCardProps) {
  const status = statusConfig[channel.status];
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-5 hover:bg-white/8 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{channel.icon}</span>
          <div>
            <p className="font-semibold text-white">{channel.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <span className={`text-xs ${status.text}`}>{status.label}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-slate-500">今日消息</p>
          <p className="text-xl font-bold text-white mt-1">{channel.todayMessages}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-slate-500">累计消息</p>
          <p className="text-xl font-bold text-white mt-1">{channel.totalMessages.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-3">最后活跃：{channel.lastActive}</p>
    </div>
  );
}
