import type { Skill } from '../../types';

interface SkillCardProps {
  skill: Skill;
}

const statusConfig = {
  active: { label: '正常', class: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  inactive: { label: '停用', class: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
  error: { label: '错误', class: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export default function SkillCard({ skill }: SkillCardProps) {
  const status = statusConfig[skill.status];
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur p-5 hover:bg-white/8 hover:border-white/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{skill.emoji}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.class}`}>
          {status.label}
        </span>
      </div>
      <h3 className="font-semibold text-white text-sm">{skill.name}</h3>
      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{skill.description}</p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">v{skill.version}</span>
          <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">{skill.category}</span>
        </div>
        <span className="text-xs text-slate-400">{skill.usageCount} 次</span>
      </div>
      <p className="text-xs text-slate-600 mt-2">最后使用：{skill.lastUsed}</p>
    </div>
  );
}
