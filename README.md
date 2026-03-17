# qclaw — OpenClaw 可视化管理面板

> 为 [OpenClaw](https://openclaw.ai) 打造的轻量 Web 管理界面，帮助你实时查看 Agent 状态、会话历史、渠道连接情况、技能管理，一切尽在掌控。

---

## ✨ 功能特性

### 📊 Dashboard
- 实时展示 Gateway 状态、已连接渠道数、活跃 Agent 数、可用技能数
- 趋势图、最近动作记录

### 💬 会话管理
- 列出所有活跃 session，支持按渠道筛选、关键词搜索
- 点击 session 查看详情：model、token 用量、最近20条对话内容
- 对话内容自动保存到本地 `workspace/conversations/`

### 🔌 渠道状态
- 实时显示 Feishu、QQBot 等渠道连接状态
- 显示 configured / running / connected 三层状态

### 🧩 技能管理
- 浏览所有已安装技能，支持关键词搜索
- **一键卸载**技能（hover 出现删除按钮）
- **从 ClawHub 安装**：粘贴 SKILL.md 内容即可安装

### 🤖 Agent 管理
- 查看所有已配置 agent 及其 model
- **一键切换默认 Agent**（无需手动编辑配置文件）

### ⚙️ 设置与运维
- 查看/编辑 OpenClaw 配置
- 配置备份与一键回滚
- Gateway 重启、自动修复

---

## 🚀 快速启动

### 依赖
- Node.js v18+
- OpenClaw CLI（已配置）

### 本地开发
```bash
npm install
npm run dev
# 打开 http://localhost:5174
```

### 生产部署
```bash
./start.sh
# 自动构建 + 启动 prod server (port 4174) + ngrok 隧道
```

**公网地址（固定）**: `https://guilefully-unclarifying-shirly.ngrok-free.dev`

---

## 🏗️ 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Node.js HTTP server（原生，无框架） |
| 状态管理 | Zustand |
| 图表 | Recharts |
| 隧道 | ngrok（固定域名）|

---

## 📁 目录结构

```
qclaw/
├── src/
│   ├── pages/          # 页面：Dashboard, Conversations, Channels, Skills, Settings
│   ├── components/     # 复用组件
│   ├── store/          # Zustand store
│   └── lib/            # API 工具
├── server/
│   └── index.mjs       # 后端 API + 静态服务（单文件）
├── start.sh            # 一键启动脚本
└── .qclaw/             # 运行时目录（PID、日志、tunnel）
```

---

## 🔌 API 文档

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/overview` | 系统全览数据 |
| GET | `/api/agents` | Agent 列表及默认配置 |
| POST | `/api/agents/default` | 更改默认 Agent |
| DELETE | `/api/skills/:name` | 卸载技能 |
| POST | `/api/skills/install` | 安装技能（传入 SKILL.md 内容）|
| POST | `/api/actions/backup-config` | 备份配置 |
| POST | `/api/actions/restart-gateway` | 重启 Gateway |
| POST | `/api/actions/rollback-config` | 回滚配置 |
| POST | `/api/tasks/clear-finished` | 清除已完成任务 |
| POST | `/api/tasks/:id/stop` | 停止运行中任务 |

---

## 🛠️ 开发说明

### 关键设计决策
- **单文件后端**：`server/index.mjs` 使用 Node.js 原生 http 模块，零依赖，便于部署
- **isDev 判断**：仅通过 `--dev` CLI 参数，不依赖 `NODE_ENV`
- **渠道状态判断**：`running || connected` 两个条件任一满足即为"已连接"（兼容 Feishu 无 connected 字段）
- **会话内容**：读取 `~/.openclaw/agents/main/sessions/*.jsonl`，保存最近20条

---

## 📝 更新日志

### v1.1.0
- 修复飞书渠道显示"未运行/未连接"的 bug
- 会话页展示最近20条对话内容，保存到本地
- Skills 页支持卸载和安装技能
- Agent 配置支持更改默认 Agent
- 切换隧道为 ngrok 固定域名

### v1.0.0
- 初始版本：Dashboard、会话索引、渠道状态、技能列表、Settings
