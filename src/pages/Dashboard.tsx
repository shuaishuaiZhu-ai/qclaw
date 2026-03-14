import { MessageSquare, Puzzle, Radio, Clock, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatCard from '../components/dashboard/StatCard';
import TrendChart from '../components/dashboard/TrendChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import { mockTrendData } from '../data/mock';

export default function Dashboard() {
  const { agentStatus, channels, conversations } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">仪表盘</h1>
        <p className="text-slate-400 text-sm mt-1">OpenClaw Agent 运行概览</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="今日对话"
          value={agentStatus.todayConversations}
          icon={MessageSquare}
          color="from-indigo-500 to-purple-600"
          subtitle={`累计 ${agentStatus.totalConversations} 次`}
        />
        <StatCard
          title="活跃 Skills"
          value={agentStatus.activeSkills}
          icon={Puzzle}
          color="from-blue-500 to-cyan-500"
          subtitle="已安装 18 个"
        />
        <StatCard
          title="消息渠道"
          value={agentStatus.activeChannels}
          icon={Radio}
          color="from-emerald-500 to-teal-500"
          subtitle="6 个渠道已配置"
        />
        <StatCard
          title="运行时长"
          value={agentStatus.uptime.split(' ')[0]}
          icon={Clock}
          color="from-orange-500 to-pink-500"
          subtitle={agentStatus.uptime}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="xl:col-span-2">
          <TrendChart data={mockTrendData} />
        </div>

        {/* Channel status */}
        <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">渠道状态</h3>
          <div className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{ch.icon}</span>
                  <span className="text-sm text-slate-300">{ch.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${ch.status === 'connected' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className="text-xs text-slate-500">{ch.todayMessages} 条</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RecentActivity conversations={conversations} />
        {/* Quick stats */}
        <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            快速统计
          </h3>
          <div className="space-y-4">
            {[
              { label: '响应成功率', value: 98.7, color: 'bg-emerald-500' },
              { label: 'Skill 调用率', value: 74.2, color: 'bg-indigo-500' },
              { label: '渠道在线率', value: 66.7, color: 'bg-blue-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-slate-300 font-medium">{item.value}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
