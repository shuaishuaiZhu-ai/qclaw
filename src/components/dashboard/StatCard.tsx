import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // tailwind bg class e.g. 'from-indigo-500 to-purple-600'
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-5 flex items-center gap-4 hover:bg-white/8 transition-all">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-xs">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
