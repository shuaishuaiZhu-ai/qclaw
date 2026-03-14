import { useAppStore } from '../store/useAppStore';
import { Check, X, Server, Cpu, HardDrive, MemoryStick } from 'lucide-react';

const apiKeys = [
  { name: 'GITHUB_TOKEN', configured: true },
  { name: 'FEISHU_APP_ID', configured: true },
  { name: 'FEISHU_APP_SECRET', configured: true },
  { name: 'TELEGRAM_BOT_TOKEN', configured: true },
  { name: 'OPENAI_API_KEY', configured: false },
  { name: 'GEMINI_API_KEY', configured: false },
  { name: 'TAVILY_API_KEY', configured: true },
  { name: 'ELEVENLABS_API_KEY', configured: false },
];

export default function Settings() {
  const { systemInfo } = useAppStore();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">系统设置</h1>
        <p className="text-slate-400 text-sm mt-1">OpenClaw 运行环境信息</p>
      </div>

      {/* Model info */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Cpu size={16} className="text-indigo-400" />
          AI 模型
        </h2>
        <div className="space-y-3">
          <Row label="当前模型" value={systemInfo.model} />
          <Row label="运行时长" value={systemInfo.uptime} />
        </div>
      </div>

      {/* System info */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Server size={16} className="text-blue-400" />
          系统信息
        </h2>
        <div className="space-y-3">
          <Row label="OpenClaw 版本" value={systemInfo.version} highlight />
          <Row label="Node.js 版本" value={systemInfo.nodeVersion} />
          <Row label="运行平台" value={systemInfo.platform} />
          <Row label="Workspace" value={systemInfo.workspace} mono />
        </div>
      </div>

      {/* Resource usage */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <MemoryStick size={16} className="text-emerald-400" />
          资源使用
        </h2>
        <div className="space-y-4">
          {[
            { label: '内存使用', value: systemInfo.memoryUsage, color: 'bg-indigo-500' },
            { label: 'CPU 使用', value: systemInfo.cpuUsage, color: 'bg-blue-500' },
            { label: '磁盘使用', value: systemInfo.diskUsage, color: 'bg-emerald-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">{item.label}</span>
                <span className="text-slate-300 font-medium">{item.value}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <HardDrive size={16} className="text-orange-400" />
          API Key 配置状态
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {apiKeys.map((k) => (
            <div key={k.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-xs font-mono text-slate-400">{k.name}</span>
              {k.configured ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <X size={14} className="text-slate-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm ${highlight ? 'text-indigo-300 font-semibold' : 'text-slate-200'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
