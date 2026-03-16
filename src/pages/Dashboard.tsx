import { AlertTriangle, Bot, Loader2, MessagesSquare, Radio, RotateCcw, ShieldCheck, Wrench } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { EmptyState, ErrorState, InlineBanner, LoadingState } from '../components/ui/AsyncState';
import { useAppStore } from '../store/useAppStore';

function Stat({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  pending,
  children,
  className,
}: {
  onClick: () => void;
  pending?: boolean;
  children: React.ReactNode;
  className: string;
}) {
  return (
    <button onClick={onClick} disabled={pending} className={`${className} inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-60`}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export default function Dashboard() {
  const {
    overview,
    loading,
    error,
    notice,
    actionLoading,
    refresh,
    restartGateway,
    autoRepair,
    backupConfig,
    rollbackConfig,
  } = useAppStore();

  if (loading && !overview) return <LoadingState description="正在读取 OpenClaw 总览、渠道、会话和任务状态..." />;
  if (error && !overview) {
    return <ErrorState description={error} action={<button onClick={() => void refresh()} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">重试</button>} />;
  }
  if (!overview) return <EmptyState description="当前没有可展示的总览数据。" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qclaw 总览"
        description="真实读取本机 OpenClaw 状态，不再展示假的微信 / Telegram 连接和历史。"
        meta={`最后更新 ${new Date(overview.generatedAt).toLocaleString('zh-CN')}`}
        actions={(
          <>
            <ActionButton onClick={() => void restartGateway()} pending={actionLoading.restartGateway} className="bg-indigo-500/20 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/30">
              重启网关
            </ActionButton>
            <ActionButton onClick={() => void rollbackConfig()} pending={actionLoading.rollbackConfig} className="bg-amber-500/15 border-amber-500/30 text-amber-200 hover:bg-amber-500/25">
              回滚配置
            </ActionButton>
            <ActionButton onClick={() => void autoRepair()} pending={actionLoading.autoRepair} className="bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25">
              自动修复
            </ActionButton>
            <ActionButton onClick={() => void backupConfig()} pending={actionLoading.backupConfig} className="bg-white/5 border-white/10 text-slate-200 hover:bg-white/10">
              备份配置
            </ActionButton>
          </>
        )}
      />

      {error ? <InlineBanner tone="error">最近一次自动刷新失败：{error}</InlineBanner> : null}
      {notice ? <InlineBanner tone={notice.tone}>{notice.message}</InlineBanner> : null}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat title="Gateway" value={overview.gateway.reachable ? '在线' : '离线'} subtitle={`模式 ${overview.systemInfo.gatewayMode} · 绑定 ${overview.systemInfo.gatewayBind}`} />
        <Stat title="渠道" value={overview.systemInfo.connectedChannels} subtitle={`已配置 ${overview.systemInfo.channelCount} 个`} />
        <Stat title="会话索引" value={overview.systemInfo.totalSessions} subtitle="来自 openclaw sessions --json" />
        <Stat title="可用技能" value={overview.systemInfo.skillCount} subtitle={`模型 ${overview.systemInfo.model}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-200">关键问题修复状态</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                icon: Radio,
                title: '假连接问题',
                desc: '渠道列表改为实时读取 OpenClaw 配置与状态；未接入的渠道不再伪装成已连接。',
                ok: !overview.diagnostics.fakeChannelsRisk,
              },
              {
                icon: MessagesSquare,
                title: '假历史问题',
                desc: '会话页只显示真实 session 索引，不再写死 mock 对话内容。',
                ok: true,
              },
              {
                icon: Wrench,
                title: 'Gateway 重启后断连',
                desc: '前端改成 HTTP 轮询 /api/overview，不依赖重启前缓存连接。',
                ok: true,
              },
              {
                icon: ShieldCheck,
                title: '一键运维能力',
                desc: '已加入重启、备份、回滚、自动修复、停止任务。',
                ok: true,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="mb-2 flex items-center gap-3">
                  <item.icon size={16} className={item.ok ? 'text-emerald-300' : 'text-amber-300'} />
                  <h3 className="font-medium text-white">{item.title}</h3>
                </div>
                <p className="text-sm leading-6 text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Bot size={16} className="text-indigo-300" />Agent 团队</h2>
          <p className="text-sm leading-6 text-slate-400">{overview.agents.guidance}</p>
          <div className="space-y-2">
            {overview.agents.expectedRoles.map((role) => (
              <div key={role} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/10 px-3 py-2 text-sm">
                <span className="text-slate-300">{role}</span>
                <span className={overview.agents.readyForTeam ? 'text-emerald-300' : 'text-amber-300'}>
                  {overview.agents.readyForTeam ? '已具备' : '待补齐'}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500">当前检测到 {overview.agents.count} 个本地 agent。</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">最近会话</h2>
          <div className="space-y-3">
            {overview.sessions.slice(0, 6).map((session) => (
              <div key={session.id} className="rounded-lg border border-white/5 bg-black/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="break-all text-sm text-slate-200">{session.key}</p>
                  <span className="text-xs text-slate-500">{session.model}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{session.preview}</p>
              </div>
            ))}
            {overview.sessions.length === 0 ? <EmptyState title="暂无会话" description="当前没有读取到真实 session 索引。" /> : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">运维提示</h2>
          <div className="space-y-3">
            {overview.diagnostics.notes.map((note) => (
              <div key={note} className="flex gap-3 rounded-lg border border-white/5 bg-black/10 px-4 py-3">
                <AlertTriangle size={16} className="mt-0.5 text-amber-300" />
                <p className="text-sm leading-6 text-slate-300">{note}</p>
              </div>
            ))}
            <div className="flex gap-3 rounded-lg border border-white/5 bg-black/10 px-4 py-3">
              <RotateCcw size={16} className="mt-0.5 text-emerald-300" />
              <p className="text-sm leading-6 text-slate-300">回滚功能会恢复最近一次配置备份并自动重启 Gateway。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
