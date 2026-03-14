export type AgentStatusType = 'online' | 'idle' | 'offline';

export interface AgentStatus {
  status: AgentStatusType;
  uptime: string;
  totalConversations: number;
  todayConversations: number;
  activeSkills: number;
  activeChannels: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  channel: string;
  channelIcon: string;
  user: string;
  preview: string;
  timestamp: string;
  messageCount: number;
  messages: Message[];
}

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  description: string;
  version: string;
  usageCount: number;
  status: 'active' | 'inactive' | 'error';
  category: string;
  author: string;
  lastUsed: string;
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  todayMessages: number;
  totalMessages: number;
  lastActive: string;
  color: string;
}

export interface SystemInfo {
  version: string;
  nodeVersion: string;
  platform: string;
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  model: string;
  workspace: string;
}

export interface TrendData {
  date: string;
  conversations: number;
  messages: number;
}
