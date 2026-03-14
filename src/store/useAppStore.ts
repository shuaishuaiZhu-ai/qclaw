import { create } from 'zustand';
import type { AgentStatus, Conversation, Skill, Channel, SystemInfo } from '../types';
import {
  mockAgentStatus,
  mockConversations,
  mockSkills,
  mockChannels,
  mockSystemInfo,
} from '../data/mock';

interface AppState {
  agentStatus: AgentStatus;
  conversations: Conversation[];
  skills: Skill[];
  channels: Channel[];
  systemInfo: SystemInfo;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  agentStatus: mockAgentStatus,
  conversations: mockConversations,
  skills: mockSkills,
  channels: mockChannels,
  systemInfo: mockSystemInfo,
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}));
