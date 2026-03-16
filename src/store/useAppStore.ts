import { create } from 'zustand';
import { apiGet, apiPost } from '../lib/api';
import type { OverviewData, TaskInfo } from '../types';

type ActionName = 'restartGateway' | 'autoRepair' | 'backupConfig' | 'rollbackConfig';

let noticeDismissTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleNoticeDismiss(set: (partial: Partial<AppState>) => void) {
  if (noticeDismissTimer !== null) clearTimeout(noticeDismissTimer);
  noticeDismissTimer = setTimeout(() => {
    set({ notice: null });
    noticeDismissTimer = null;
  }, 4000);
}

interface AppState {
  sidebarCollapsed: boolean;
  overview: OverviewData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  actionLoading: Record<ActionName, boolean>;
  taskStopping: Record<string, boolean>;
  notice: { tone: 'success' | 'error'; message: string } | null;
  setSidebarCollapsed: (value: boolean) => void;
  clearNotice: () => void;
  refresh: () => Promise<void>;
  restartGateway: () => Promise<TaskInfo>;
  autoRepair: () => Promise<TaskInfo>;
  backupConfig: () => Promise<void>;
  rollbackConfig: () => Promise<void>;
  stopTask: (taskId: string) => Promise<void>;
  // W3: Async action placeholders for future API integration
  fetchStatus: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchChannels: () => Promise<void>;
}

const initialActionLoading: Record<ActionName, boolean> = {
  restartGateway: false,
  autoRepair: false,
  backupConfig: false,
  rollbackConfig: false,
};

async function runAction<T>(
  name: ActionName,
  request: () => Promise<T>,
  set: (partial: Partial<AppState>) => void,
  refresh: () => Promise<void>,
  successMessage: string,
): Promise<T> {
  set({
    actionLoading: { ...initialActionLoading, ...({ [name]: true } as Partial<Record<ActionName, boolean>>) },
    notice: null,
  });

  try {
    const result = await request();
    await refresh();
    set({
      actionLoading: initialActionLoading,
      notice: { tone: 'success', message: successMessage },
    });
    scheduleNoticeDismiss(set);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败';
    set({
      actionLoading: initialActionLoading,
      notice: { tone: 'error', message },
    });
    scheduleNoticeDismiss(set);
    throw error;
  }
}

export const useAppStore = create<AppState>()((set, get) => ({
  sidebarCollapsed: false,
  overview: null,
  loading: true,
  error: null,
  refreshing: false,
  actionLoading: initialActionLoading,
  taskStopping: {},
  notice: null,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  clearNotice: () => set({ notice: null }),
  refresh: async () => {
    const firstLoad = !get().overview;
    set({ loading: firstLoad, refreshing: !firstLoad, error: null });
    try {
      const overview = await apiGet<OverviewData>('/api/overview');
      set({ overview, loading: false, refreshing: false, error: null });
    } catch (error) {
      set({
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : '加载失败',
      });
    }
  },
  restartGateway: async () => runAction(
    'restartGateway',
    () => apiPost<TaskInfo>('/api/actions/restart-gateway'),
    set,
    get().refresh,
    '已提交重启任务，请在任务中心查看进度。',
  ),
  autoRepair: async () => runAction(
    'autoRepair',
    () => apiPost<TaskInfo>('/api/actions/auto-repair'),
    set,
    get().refresh,
    '已提交自动修复任务，请在任务中心查看进度。',
  ),
  backupConfig: async () => {
    await runAction(
      'backupConfig',
      () => apiPost('/api/actions/backup-config'),
      set,
      get().refresh,
      '配置备份已创建。',
    );
  },
  rollbackConfig: async () => {
    await runAction(
      'rollbackConfig',
      () => apiPost('/api/actions/rollback-config'),
      set,
      get().refresh,
      '已提交回滚任务，并将自动重启 Gateway。',
    );
  },
  stopTask: async (taskId: string) => {
    set({ taskStopping: { ...get().taskStopping, [taskId]: true }, notice: null });
    try {
      await apiPost(`/api/tasks/${taskId}/stop`);
      await get().refresh();
      const next = { ...get().taskStopping };
      delete next[taskId];
      set({
        taskStopping: next,
        notice: { tone: 'success', message: '已发送停止任务请求。' },
      });
      scheduleNoticeDismiss(set);
    } catch (error) {
      const next = { ...get().taskStopping };
      delete next[taskId];
      set({
        taskStopping: next,
        notice: { tone: 'error', message: error instanceof Error ? error.message : '停止任务失败' },
      });
      scheduleNoticeDismiss(set);
      throw error;
    }
  },
  // W3: Placeholder stubs for future API integration
  fetchStatus: async () => {
    // TODO: fetch agent status from API (e.g., GET /api/status)
  },
  fetchConversations: async () => {
    // TODO: fetch conversations from API (e.g., GET /api/conversations)
  },
  fetchSkills: async () => {
    // TODO: fetch skills from API (e.g., GET /api/skills)
  },
  fetchChannels: async () => {
    // TODO: fetch channels from API (e.g., GET /api/channels)
  },
}));
