import { useMemo, useState } from 'react';
import { Search, X, Copy, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { SessionInfo } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(updatedAt: number): string {
  const diffMs = Date.now() - updatedAt;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}个月前`;
  return `${Math.floor(diffMonth / 12)}年前`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ageHuman(ageMs?: number): string {
  if (!ageMs) return '—';
  const sec = Math.floor(ageMs / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  if (day > 0) return `${day} days ago`;
  if (hour > 0) return `${hour} hours ago`;
  if (min > 0) return `${min} minutes ago`;
  return `${sec} seconds ago`;
}

// ── channel badge ─────────────────────────────────────────────────────────────

type ChannelColor = { bg: string; text: string; border: string };

function channelStyle(channel: string): ChannelColor {
  if (channel.includes('feishu')) return { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' };
  if (channel.includes('qqbot')) return { bg: 'bg-green-500/15', text: 'text-green-300', border: 'border-green-500/30' };
  if (channel.includes('subagent')) return { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' };
  return { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' };
}

function ChannelBadge({ channel }: { channel: string }) {
  const { bg, text, border } = channelStyle(channel);
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full border ${bg} ${text} ${border}`}>
      {channel.split(':')[0]}
    </span>
  );
}

// ── detail drawer ─────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="text-sm text-white break-all">{children}</div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} className="ml-1 text-slate-500 hover:text-white transition-colors inline-flex">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

function SessionDrawer({ session, onClose }: { session: SessionInfo; onClose: () => void }) {
  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-[#0f1117] border-l border-white/10 shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Session 详情</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <DetailRow label="Session Key">
            <span className="font-mono text-xs">{session.key}</span>
            <CopyButton value={session.key} />
          </DetailRow>
          <DetailRow label="Session ID">
            <span className="font-mono text-xs text-slate-300">{session.id}</span>
            <CopyButton value={session.id} />
          </DetailRow>
          <DetailRow label="Channel">
            <ChannelBadge channel={session.channel} />
          </DetailRow>
          {session.peer && (
            <DetailRow label="Peer">
              <span className="text-slate-300 text-xs">{session.peer}</span>
            </DetailRow>
          )}
          <DetailRow label="Model">
            <span className="text-indigo-300">{session.model}</span>
          </DetailRow>
          <DetailRow label="Kind">
            <span className="text-slate-300">{session.kind}</span>
          </DetailRow>
          {(session.tokenUsage != null || session.contextTokens != null) && (
            <DetailRow label="Token Usage">
              <span className="text-amber-300">
                {session.tokenUsage != null ? `${session.tokenUsage.toLocaleString()} tokens` : '—'}
                {session.contextTokens != null ? ` (ctx: ${session.contextTokens.toLocaleString()})` : ''}
              </span>
            </DetailRow>
          )}
          <DetailRow label="Last Updated">
            <span className="text-slate-300">{formatDate(session.updatedAt)}</span>
          </DetailRow>
          <DetailRow label="Age">
            <span className="text-slate-300">{ageHuman(session.ageMs)}</span>
          </DetailRow>
          {session.preview && (
            <DetailRow label="Preview">
              <span className="text-slate-400 text-xs leading-relaxed">{session.preview}</span>
            </DetailRow>
          )}
        </div>
      </div>
    </>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Conversations() {
  const overview = useAppStore((state) => state.overview);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('全部');
  const [selected, setSelected] = useState<SessionInfo | null>(null);

  const channelOptions = useMemo(
    () => ['全部', ...new Set((overview?.sessions || []).map((item) => item.channel))],
    [overview?.sessions],
  );

  if (!overview) return null;

  const sessions = overview.sessions.filter((item) => {
    const matchSearch = !search || item.key.includes(search) || item.preview.includes(search);
    const matchChannel = channel === '全部' || item.channel === channel;
    return matchSearch && matchChannel;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">真实会话索引</h1>
        <p className="text-slate-400 text-sm mt-1">来自 openclaw sessions --json。当前版本不再展示假的消息正文。</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 session key / model..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {channelOptions.map((item) => (
            <button
              key={item}
              onClick={() => setChannel(item)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                channel === item
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => setSelected(session)}
            className="rounded-xl bg-white/5 border border-white/10 p-4 cursor-pointer hover:bg-white/8 hover:border-white/20 transition-all"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <ChannelBadge channel={session.channel} />
                  <p className="text-sm text-white font-mono truncate max-w-[300px]">{session.key}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{session.preview}</p>
              </div>
              <div className="text-right text-xs text-slate-500 shrink-0 space-y-1">
                <div className="text-slate-400 truncate max-w-[140px]" title={session.model}>
                  {session.model.length > 20 ? session.model.slice(0, 20) + '…' : session.model}
                </div>
                <div className="text-slate-600">{session.kind}</div>
                <div className="text-slate-500">{relativeTime(session.updatedAt)}</div>
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <div className="text-slate-500 py-10 text-center">没有匹配的会话</div>}
      </div>

      {selected && <SessionDrawer session={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
