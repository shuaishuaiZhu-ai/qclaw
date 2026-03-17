import { useMemo, useState, useEffect } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

type AgentInfo = { id: string; model?: string; identityName?: string; identityEmoji?: string; isDefault?: boolean };

function InstallModal({ onClose, onInstalled }: { onClose: () => void; onInstalled: () => void }) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInstall = async () => {
    if (!name.trim() || !content.trim()) { setError('名称和 SKILL.md 内容不能为空'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/skills/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), skillmdContent: content }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      onInstalled();
    } catch (e: any) {
      setError(e.message || '安装失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">安装新技能</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-xs text-slate-400 mb-4">从 <a href="https://clawhub.ai" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">clawhub.ai</a> 找到技能，复制其 SKILL.md 内容粘贴到下方。</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">技能目录名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: my-skill"
              className="w-full px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">SKILL.md 内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="粘贴 SKILL.md 内容..."
              className="w-full px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">取消</button>
            <button
              onClick={handleInstall}
              disabled={loading}
              className="px-4 py-2 text-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? '安装中...' : '安装'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Skills() {
  const overview = useAppStore((state) => state.overview);
  const [search, setSearch] = useState('');
  const [showInstall, setShowInstall] = useState(false);
  const [unloading, setUnloading] = useState<string | null>(null);

  // Agent default management
  const [agentsConfig, setAgentsConfig] = useState<{ default: string; list: AgentInfo[]; availableModels: string[] } | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [changingModel, setChangingModel] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('');
  const [addingAgent, setAddingAgent] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      if (json.ok) setAgentsConfig(json.data);
    } catch {}
  };

  useEffect(() => { fetchAgents(); }, []);

  if (!overview) return null;

  const skills = useMemo(() => overview.skills.filter((skill) => {
    const keyword = search.trim();
    return !keyword || skill.name.toLowerCase().includes(keyword.toLowerCase()) || skill.description?.toLowerCase().includes(keyword.toLowerCase());
  }), [overview.skills, search]);

  const handleUninstall = async (name: string) => {
    if (!confirm(`确认卸载技能 "${name}"？`)) return;
    setUnloading(name);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      window.location.reload();
    } catch (e: any) {
      alert(`卸载失败: ${e.message}`);
    } finally {
      setUnloading(null);
    }
  };

  const handleSetDefault = async (agentId: string) => {
    setSettingDefault(agentId);
    try {
      const res = await fetch('/api/agents/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      await fetchAgents();
    } catch (e: any) {
      alert(`设置失败: ${e.message}`);
    } finally {
      setSettingDefault(null);
    }
  };

  const handleChangeModel = async (agentId: string, model: string) => {
    setChangingModel(agentId);
    try {
      const res = await fetch('/api/agents/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, model }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      await fetchAgents();
    } catch (e: any) {
      alert(`切换失败: ${e.message}`);
    } finally {
      setChangingModel(null);
    }
  };

  const handleAddAgent = async () => {
    if (!newAgentId.trim() || !newAgentModel) { alert('请填写 ID 和模型'); return; }
    setAddingAgent(true);
    try {
      const res = await fetch('/api/agents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newAgentId.trim(), model: newAgentModel }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setShowAddAgent(false);
      setNewAgentId('');
      setNewAgentModel('');
      await fetchAgents();
    } catch (e: any) {
      alert(`新增失败: ${e.message}`);
    } finally {
      setAddingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm(`确认删除 Agent "${agentId}"？此操作不可恢复。`)) return;
    setDeletingAgent(agentId);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      await fetchAgents();
    } catch (e: any) {
      alert(`删除失败: ${e.message}`);
    } finally {
      setDeletingAgent(null);
    }
  };

  // Merge overview agents with agentsConfig
  const displayAgents = useMemo(() => {
    const configList = agentsConfig?.list || [];
    const overviewAgents = overview.agents.configured || [];
    // Use overview agents as primary, supplement with config list
    const merged = overviewAgents.map((a: AgentInfo) => ({
      ...a,
      isDefault: agentsConfig?.default === a.id,
    }));
    // Add any from config not in overview
    for (const ca of configList) {
      if (!merged.find((a: any) => a.id === ca.id)) {
        merged.push({ ...ca, isDefault: agentsConfig?.default === ca.id });
      }
    }
    return merged;
  }, [overview.agents.configured, agentsConfig]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">技能与 Agent 能力</h1>
        <p className="text-slate-400 text-sm mt-1">技能来自 openclaw skills list --json --eligible；Agent 来自 openclaw agents list --json。</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-200">可用技能 <span className="text-slate-500 font-normal">({skills.length})</span></h2>
            <div className="flex items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索技能..." className="w-full max-w-xs px-3 py-2 text-sm bg-black/10 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
              <button
                onClick={() => setShowInstall(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/25 transition-colors whitespace-nowrap"
              >
                <Plus size={13} />
                从 ClawHub 安装
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {skills.map((skill) => (
              <div key={skill.name} className="rounded-lg bg-black/10 border border-white/5 px-4 py-3 relative group">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{skill.emoji || '🧩'}</span>
                    <p className="text-sm font-medium text-white truncate">{skill.name}</p>
                  </div>
                  <button
                    onClick={() => handleUninstall(skill.name)}
                    disabled={unloading === skill.name}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-slate-500 hover:text-red-400 transition-all disabled:opacity-50"
                    title="卸载技能"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-5">{skill.description}</p>
                <p className="text-[11px] text-slate-500 mt-2">{skill.source}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Agent 配置</h2>
            <button
              onClick={() => setShowAddAgent(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/25 transition-colors"
            >
              <Plus size={12} /> 新增
            </button>
          </div>
          {agentsConfig && (
            <p className="text-xs text-slate-500">默认 Agent: <span className="text-indigo-300 font-medium">{agentsConfig.default}</span></p>
          )}
          {displayAgents.map((agent: any) => (
            <div key={agent.id} className="rounded-lg bg-black/10 border border-white/5 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-medium">{agent.identityEmoji || '🤖'} {agent.identityName || agent.id}</p>
                <div className="flex items-center gap-1.5">
                  {agent.isDefault ? (
                    <span className="text-[11px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ 默认</span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(agent.id)}
                      disabled={settingDefault === agent.id}
                      className="text-[11px] text-slate-400 border border-white/10 bg-white/5 px-2 py-0.5 rounded-full hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                    >
                      {settingDefault === agent.id ? '...' : '设为默认'}
                    </button>
                  )}
                  {agent.id !== 'main' && (
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      disabled={deletingAgent === agent.id}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="删除 agent"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400">id: {agent.id}</p>
              {/* Model selector */}
              <div className="space-y-1">
                <p className="text-[11px] text-slate-500">当前模型</p>
                <select
                  value={agent.model || ''}
                  disabled={changingModel === agent.id}
                  onChange={(e) => handleChangeModel(agent.id, e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-black/20 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 cursor-pointer"
                >
                  {agent.model && !(agentsConfig?.availableModels || []).includes(agent.model) && (
                    <option value={agent.model}>{agent.model}</option>
                  )}
                  {(agentsConfig?.availableModels || []).map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {changingModel === agent.id && <p className="text-[11px] text-amber-400">切换中...</p>}
              </div>
            </div>
          ))}
          {displayAgents.length === 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 leading-6">
              想要 PM / Dev / Test / Review 四角色并行，至少需要补齐更多 agent 配置或通过 ACP 线程会话调度。
            </div>
          )}
        </div>
      </div>

      {showInstall && <InstallModal onClose={() => setShowInstall(false)} onInstalled={() => window.location.reload()} />}

      {showAddAgent && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddAgent(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">新增 Agent</h3>
              <button onClick={() => setShowAddAgent(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Agent ID（字母/数字/下划线/横线）</label>
                <input
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  placeholder="例如: my-agent"
                  className="w-full px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">选择模型</label>
                <select
                  value={newAgentModel}
                  onChange={(e) => setNewAgentModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="">-- 选择模型 --</option>
                  {(agentsConfig?.availableModels || []).map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowAddAgent(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">取消</button>
                <button
                  onClick={handleAddAgent}
                  disabled={addingAgent}
                  className="px-4 py-2 text-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
                >
                  {addingAgent ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
