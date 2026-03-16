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
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV !== 'production';
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

  const sessionItems = (sessions?.sessions || []).map((session) => ({
    id: session.sessionId,
    key: session.key,
    kind: session.kind,
    model: session.model,
    updatedAt: session.updatedAt,
    ageMs: session.ageMs,
    channel: session.key.split(':')[2] || 'main',
    peer: session.key.split(':').slice(3).join(':'),
    tokenUsage: session.totalTokens,
    contextTokens: session.contextTokens,
    title: session.key,
    preview: `模型 ${session.model || 'unknown'} · ${session.kind}`,
  }));

  const backupFiles = await listBackups();
  const connectedChannels = normalizedChannels.filter((item) => item.connected).length;
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
      const overview = await buildOverview();
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
      createReadStream(filePath).pipe(res);
    } catch (error) {
      sendError(res, 500, error.message);
    }
  });

  server.listen(port, () => {
    console.log(`[qclaw] ${isDev ? 'dev' : 'prod'} server running at http://127.0.0.1:${port}`);
  });
}

createApp();
