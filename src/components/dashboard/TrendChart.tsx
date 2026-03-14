import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendData } from '../../types';

interface TrendChartProps {
  data: TrendData[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-5">
      <h3 className="text-sm font-medium text-slate-300 mb-4">最近7天对话趋势</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            cursor={{ stroke: 'rgba(99,102,241,0.3)' }}
          />
          <Line type="monotone" dataKey="conversations" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} name="对话数" />
          <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="消息数" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
