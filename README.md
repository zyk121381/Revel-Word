<div align="right">
  <a title="English" href="README_EN.md"><img src="https://img.shields.io/badge/-English-545759?style=for-the-badge" alt="English"></a>
  <a title="简体中文" href="README.md"><img src="https://img.shields.io/badge/-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-A31F34?style=for-the-badge" alt="简体中文"></a>
</div>

<div align="center">

# 🎓 Revel Word - AI 单词特训

**基于 AI 的智能英语单词检测与记忆特训系统，支持多维度的科学记忆训练。**

![Next.js](https://img.shields.io/badge/Next.js-15.4.9-black) ![React](https://img.shields.io/badge/React-19.2.1-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-38B2AC) ![License](https://img.shields.io/badge/license-MIT-green) ![Release](https://img.shields.io/github/v/release/zyk121381/Revel-Word)

</div>


------

## ✨ 功能特性

### 核心功能
- 🤖 **多 AI 支持** - 支持 OpenAI 和 Gemini 两种 AI 提供商
- 📚 **多题型训练** - 英译中、中译英、拼写、补全单词、听音辨意、听音拼写六大题型
- 🧠 **间隔重复算法** - 基于 Spaced Repetition 的科学记忆方法
- 📊 **进度追踪** - 实时统计准确率、学习进度、单词掌握情况
- 🎙️ **语音朗读** - 内置文本转语音功能，辅助发音学习
- 💬 **AI 学习助手** - 实时问答功能，解答单词、语法、用法问题
- 🎨 **精美界面** - 现代化 UI 设计，流畅的动画交互体验
- 🌐 **兼容性** - 支持 OpenAI、Gemini 及各类 OpenAI 兼容 API

### 数据库与用户系统 (可选)
- 🔐 **用户认证** - 基于 JWT 的安全会话管理，支持管理员和普通用户角色
- 📁 **单词单元管理** - 管理员可创建分类和单词单元，AI 自动生成训练题目
- 💾 **学习进度保存** - 支持保存学习进度，下次可继续学习
- 🔄 **智能复习** - 用户可选择多个单元，自定义复习单词数量
- 📈 **练习记录** - 详细记录每次练习的准确率、时间线和错词统计
- 👥 **用户管理** - 管理员可添加/编辑用户，查看用户练习记录并导出数据
- 🎯 **继续学习** - 首页显示未完成的练习，一键继续上次进度

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装步骤

1. 克隆仓库并安装依赖

```bash
npm install
```

2. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

根据你的使用场景选择配置方式：

#### 方式一：开发/学习环境（客户端模式）

适合本地开发、测试学习等场景，API 密钥会暴露在浏览器端：

```env
# AI 提供商选择：openai 或 gemini
NEXT_PUBLIC_AI_PROVIDER="openai"

# OpenAI API 版本
NEXT_PUBLIC_OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_OPENAI_API_BASE="https://api.openai.com/v1"
NEXT_PUBLIC_OPENAI_MODEL="gpt-4o-mini"

# Gemini 版本（可选）
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_GEMINI_MODEL="gemini-3.1-pro-preview"
```

> ⚠️ **注意**：此模式会将 API 密钥暴露到客户端，仅适合个人学习测试。

#### 方式二：生产环境（服务端模式，推荐）

适合部署到服务器，API 密钥只在服务端使用，更安全：

```env
# AI 提供商选择：openai 或 gemini
AI_PROVIDER="openai"

# OpenAI API 配置
OPENAI_API_KEY="your-openai-api-key"
OPENAI_API_BASE="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"

# Gemini API 配置（可选）
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.1-pro-preview"

# 应用 URL（可选）
APP_URL="http://localhost:3000"
```

> ✅ **推荐**：此模式下 API 密钥不会暴露到客户端，安全性更高。

> 💡 OpenAI API 版本支持兼容 OpenAI 的第三方服务，如 OpenRouter、DeepSeek、通义千问、Moonshot 等

### 可选：启用数据库功能

如果要启用用户系统、单词单元管理等高级功能，需配置数据库：

1. 在 `.env` 中添加数据库配置：

```env
# 数据库连接字符串 (PostgreSQL 或 MySQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# 初始管理员账号密码
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_secure_password"

# 用于加密用户登录状态的密钥
JWT_SECRET="your_super_secret_key_here"
```

2. （可选）切换数据库类型：

打开 `prisma/schema.prisma` 文件，第 6 行：
- 使用 PostgreSQL：`provider = "postgresql"` (默认)
- 使用 MySQL：`provider = "mysql"`

3. 同步数据库结构：

```bash
npx prisma db push
```

完成以上步骤后，刷新页面即可看到全新的登录界面和管理后台！

**注意**：如果不配置 `DATABASE_URL`，应用将继续以原有的单机模式运行。

3. 启动开发服务器

```bash
npm run dev
```

4. 打开浏览器访问 `http://localhost:3000`

### 生产构建与部署

构建项目：

```bash
npm run build
```

启动生产服务器：

```bash
npm start
```

**部署注意事项**：
- 在服务器上配置环境变量时，参考上方"安装步骤"中的"方式二：生产环境（服务端模式）"
- 确保使用不带 `NEXT_PUBLIC_` 前缀的变量（如 `OPENAI_API_KEY`），以确保 API 密钥安全
- 建议使用 PM2 或 systemd 等工具管理 Node.js 进程

## 📖 使用方法

1. **输入单词列表** - 输入你想要学习的英语单词（建议每次 10-20 个）
2. **AI 智能分析** - 自动生成单词翻译、词性、例句、干扰项等学习材料
3. **多维度训练** - 通过六种题型全方位强化记忆
4. **查看学习统计** - 实时查看准确率和学习进度
5. **AI 助手答疑** - 随时向 AI 助手提问学习相关问题

### 训练题型说明

| 题型 | 描述 |
|------|------|
| 英译中 | 看英文单词，选择正确的中文翻译 |
| 中译英 | 看中文意思，选择对应的英文单词 |
| 拼写 | 根据中文意思，完整拼写英文单词 |
| 补全单词 | 根据提示，填补单词中缺失的字母 |
| 听音辨意 | 听录音，选择正确的中文意思 |
| 听音拼写 | 听录音，拼写听到的英文单词 |

## 🔧 环境变量说明

### 开发/学习环境（客户端模式）

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `NEXT_PUBLIC_AI_PROVIDER` | AI 提供商（openai/gemini） | ❌ | openai |
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI API 密钥 | 二选一 | - |
| `NEXT_PUBLIC_OPENAI_API_BASE` | OpenAI API 基础 URL | ❌ | https://api.openai.com/v1 |
| `NEXT_PUBLIC_OPENAI_MODEL` | 使用的 OpenAI 模型 | ❌ | gpt-4o-mini |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini API 密钥 | 二选一 | - |
| `NEXT_PUBLIC_GEMINI_MODEL` | 使用的 Gemini 模型 | ❌ | gemini-3.1-pro-preview |

### 生产环境（服务端模式，更安全）

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `AI_PROVIDER` | AI 提供商（openai/gemini） | ❌ | openai |
| `OPENAI_API_KEY` | OpenAI API 密钥 | 二选一 | - |
| `OPENAI_API_BASE` | OpenAI API 基础 URL | ❌ | https://api.openai.com/v1 |
| `OPENAI_MODEL` | 使用的 OpenAI 模型 | ❌ | gpt-4o-mini |
| `GEMINI_API_KEY` | Gemini API 密钥 | 二选一 | - |
| `GEMINI_MODEL` | 使用的 Gemini 模型 | ❌ | gemini-3.1-pro-preview |
| `APP_URL` | 应用部署的 URL | ❌ | http://localhost:3000 |

**安全说明**：
- 客户端模式（`NEXT_PUBLIC_*`）：变量会暴露到浏览器，仅适合本地开发或学习测试
- 服务端模式（不带前缀）：变量只在服务器端使用，不会暴露给客户端，适合生产部署

### 数据库相关 (可选)

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | ❌ | - |
| `ADMIN_USERNAME` | 管理员用户名 | ❌ | admin |
| `ADMIN_PASSWORD` | 管理员密码 | ❌ | - |
| `JWT_SECRET` | JWT 加密密钥 | ❌ | - |

**数据库说明**：
- 支持 PostgreSQL 和 MySQL（在 `prisma/schema.prisma` 中配置）
- 配置后自动启用用户认证、单词单元管理等高级功能
- 未配置时保持单机模式运行

### 支持的模型

**OpenAI 兼容的大语言模型推荐：**
- `gpt-4o` - OpenAI 最新旗舰模型
- `gpt-4o-mini` - 快速且经济实惠（推荐日常使用）
- `step-3.5-flash` - 阶跃星辰高性价比模型
- `deepseek-chat` - DeepSeek 高性价比模型
- `qwen-max` - 通义千问旗舰模型
- `moonshot-v1-8k` - Moonshot 智谱 AI
- `claude-3.5-sonnet` - Anthropic Claude 系列
- 其他所有 OpenAI API 兼容的模型

**Gemini 大语言模型推荐：**
- `gemini-3.1-pro-preview` - Gemini 3.1 Pro（推荐）
- `gemini-3-flash-preview` - Gemini 3 Flash

## 🏗️ 技术栈

- **框架**: Next.js 15.4.9
- **UI 库**: React 19.2.1
- **语言**: TypeScript 5.9.3
- **样式**: Tailwind CSS 4.1.11
- **动画**: Motion (Framer Motion) 12.23.24
- **AI SDK**: OpenAI 4.71.1, Google GenAI 1.17.0
- **图标**: Lucide React 0.553.0
- **Markdown**: react-markdown 10.1.0
- **数据库**: Prisma ORM (可选)
- **认证**: JWT (可选)

## 📁 项目结构

```
revelation-ai-studio-applet/
├── app/                    # Next.js 应用目录
│   ├── api/                # API 路由（服务端）
│   │   ├── chat/           # 聊天 API 端点
│   │   └── generate/       # 内容生成 API 端点
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主应用页面（客户端）
│   ├── actions.ts          # 服务端操作函数
│   └── globals.css         # 全局样式
├── lib/
│   ├── ai-server.ts        # 服务端 AI 服务抽象层
│   ├── ai-service.ts       # 客户端 AI 服务封装
│   ├── auth.ts             # JWT 认证
│   ├── rate-limit.ts       # API 速率限制
│   ├── analyze.ts          # 单词分析
│   └── utils.ts            # 工具函数
├── components/             # React 组件
│   ├── Dashboard.tsx       # 用户仪表盘
│   ├── AdminPanel.tsx      # 管理后台
│   ├── UserPanel.tsx       # 用户面板
│   ├── UnitWordsManager.tsx # 单词单元管理
│   ├── ThemeProvider.tsx   # 主题提供者
│   └── ThemeToggle.tsx     # 主题切换按钮
├── prisma/
│   └── schema.prisma       # 数据库模型定义
├── hooks/
│   └── use-mobile.ts       # 移动端检测 Hook
├── .env.example            # 环境变量示例
├── .env                    # 环境变量（不提交到 Git）
└── package.json            # 项目配置
```

## 🔑 核心算法

### 间隔重复 (Spaced Repetition)

项目采用科学的间隔重复算法优化记忆效果：

1. **初始学习** - 每个单词需完成 3-4 种题型训练
2. **答对策略** - 延迟 2-3 步后再次复习
3. **答错策略** - 立即复习，并将之前未训练的题型自动添加到答题列表中
4. **掌握标准** - 完成所有题型且准确率达到要求

### 进度追踪

- 整体准确率统计
- 各题型独立准确率
- 单词级别正确率
- 学习进度可视化

## 🎨 UI/UX 特点

- 响应式设计，支持移动端和桌面端
- 流畅的页面切换动画
- 即时的答题反馈
- 清晰的进度可视化
- 直观的统计图表

## 🛠️ 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 清理构建文件
npm run clean
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关资源

- [Next.js 文档](https://nextjs.org/docs)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Gemini API 文档](https://ai.google.dev/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

<div align="center">
让学习更智能，让记忆更持久 📚✨
</div>
