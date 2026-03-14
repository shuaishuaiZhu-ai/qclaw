import type { AgentStatus, Conversation, Skill, Channel, SystemInfo, TrendData } from '../types';

export const mockAgentStatus: AgentStatus = {
  status: 'online',
  uptime: '3天 14小时 22分钟',
  totalConversations: 1247,
  todayConversations: 42,
  activeSkills: 18,
  activeChannels: 4,
};

export const mockTrendData: TrendData[] = [
  { date: '03-08', conversations: 28, messages: 134 },
  { date: '03-09', conversations: 35, messages: 178 },
  { date: '03-10', conversations: 22, messages: 96 },
  { date: '03-11', conversations: 48, messages: 231 },
  { date: '03-12', conversations: 56, messages: 287 },
  { date: '03-13', conversations: 39, messages: 193 },
  { date: '03-14', conversations: 42, messages: 214 },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    title: '帮我查一下明天的天气',
    channel: '飞书',
    channelIcon: '🪶',
    user: 'shuaishuai',
    preview: '帮我查一下明天北京的天气，我要出门',
    timestamp: '2026-03-14 15:30',
    messageCount: 4,
    messages: [
      { id: 'm1', role: 'user', content: '帮我查一下明天北京的天气，我要出门', timestamp: '15:30:01' },
      { id: 'm2', role: 'assistant', content: '明天北京天气：晴转多云，气温 8~18°C，东风3级，适合出行，建议带一件外套。', timestamp: '15:30:03' },
      { id: 'm3', role: 'user', content: '会下雨吗', timestamp: '15:30:15' },
      { id: 'm4', role: 'assistant', content: '明天降水概率 10%，基本不会下雨，放心出门！', timestamp: '15:30:17' },
    ],
  },
  {
    id: 'c2',
    title: 'GitHub PR #142 代码审查',
    channel: '飞书',
    channelIcon: '🪶',
    user: 'shuaishuai',
    preview: '帮我看看 openclaw/openclaw 的 PR #142 有什么问题',
    timestamp: '2026-03-14 14:15',
    messageCount: 6,
    messages: [
      { id: 'm1', role: 'user', content: '帮我看看 openclaw/openclaw 的 PR #142 有什么问题', timestamp: '14:15:00' },
      { id: 'm2', role: 'assistant', content: 'PR #142 标题：feat: add skill hot-reload support\n\n主要变更：\n- 新增 skill 热重载功能\n- 修改了 SkillManager 的加载逻辑\n- 添加了文件监听器\n\n潜在问题：\n1. 文件监听器没有 cleanup，可能内存泄漏\n2. 缺少错误边界处理', timestamp: '14:15:05' },
      { id: 'm3', role: 'user', content: '帮我写一个 review 评论', timestamp: '14:16:00' },
      { id: 'm4', role: 'assistant', content: '好的，已为你生成 review 评论：\n\n"Great feature! A few suggestions:\n1. The file watcher in `SkillManager.ts:L89` needs cleanup on dispose to prevent memory leaks\n2. Consider wrapping the dynamic import in try-catch for better error handling\n\nOverall LGTM with these minor fixes 👍"', timestamp: '14:16:08' },
    ],
  },
  {
    id: 'c3',
    title: '今天有什么日程？',
    channel: 'Telegram',
    channelIcon: '✈️',
    user: 'shuaishuai',
    preview: '今天有什么日程，帮我看一下',
    timestamp: '2026-03-14 09:00',
    messageCount: 3,
    messages: [
      { id: 'm1', role: 'user', content: '今天有什么日程，帮我看一下', timestamp: '09:00:01' },
      { id: 'm2', role: 'assistant', content: '今天 (3月14日) 的日程：\n\n📅 10:00 - 产品周会（飞书会议）\n📅 14:00 - 与设计师对齐 UI 稿\n📅 16:30 - Code Review 例会\n📅 19:00 - 健身\n\n共4个日程，祝工作顺利！', timestamp: '09:00:05' },
      { id: 'm3', role: 'user', content: '把下午2点的会议推到3点', timestamp: '09:01:00' },
    ],
  },
  {
    id: 'c4',
    title: '帮我写一封邮件',
    channel: '微信',
    channelIcon: '💬',
    user: 'shuaishuai',
    preview: '帮我写一封给客户的感谢邮件',
    timestamp: '2026-03-13 17:45',
    messageCount: 5,
    messages: [
      { id: 'm1', role: 'user', content: '帮我写一封给客户的感谢邮件，他们刚完成了一个大项目', timestamp: '17:45:00' },
      { id: 'm2', role: 'assistant', content: '主题：感谢贵司的信任与合作\n\n尊敬的XXX总，\n\n感谢贵司对我们团队的信任，历经三个月的紧密合作，项目圆满收官。您的专业态度和高效决策是项目成功的关键。期待未来有更多合作机会！\n\n此致敬礼\nshuaishuai', timestamp: '17:45:10' },
    ],
  },
  {
    id: 'c5',
    title: '学术论文搜索',
    channel: 'QQ',
    channelIcon: '🐧',
    user: 'shuaishuai',
    preview: '帮我找几篇关于 LLM Agent 的最新论文',
    timestamp: '2026-03-13 11:20',
    messageCount: 8,
    messages: [
      { id: 'm1', role: 'user', content: '帮我找几篇关于 LLM Agent 的最新论文', timestamp: '11:20:00' },
      { id: 'm2', role: 'assistant', content: '找到以下最新相关论文：\n\n1. "ReAct: Synergizing Reasoning and Acting in Language Models" (2023)\n2. "Toolformer: Language Models Can Teach Themselves to Use Tools" (2023)\n3. "AutoGPT: An Autonomous GPT-4 Experiment" (2023)\n4. "AgentBench: Evaluating LLMs as Agents" (2023)\n\n需要我详细介绍哪篇？', timestamp: '11:20:08' },
    ],
  },
  {
    id: 'c6',
    title: 'Qclaw 项目进展汇报',
    channel: '飞书',
    channelIcon: '🪶',
    user: 'shuaishuai',
    preview: '你现在进度怎么样了',
    timestamp: '2026-03-14 15:36',
    messageCount: 2,
    messages: [
      { id: 'm1', role: 'user', content: '你现在进度怎么样了，每半小时给我报告下你的进度', timestamp: '15:36:00' },
      { id: 'm2', role: 'assistant', content: '已启动多 Agent 开发流水线！\n\n✅ 阶段1 - PRD 需求文档完成\n🔄 阶段2 - Dev Agent 正在开发 React 项目\n⏳ 阶段3 - 测试&Review 等待中\n⏳ 阶段4 - GitHub 发布等待中', timestamp: '15:36:05' },
    ],
  },
];

export const mockSkills: Skill[] = [
  { id: 's1', name: 'feishu-doc', emoji: '📄', description: '读取飞书文档、Wiki 内容，支持 Markdown 转换', version: '1.2.7', usageCount: 234, status: 'active', category: '生产力', author: 'OpenClaw Team', lastUsed: '5分钟前' },
  { id: 's2', name: 'weather', emoji: '🌤️', description: '获取全球天气预报，支持多城市查询', version: '1.0.3', usageCount: 89, status: 'active', category: '实用工具', author: 'OpenClaw Team', lastUsed: '1小时前' },
  { id: 's3', name: 'github', emoji: '🐙', description: 'GitHub PR/Issue 管理，CI 状态查看', version: '2.1.0', usageCount: 156, status: 'active', category: '开发工具', author: 'OpenClaw Team', lastUsed: '2小时前' },
  { id: 's4', name: 'apple-calendar', emoji: '📅', description: 'macOS 日历管理，增删查改日程', version: '1.0.2', usageCount: 67, status: 'active', category: '效率', author: 'community', lastUsed: '今天09:00' },
  { id: 's5', name: 'notion', emoji: '📝', description: 'Notion 页面和数据库管理', version: '1.1.0', usageCount: 43, status: 'active', category: '笔记', author: 'community', lastUsed: '昨天' },
  { id: 's6', name: 'agent-browser', emoji: '🌐', description: '浏览器自动化，网页截图、表单填写', version: '2.0.1', usageCount: 78, status: 'active', category: '自动化', author: 'OpenClaw Team', lastUsed: '刚刚' },
  { id: 's7', name: 'summarize', emoji: '📋', description: '总结 URL、播客、本地文件内容', version: '1.0.1', usageCount: 112, status: 'active', category: '内容处理', author: 'OpenClaw Team', lastUsed: '3小时前' },
  { id: 's8', name: 'aminer-data-search', emoji: '🔬', description: 'AMiner 学术数据查询，论文/学者/机构分析', version: '1.0.5', usageCount: 29, status: 'active', category: '学术', author: 'AMiner', lastUsed: '昨天' },
  { id: 's9', name: 'feishu-cron-reminder', emoji: '⏰', description: '飞书定时提醒，支持周期性通知', version: '1.0.0', usageCount: 15, status: 'active', category: '提醒', author: 'community', lastUsed: '2天前' },
  { id: 's10', name: 'nano-pdf', emoji: '📑', description: '用自然语言指令编辑 PDF 文件', version: '1.0.0', usageCount: 8, status: 'active', category: '文档处理', author: 'OpenClaw Team', lastUsed: '3天前' },
  { id: 's11', name: 'apple-remind-me', emoji: '🔔', description: 'macOS 原生提醒事项集成', version: '1.0.1', usageCount: 34, status: 'active', category: '效率', author: 'community', lastUsed: '今天' },
  { id: 's12', name: 'web-search-tavily', emoji: '🔍', description: 'Tavily 高质量网络搜索，支持过滤', version: '1.0.2', usageCount: 201, status: 'active', category: '搜索', author: 'community', lastUsed: '30分钟前' },
  { id: 's13', name: 'autoglm-generate-image', emoji: '🎨', description: 'AI 文生图，根据文字描述生成图片', version: '1.0.0', usageCount: 22, status: 'active', category: 'AI 生成', author: 'AutoGLM', lastUsed: '昨天' },
  { id: 's14', name: 'feishu-send-file', emoji: '📤', description: '发送文件/附件到飞书群或用户', version: '1.0.0', usageCount: 19, status: 'active', category: '通讯', author: 'community', lastUsed: '2天前' },
  { id: 's15', name: 'pdf-extraction', emoji: '📰', description: '从 PDF 提取文字、表格和元数据', version: '1.0.1', usageCount: 31, status: 'active', category: '文档处理', author: 'community', lastUsed: '1天前' },
  { id: 's16', name: 'docx-manipulation', emoji: '📃', description: '用 python-docx 创建和编辑 Word 文档', version: '1.0.0', usageCount: 14, status: 'active', category: '文档处理', author: 'community', lastUsed: '4天前' },
  { id: 's17', name: 'git-essentials', emoji: '🌿', description: 'Git 版本控制工作流，分支管理和协作', version: '1.0.0', usageCount: 87, status: 'active', category: '开发工具', author: 'OpenClaw Team', lastUsed: '今天' },
  { id: 's18', name: 'self-reflection', emoji: '🪞', description: '定期自我复盘，分析并写入改进洞察', version: '1.0.0', usageCount: 6, status: 'inactive', category: '元认知', author: 'community', lastUsed: '7天前' },
];

export const mockChannels: Channel[] = [
  { id: 'ch1', name: '飞书', icon: '🪶', status: 'connected', todayMessages: 127, totalMessages: 8934, lastActive: '刚刚', color: '#3B82F6' },
  { id: 'ch2', name: '微信', icon: '💬', status: 'connected', todayMessages: 43, totalMessages: 3241, lastActive: '10分钟前', color: '#22C55E' },
  { id: 'ch3', name: 'Telegram', icon: '✈️', status: 'connected', todayMessages: 28, totalMessages: 1567, lastActive: '1小时前', color: '#06B6D4' },
  { id: 'ch4', name: 'QQ', icon: '🐧', status: 'connected', todayMessages: 16, totalMessages: 892, lastActive: '3小时前', color: '#6366F1' },
  { id: 'ch5', name: 'Discord', icon: '🎮', status: 'disconnected', todayMessages: 0, totalMessages: 234, lastActive: '2天前', color: '#8B5CF6' },
  { id: 'ch6', name: 'Signal', icon: '🔒', status: 'disconnected', todayMessages: 0, totalMessages: 0, lastActive: '未连接', color: '#64748B' },
];

export const mockSystemInfo: SystemInfo = {
  version: 'v2.1.0',
  nodeVersion: 'v24.14.0',
  platform: 'Darwin arm64 (MacBook Air)',
  uptime: '3天 14小时 22分钟',
  memoryUsage: 68,
  cpuUsage: 12,
  diskUsage: 34,
  model: 'claude-sonnet-4.6 (github-copilot)',
  workspace: '/Users/shuaishuai/.openclaw/workspace',
};
