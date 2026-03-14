import { X } from 'lucide-react';
import type { Conversation } from '../../types';

interface ConversationDrawerProps {
  conversation: Conversation | null;
  onClose: () => void;
}

export default function ConversationDrawer({ conversation, onClose }: ConversationDrawerProps) {
  if (!conversation) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-white/10 z-50 flex flex-col shadow-2xl animate-[slideIn_0.22s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="font-semibold text-white">{conversation.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{conversation.channel} · {conversation.user} · {conversation.timestamp}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {conversation.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white/8 text-slate-200 border border-white/10 rounded-bl-sm'
                }`}
              >
                {msg.content}
                <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
