import { useAppStore } from '../store/useAppStore';

export default function Channels() {
  const overview = useAppStore((state) => state.overview);
  if (!overview) return null;

  const channels = overview.channels;
  const connected = channels.filter((item) => item.connected).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">渠道状态</h1>
        <p className="text-slate-400 text-sm mt-1">仅展示 OpenClaw 当前真实配置到的渠道账号。</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{connected}</p>
          <p className="text-xs text-slate-500 mt-1">已连接</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{channels.length}</p>
          <p className="text-xs text-slate-500 mt-1">已配置</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{channels.filter((item) => !item.running).length}</p>
          <p className="text-xs text-slate-500 mt-1">需处理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {channels.map((channel) => (
          <div key={channel.id} className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{channel.name}</h3>
                <p className="text-xs text-slate-500">provider: {channel.provider} · account: {channel.accountId}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs border ${(channel.connected || channel.running) ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
                {(channel.connected || channel.running) ? '已连接' : channel.configured ? '未运行/未连接' : '未配置'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-black/10 border border-white/5 px-3 py-2">
                <p className="text-slate-500 text-xs">configured</p>
                <p className="text-slate-200 mt-1">{String(channel.configured)}</p>
              </div>
              <div className="rounded-lg bg-black/10 border border-white/5 px-3 py-2">
                <p className="text-slate-500 text-xs">running</p>
                <p className="text-slate-200 mt-1">{String(channel.running)}</p>
              </div>
            </div>
            {channel.detail && <p className="text-xs text-amber-300">{channel.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
