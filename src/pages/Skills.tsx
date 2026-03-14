import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import SkillCard from '../components/skills/SkillCard';

const categories = ['全部', '生产力', '开发工具', '搜索', '实用工具', '效率', '自动化', '内容处理', '文档处理'];

export default function Skills() {
  const { skills } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');

  const filtered = skills.filter((s) => {
    const matchCat = category === '全部' || s.category === category;
    const matchSearch = !search || s.name.includes(search) || s.description.includes(search);
    return matchCat && matchSearch;
  });

  const activeCount = skills.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Skills 管理</h1>
          <p className="text-slate-400 text-sm mt-1">已安装 {skills.length} 个 · 活跃 {activeCount} 个</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索 Skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                category === cat
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filtered.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">没有找到匹配的 Skill</div>
      )}
    </div>
  );
}
