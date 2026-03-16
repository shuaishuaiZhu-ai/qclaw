import { Square, SquareTerminal, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Settings() {
  const { overview, stopTask } = useAppStore();
  if (!overview) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">运维与修复</h1>
        <p className="text-slate-400 text-sm mt-1">这里放一键重启、自动修复、回滚备份、任务停止。</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">系统信息</h2>
          <Row label="OpenClaw 版本" value={overview.systemInfo.openclawVersion} />
          <Row label="当前模型" value={overview.systemInfo.model} />
          <Row label="Workspace" value={overview.systemInfo.workspace} mono />
          <Row label="配置校验" value={overview.systemInfo.configValid ? '通过' : '失败'} />
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">配置备份</h2>
          {overview.backups.slice(0, 6).map((backup) => (
            <div key={backup.name} className="rounded-lg bg-black/10 border border-white/5 px-3 py-2">
              <div className="text-sm text-slate-200 break-all">{backup.name}</div>
              <div className="text-xs text-slate-500 mt-1">{backup.createdAt}</div>
            </div>
          ))}
          {overview.backups.length === 0 && <div className="text-sm text-slate-500">暂无备份</div>}
        </div>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2"><SquareTerminal size={16} className="text-indigo-300" />任务中心</h2>
        <div className="space-y-3">
          {overview.tasks.map((task) => (
            <div key={task.id} className="rounded-lg bg-black/10 border border-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{task.label}</p>
                  <p className="text-xs text-slate-500 mt-1 break-all">{task.command}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs border ${task.status === 'running' ? 'text-indigo-200 border-indigo-500/30 bg-indigo-500/10' : task.status === 'success' ? 'text-emerald-200 border-emerald-500/30 bg-emerald-500/10' : task.status === 'stopped' ? 'text-amber-200 border-amber-500/30 bg-amber-500/10' : 'text-red-200 border-red-500/30 bg-red-500/10'}`}>
                    {task.status}
                  </span>
                  {task.status === 'running' && (
                    <button onClick={() => void stopTask(task.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/25 text-xs">
                      <Square size={12} />停止任务
                    </button>
                  )}
                </div>
              </div>
              {task.logs && <pre className="mt-3 text-xs text-slate-400 bg-slate-950/70 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{task.logs}</pre>}
            </div>
          ))}
          {overview.tasks.length === 0 && <div className="text-sm text-slate-500">还没有运维任务。</div>}
        </div>
      </div>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-5 flex gap-3">
        <ShieldAlert size={18} className="text-amber-300 mt-0.5" />
        <p className="text-sm text-amber-100 leading-6">自动修复当前调用的是 <code>openclaw doctor --repair --non-interactive --yes</code>；回滚会恢复最近备份并重启网关。</p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm text-slate-200 ${mono ? 'font-mono text-xs break-all text-right' : ''}`}>{value}</span>
    </div>
  );
}
