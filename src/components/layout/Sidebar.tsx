import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Puzzle, Radio, Settings, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const navItems = [
  { path: '/dashboard', label: '总览', icon: LayoutDashboard },
  { path: '/conversations', label: '会话', icon: MessageSquare },
  { path: '/skills', label: '技能/Agent', icon: Puzzle },
  { path: '/channels', label: '渠道', icon: Radio },
  { path: '/settings', label: '运维', icon: Settings },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const location = useLocation();

  return (
    <aside className={`relative flex flex-col bg-slate-900/80 backdrop-blur border-r border-white/10 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Cpu size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && <span className="font-bold text-white text-lg tracking-tight">Qclaw</span>}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path === '/dashboard' && location.pathname === '/');
          return (
            <NavLink
              key={path}
              to={path}
              title={sidebarCollapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${active ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-700 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-all z-10"
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
