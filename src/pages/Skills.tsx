import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function Skills() {
  const overview = useAppStore((state) => state.overview);
  const [search, setSearch] = useState('');
  if (!overview) return null;

  const skills = useMemo(() => overview.skills.filter((skill) => {
    const keyword = search.trim();
    return !keyword || skill.name.includes(keyword) || skill.description.includes(keyword);
  }), [overview.skills, search]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">技能与 Agent 能力</h1>
        <p className="text-slate-400 text-sm mt-1">技能来自 openclaw skills list --json --eligible；Agent 来自 openclaw agents list --json。</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-200">可用技能</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索技能..." className="w-full max-w-xs px-3 py-2 text-sm bg-black/10 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {skills.map((skill) => (
              <div key={skill.name} className="rounded-lg bg-black/10 border border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{skill.emoji || '🧩'}</span>
                  <p className="text-sm font-medium text-white">{skill.name}</p>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-5">{skill.description}</p>
                <p className="text-[11px] text-slate-500 mt-2">{skill.source}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Agent 配置</h2>
          {overview.agents.configured.map((agent) => (
            <div key={agent.id} className="rounded-lg bg-black/10 border border-white/5 px-4 py-3">
              <p className="text-white font-medium">{agent.identityEmoji || '🤖'} {agent.identityName || agent.id}</p>
              <p className="text-xs text-slate-400 mt-1">id: {agent.id}</p>
              <p className="text-xs text-slate-500 mt-2 break-all">model: {agent.model || 'unknown'}</p>
            </div>
          ))}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 leading-6">
            想要 PM / Dev / Test / Review 四角色并行，至少需要补齐更多 agent 配置或通过 ACP 线程会话调度。
          </div>
        </div>
      </div>
    </div>
  );
}
