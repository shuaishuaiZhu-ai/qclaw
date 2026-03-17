export type AgentStatusType = 'online' | 'offline' | 'degraded';

export interface ChannelInfo {
  id: string;
  provider: string;
  name: string;
  accountId: string;
  status: 'connected' | 'disconnected' | 'error';
  configured: boolean;
  running: boolean;
  connected: boolean;
  lastActive: number | string | null;
  totalMessages: number;
  todayMessages: number;
  detail?: string | null;
}

export interface SessionMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string | number;
}

export interface SessionInfo {
  id: string;
  key: string;
  kind: string;
  model: string;
  updatedAt: number;
  ageMs?: number;
  channel: string;
  peer: string;
  tokenUsage?: number | null;
  contextTokens?: number;
  title: string;
  preview: string;
  messages?: SessionMessage[];
}

export interface SkillInfo {
  name: string;
  description: string;
  emoji?: string;
  source: string;
  eligible: boolean;
  bundled?: boolean;
}

export interface AgentConfigInfo {
  id: string;
  identityName?: string;
  identityEmoji?: string;
  model?: string;
  isDefault?: boolean;
  workspace?: string;
}

export interface TaskInfo {
  id: string;
  label: string;
  command: string;
  status: 'running' | 'success' | 'failed' | 'stopped';
  startedAt: string;
  finishedAt: string | null;
  exitCode: number | null;
  pid?: number;
  logs: string;
  meta?: Record<string, unknown>;
}

export interface BackupInfo {
  name: string;
  path: string;
  size: number;
  createdAt: string;
}

export interface OverviewData {
  generatedAt: string;
  gateway: {
    status: AgentStatusType;
    reachable: boolean;
    uptimeLabel: string;
    overview: Record<string, unknown>;
  };
  agents: {
    configured: AgentConfigInfo[];
    count: number;
    expectedRoles: string[];
    readyForTeam: boolean;
    guidance: string;
  };
  channels: ChannelInfo[];
  sessions: SessionInfo[];
  skills: SkillInfo[];
  backups: BackupInfo[];
  tasks: TaskInfo[];
  systemInfo: {
    workspace: string;
    model: string;
    configValid: boolean;
    channelCount: number;
    connectedChannels: number;
    totalSessions: number;
    skillCount: number;
    openclawVersion: string;
    gatewayMode: string;
    gatewayBind: string;
  };
  diagnostics: {
    fakeChannelsRisk: boolean;
    notes: string[];
    cliWarnings: { command: string; message: string }[];
  };
}

// Legacy view-model exports kept temporarily so older components still type-check.
export type AgentStatus = {
  status: 'online' | 'idle' | 'offline';
  uptime: string;
  totalConversations: number;
  todayConversations: number;
  activeSkills: number;
  activeChannels: number;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  title: string;
  channel: string;
  channelIcon: string;
  user: string;
  preview: string;
  timestamp: string;
  messageCount: number;
  messages: Message[];
};

export type Skill = {
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
};

export type Channel = {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  todayMessages: number;
  totalMessages: number;
  lastActive: string;
  color: string;
};

export type SystemInfo = {
  version: string;
  nodeVersion: string;
  platform: string;
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  model: string;
  workspace: string;
};

export type TrendData = {
  date: string;
  conversations: number;
  messages: number;
};
