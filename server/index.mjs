import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync, createReadStream } from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const backupDir = path.join(rootDir, '.qclaw', 'backups');
const openclawConfigPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json');
const isDev = process.argv.includes('--dev');
const port = Number(process.env.PORT || (isDev ? 5174 : 4174));

const tasks = new Map();

// --- Overview deduplication + short-lived cache (improvement #1) ---
let overviewInflight = null;  // Promise while inflight
let overviewCache = null;     // { data, expiresAt }

// --- MIME type map for static files (improvement #2) ---
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function stripAnsi(text) {
  return String(text || '').replace(/\u001B\[[0-9;]*[A-Za-z]/g, '');
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message, extra = {}) {
  json(res, status, { ok: false, message, ...extra });
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return sendError(res, 405, `Method not allowed. Use: ${allowed.join(', ')}`);
}

// --- Basic request body parsing (improvement #4) ---
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function resolveDistPath(requestPath) {
  const pathname = decodeURIComponent(requestPath.split('?')[0] || '/');
  const normalized = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const fullPath = path.resolve(distDir, normalized);
  if (!fullPath.startsWith(`${distDir}${path.sep}`) && fullPath !== path.join(distDir, 'index.html')) {
    return null;
  }
  return fullPath;
}

async function ensureBackupDir() {
  await fs.mkdir(backupDir, { recursive: true });
}

function extractJsonPayload(raw) {
  const text = stripAnsi(raw).replace(/^\uFEFF/, '').trim();
  if (!text) return '';

  const isEscaped = (source, index) => {
    let backslashes = 0;
    for (let i = index - 1; i >= 0 && source[i] === '\\'; i -= 1) backslashes += 1;
    return backslashes % 2 === 1;
  };

  for (let start = 0; start < text.length; start += 1) {
    const opener = text[start];
    if (opener !== '{' && opener !== '[') continue;

    const stack = [opener];
    let inString = false;

    for (let i = start + 1; i < text.length; i += 1) {
      const char = text[i];
      if (char === '"' && !isEscaped(text, i)) {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{' || char === '[') {
        stack.push(char);
        continue;
      }

      if (char === '}' || char === ']') {
        const expected = char === '}' ? '{' : '[';
        if (stack[stack.length - 1] !== expected) break;
        stack.pop();
        if (stack.length === 0) {
          const candidate = text.slice(start, i + 1);
          try {
            JSON.parse(candidate);
            return candidate;
          } catch {
            break;
          }
        }
      }
    }
  }

  return '';
}

async function runCliJson(args, timeout = 20000) {
  const { stdout, stderr } = await execFileAsync('openclaw', args, {
    timeout,
    maxBuffer: 1024 * 1024 * 4,
    env: process.env,
  });
  const payload = extractJsonPayload(stdout);
  if (!payload) {
    const preview = String(stdout || '').trim().slice(0, 400);
    throw new Error(`No JSON payload found in openclaw output for: openclaw ${args.join(' ')}${preview ? ` | stdout: ${preview}` : ''}`);
  }
  return { data: JSON.parse(payload), stderr, stdout };
}

async function runCliJsonSafe(args, fallback, timeout = 20000) {
  try {
    return await runCliJson(args, timeout);
  } catch (error) {
    return {
      data: fallback,
      stderr: error instanceof Error ? error.message : String(error),
      stdout: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runCliText(args, timeout = 20000) {
  const { stdout, stderr } = await execFileAsync('openclaw', args, {
    timeout,
    maxBuffer: 1024 * 1024 * 4,
    env: process.env,
  });
  return { stdout, stderr };
}

function parseUptimeFromStatusText(text) {
  const match = text.match(/running \(pid .*?state active\)/);
  return match ? 'running' : 'unknown';
}

function makeTask(command, args, label, meta = {}) {
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const child = spawn(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: false,
  });

  const task = {
    id,
    label,
    command: [command, ...args].join(' '),
    status: 'running',
    startedAt,
    finishedAt: null,
    exitCode: null,
    logs: '',
    meta,
    pid: child.pid,
  };

  // --- Spawn failure handling (improvement #3) ---
  if (child.pid === undefined) {
    task.status = 'failed';
    task.finishedAt = new Date().toISOString();
    task.logs = `[task-error] spawn failed: process did not start (pid undefined). command=${[command, ...args].join(' ')}\n`;
    tasks.set(id, task);
    task.stop = () => false;
    return task;
  }

  const append = (chunk) => {
    task.logs += chunk.toString();
    if (task.logs.length > 20000) {
      task.logs = task.logs.slice(-20000);
    }
  };

  child.stdout.on('data', append);
  child.stderr.on('data', append);
  child.on('error', (error) => {
    task.status = 'failed';
    task.finishedAt = new Date().toISOString();
    task.logs += `\n[task-error] ${error.message}\n`;
  });
  child.on('close', (code, signal) => {
    task.exitCode = code;
    task.finishedAt = new Date().toISOString();
    task.status = signal ? 'stopped' : code === 0 ? 'success' : 'failed';
    if (signal) {
      task.logs += `\n[task-stopped] signal=${signal}\n`;
    }
  });

  task.stop = () => {
    if (task.status !== 'running') return false;
    child.kill('SIGTERM');
    return true;
  };

  tasks.set(id, task);
  return task;
}

async function createConfigBackup(reason = 'manual') {
  if (!existsSync(openclawConfigPath)) {
    throw new Error(`OpenClaw config not found: ${openclawConfigPath}`);
  }
  await ensureBackupDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${stamp}-${reason}.openclaw.json`;
  const target = path.join(backupDir, filename);
  await fs.copyFile(openclawConfigPath, target);
  return { filename, path: target, createdAt: new Date().toISOString() };
}

async function listBackups() {
  await ensureBackupDir();
  const names = await fs.readdir(backupDir);
  const files = await Promise.all(names.map(async (name) => {
    const fullPath = path.join(backupDir, name);
    const stat = await fs.stat(fullPath);
    return {
      name,
      path: fullPath,
      size: stat.size,
      createdAt: stat.mtime.toISOString(),
    };
  }));
  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function buildOverview() {
  const [gatewayResult, channelsResult, sessionsResult, agentsResult, skillsResult, configValidationResult, configText] = await Promise.all([
    runCliJsonSafe(['gateway', 'status', '--json'], null),
    runCliJsonSafe(['channels', 'status', '--json'], null),
    runCliJsonSafe(['sessions', '--json', '--active', '10080'], { sessions: [] }),
    runCliJsonSafe(['agents', 'list', '--json'], []),
    runCliJsonSafe(['skills', 'list', '--json', '--eligible'], { skills: [] }),
    runCliJsonSafe(['config', 'validate', '--json'], { valid: false }),
    fs.readFile(openclawConfigPath, 'utf8').then(JSON.parse).catch(() => ({})),
  ]);

  const gatewayStatus = gatewayResult.data;
  const channelsStatus = channelsResult.data;
  const sessions = sessionsResult.data;
  const agents = agentsResult.data;
  const skills = skillsResult.data;
  const configValidation = configValidationResult.data;

  const channelAccounts = channelsStatus?.channelAccounts ?? {};
  const normalizedChannels = Object.entries(channelAccounts).flatMap(([provider, accounts]) =>
    (accounts || []).map((account) => ({
      id: `${provider}:${account.accountId}`,
      provider,
      name: provider === 'qqbot' ? 'QQ Bot' : provider === 'feishu' ? 'Feishu' : provider,
      accountId: account.accountId,
      status: account.connected || account.running ? 'connected' : account.configured ? 'disconnected' : 'error',
      configured: !!account.configured,
      running: !!account.running,
      connected: !!account.connected,
      lastActive: account.lastInboundAt || account.lastOutboundAt || account.lastConnectedAt || account.lastStartAt || null,
      totalMessages: 0,
      todayMessages: 0,
      detail: account.lastError || null,
    }))
  );

  const sessionsDir = path.join(process.env.HOME || '', '.openclaw', 'agents', 'main', 'sessions');
  const conversationsDir = path.join(process.env.HOME || '', '.openclaw', 'workspace', 'conversations');
  await fs.mkdir(conversationsDir, { recursive: true });

  async function readSessionMessages(sessionId) {
    const filePath = path.join(sessionsDir, `${sessionId}.jsonl`);
    try {
      const text = await fs.readFile(filePath, 'utf8');
      const lines = text.trim().split('\n').filter(Boolean);
      const messages = [];
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const msg = entry.message;
          if (!msg) continue;
          if (msg.role === 'user' || msg.role === 'assistant') {
            let text = '';
            if (typeof msg.content === 'string') {
              text = msg.content;
            } else if (Array.isArray(msg.content)) {
              text = msg.content.filter(c => c.type === 'text').map(c => c.text).join(' ');
            }
            if (text.trim()) {
              messages.push({ role: msg.role, text: text.slice(0, 200), timestamp: entry.timestamp });
            }
          }
        } catch {}
      }
      return messages.slice(-20);
    } catch {
      return [];
    }
  }

  const sessionList = sessions?.sessions || [];
  const sessionMessagesResults = await Promise.allSettled(
    sessionList.map(s => readSessionMessages(s.sessionId))
  );

  const sessionItems = await Promise.all(sessionList.map(async (session, i) => {
    const messages = sessionMessagesResults[i].status === 'fulfilled' ? sessionMessagesResults[i].value : [];
    const channel = session.key.split(':')[2] || 'main';
    const item = {
      id: session.sessionId,
      key: session.key,
      kind: session.kind,
      model: session.model,
      updatedAt: session.updatedAt,
      ageMs: session.ageMs,
      channel,
      peer: session.key.split(':').slice(3).join(':'),
      tokenUsage: session.totalTokens,
      contextTokens: session.contextTokens,
      title: session.key,
      preview: messages.length > 0 ? messages[messages.length - 1].text.slice(0, 80) : `模型 ${session.model || 'unknown'} · ${session.kind}`,
      messages,
    };
    // Save to conversations dir
    try {
      await fs.writeFile(
        path.join(conversationsDir, `${channel}_${session.sessionId}.json`),
        JSON.stringify({ sessionId: session.sessionId, key: session.key, channel, messages, savedAt: Date.now() }, null, 2),
        'utf8'
      );
    } catch {}
    return item;
  }));

  // Keep only 20 most recent per channel
  try {
    const files = await fs.readdir(conversationsDir);
    const channelMap = {};
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const ch = f.split('_')[0];
      if (!channelMap[ch]) channelMap[ch] = [];
      const stat = await fs.stat(path.join(conversationsDir, f));
      channelMap[ch].push({ name: f, mtime: stat.mtimeMs });
    }
    for (const ch of Object.keys(channelMap)) {
      const sorted = channelMap[ch].sort((a, b) => b.mtime - a.mtime);
      for (const old of sorted.slice(20)) {
        await fs.unlink(path.join(conversationsDir, old.name)).catch(() => {});
      }
    }
  } catch {}

  const backupFiles = await listBackups();
  const connectedChannels = normalizedChannels.filter((item) => item.connected || item.running).length;
  const agentCount = Array.isArray(agents) ? agents.length : 0;
  const eligibleSkills = skills?.skills || [];
  const gatewayReachable = gatewayStatus?.probe?.ok ?? gatewayStatus?.health?.ok ?? true;

  const cliWarnings = [
    gatewayResult.error ? { command: 'openclaw gateway status --json', message: gatewayResult.error } : null,
    channelsResult.error ? { command: 'openclaw channels status --json', message: channelsResult.error } : null,
    sessionsResult.error ? { command: 'openclaw sessions --json --active 10080', message: sessionsResult.error } : null,
    agentsResult.error ? { command: 'openclaw agents list --json', message: agentsResult.error } : null,
    skillsResult.error ? { command: 'openclaw skills list --json --eligible', message: skillsResult.error } : null,
    configValidationResult.error ? { command: 'openclaw config validate --json', message: configValidationResult.error } : null,
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    gateway: {
      status: gatewayReachable ? 'online' : 'offline',
      reachable: gatewayReachable,
      service: gatewayStatus?.service ?? gatewayStatus,
      overview: gatewayStatus,
      uptimeLabel: parseUptimeFromStatusText(JSON.stringify(gatewayStatus)),
    },
    agents: {
      configured: agents || [],
      count: agentCount,
      expectedRoles: ['PM', 'Dev', 'Test', 'Review'],
      readyForTeam: agentCount >= 4,
      guidance: agentCount >= 4
        ? '已检测到多 agent 配置。'
        : '当前只检测到少量本地 agent。可通过 openclaw agents add 增加；ACP 线程会话走 sessions_spawn/runtime=acp。',
    },
    channels: normalizedChannels,
    sessions: sessionItems,
    skills: eligibleSkills,
    systemInfo: {
      workspace: configText?.agents?.defaults?.workspace || '',
      model: configText?.agents?.defaults?.model?.primary || '',
      configValid: configValidation?.valid ?? true,
      channelCount: normalizedChannels.length,
      connectedChannels,
      totalSessions: sessionItems.length,
      skillCount: eligibleSkills.length,
      openclawVersion: gatewayStatus?.gateway?.version || gatewayStatus?.version || 'unknown',
      gatewayMode: configText?.gateway?.mode || 'local',
      gatewayBind: configText?.gateway?.bind || 'loopback',
    },
    backups: backupFiles,
    tasks: Array.from(tasks.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(stripTask),
    diagnostics: {
      fakeChannelsRisk: normalizedChannels.some((item) => ['wechat', 'telegram'].includes(item.provider)),
      notes: [
        '渠道和会话均来自本机 OpenClaw 实时状态，不再使用 mock 微信/Telegram 数据。',
        'Gateway 重启后的页面连通性改为 HTTP 拉取，不依赖前端长连缓存。',
      ],
      cliWarnings,
    },
  };
}

function stripTask(task) {
  return {
    id: task.id,
    label: task.label,
    command: task.command,
    status: task.status,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
    exitCode: task.exitCode,
    pid: task.pid,
    logs: task.logs,
    meta: task.meta,
  };
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/overview' && req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  if (req.method === 'GET' && url.pathname === '/api/overview') {
    try {
      // Return cached result if still fresh
      if (overviewCache && Date.now() < overviewCache.expiresAt) {
        return json(res, 200, { ok: true, data: overviewCache.data });
      }
      // Reuse inflight promise if already running
      if (!overviewInflight) {
        overviewInflight = buildOverview().then((data) => {
          overviewCache = { data, expiresAt: Date.now() + 3000 };
          overviewInflight = null;
          return data;
        }).catch((err) => {
          overviewInflight = null;
          throw err;
        });
      }
      const overview = await overviewInflight;
      return json(res, 200, { ok: true, data: overview });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  if (url.pathname === '/api/tasks' && req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  if (req.method === 'GET' && url.pathname === '/api/tasks') {
    return json(res, 200, { ok: true, data: Array.from(tasks.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(stripTask) });
  }

  if (url.pathname === '/api/actions/backup-config' && req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  if (req.method === 'POST' && url.pathname === '/api/actions/backup-config') {
    try {
      const backup = await createConfigBackup('manual');
      return json(res, 200, { ok: true, data: backup });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  if (url.pathname === '/api/actions/restart-gateway' && req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  if (req.method === 'POST' && url.pathname === '/api/actions/restart-gateway') {
    const task = makeTask('openclaw', ['gateway', 'restart'], '重启 Gateway', { kind: 'restart-gateway' });
    return json(res, 202, { ok: true, data: stripTask(task) });
  }

  if (url.pathname === '/api/actions/auto-repair' && req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  if (req.method === 'POST' && url.pathname === '/api/actions/auto-repair') {
    await createConfigBackup('auto-repair');
    const task = makeTask('openclaw', ['doctor', '--repair', '--non-interactive', '--yes'], '自动修复 OpenClaw', { kind: 'auto-repair' });
    return json(res, 202, { ok: true, data: stripTask(task) });
  }

  if (url.pathname === '/api/actions/rollback-config' && req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  if (req.method === 'POST' && url.pathname === '/api/actions/rollback-config') {
    try {
      const backups = await listBackups();
      const latest = backups[0];
      if (!latest) return sendError(res, 404, '没有可回滚的配置备份');
      if (!existsSync(latest.path)) return sendError(res, 404, `备份文件不存在: ${latest.name}`);
      if (existsSync(openclawConfigPath)) {
        await createConfigBackup('pre-rollback');
      }
      await fs.copyFile(latest.path, openclawConfigPath);
      const task = makeTask('openclaw', ['gateway', 'restart'], '回滚配置并重启 Gateway', { kind: 'rollback-config', backup: latest.name });
      return json(res, 202, { ok: true, data: { task: stripTask(task), backup: latest } });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  if (url.pathname === '/api/tasks/clear-finished' && req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  if (req.method === 'POST' && url.pathname === '/api/tasks/clear-finished') {
    let cleared = 0;
    for (const [id, task] of tasks.entries()) {
      if (task.status !== 'running') {
        tasks.delete(id);
        cleared++;
      }
    }
    return json(res, 200, { ok: true, cleared });
  }

  if (/^\/api\/tasks\/[^/]+\/stop$/.test(url.pathname) && req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  if (req.method === 'POST' && /^\/api\/tasks\/[^/]+\/stop$/.test(url.pathname)) {
    const id = url.pathname.split('/')[3];
    const task = tasks.get(id);
    if (!task) return sendError(res, 404, '任务不存在');
    if (!task.stop()) return sendError(res, 400, '任务当前不可停止');
    return json(res, 200, { ok: true, data: stripTask(task) });
  }

  // ── Agent management APIs ────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/agents') {
    try {
      const config = await fs.readFile(openclawConfigPath, 'utf8').then(JSON.parse).catch(() => ({}));
      const agentsConfig = config.agents || {};
      const defaultAgent = agentsConfig.default || 'main';
      const list = agentsConfig.list || [];
      // Build available models list from config
      const defaultModels = config.agents?.defaults?.models || {};
      const providers = config.models?.providers || {};
      const availableModels = [];
      for (const [provider, conf] of Object.entries(providers)) {
        for (const m of (conf.models || [])) {
          availableModels.push(`${provider}/${m.id}`);
        }
      }
      // Also add github-copilot models from defaults.models that aren't in providers
      for (const modelId of Object.keys(defaultModels)) {
        if (!availableModels.includes(modelId)) availableModels.push(modelId);
      }
      return json(res, 200, { ok: true, data: { default: defaultAgent, list, availableModels } });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/agents/model') {
    try {
      const body = await readBody(req);
      const { agentId, model } = body;
      if (!agentId || !model) return sendError(res, 400, 'agentId 和 model 不能为空');
      const configText = await fs.readFile(openclawConfigPath, 'utf8');
      const config = JSON.parse(configText);
      if (!config.agents?.list) return sendError(res, 400, '配置中没有 agents.list');
      const agent = config.agents.list.find((a) => a.id === agentId);
      if (!agent) return sendError(res, 400, `Agent "${agentId}" 不存在`);
      agent.model = model;
      // Also update defaults primary model if it's the main agent
      if (agentId === 'main' && config.agents?.defaults?.model) {
        config.agents.defaults.model.primary = model;
      }
      await fs.writeFile(openclawConfigPath, JSON.stringify(config, null, 2), 'utf8');
      return json(res, 200, { ok: true, message: `Agent "${agentId}" 模型已更新为 ${model}` });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/agents/default') {
    try {
      const body = await readBody(req);
      const { agentId } = body;
      if (!agentId) return sendError(res, 400, 'agentId 不能为空');
      const configText = await fs.readFile(openclawConfigPath, 'utf8');
      const config = JSON.parse(configText);
      if (!config.agents) return sendError(res, 400, '配置中没有 agents 字段');
      const list = config.agents.list || [];
      if (!list.find((a) => a.id === agentId)) {
        return sendError(res, 400, `Agent "${agentId}" 不在 agents.list 中`);
      }
      config.agents.default = agentId;
      await fs.writeFile(openclawConfigPath, JSON.stringify(config, null, 2), 'utf8');
      return json(res, 200, { ok: true, message: `默认 agent 已更新为 ${agentId}` });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  // ── Skills management APIs ───────────────────────────────────────────────
  if (req.method === 'DELETE' && url.pathname.startsWith('/api/skills/')) {
    try {
      const skillName = decodeURIComponent(url.pathname.slice('/api/skills/'.length));
      if (!skillName || skillName.includes('/') || skillName.includes('..')) {
        return sendError(res, 400, '无效的技能名称');
      }
      const skillsDir = path.join(process.env.HOME || '', '.agents', 'skills');
      const skillPath = path.join(skillsDir, skillName);
      if (!skillPath.startsWith(skillsDir + path.sep)) return sendError(res, 400, '路径不安全');
      await fs.rm(skillPath, { recursive: true, force: true });
      return json(res, 200, { ok: true, message: `技能 ${skillName} 已卸载` });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/skills/install') {
    try {
      const body = await readBody(req);
      const { name, skillmdContent } = body;
      if (!name || name.includes('/') || name.includes('..')) return sendError(res, 400, '无效的技能名称');
      if (!skillmdContent) return sendError(res, 400, 'skillmdContent 不能为空');
      const skillsDir = path.join(process.env.HOME || '', '.agents', 'skills');
      const skillPath = path.join(skillsDir, name);
      await fs.mkdir(skillPath, { recursive: true });
      await fs.writeFile(path.join(skillPath, 'SKILL.md'), skillmdContent, 'utf8');
      return json(res, 200, { ok: true, message: `技能 ${name} 安装成功` });
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  return sendError(res, 404, `Unknown API endpoint: ${url.pathname}`);
}

async function createApp() {
  let vite;
  if (isDev) {
    const { createServer } = await import('vite');
    vite = await createServer({
      root: rootDir,
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/api/')) {
        return await handleApi(req, res);
      }

      if (isDev && vite) {
        vite.middlewares(req, res, () => {});
        return;
      }

      const target = resolveDistPath(req.url || '/');
      if (!target) {
        return sendError(res, 403, 'Forbidden path');
      }
      const filePath = existsSync(target) ? target : path.join(distDir, 'index.html');
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      createReadStream(filePath).pipe(res);
    } catch (error) {
      sendError(res, 500, error.message);
    }
  });

  server.listen(port, () => {
    console.log(`[qclaw] ${isDev ? 'dev' : 'prod'} server running at http://127.0.0.1:${port}`);
  });

  // --- Graceful shutdown (improvement #5) ---
  function shutdown(signal) {
    console.log(`[qclaw] received ${signal}, shutting down...`);
    for (const task of tasks.values()) {
      if (task.status === 'running' && task.stop) {
        task.stop();
      }
    }
    server.close(() => {
      console.log('[qclaw] HTTP server closed.');
      process.exit(0);
    });
    // Force exit after 5s if server doesn't close cleanly
    setTimeout(() => process.exit(1), 5000).unref();
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

createApp();
