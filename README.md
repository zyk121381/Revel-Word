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

- 🤖 **多 AI 支持** - 支持切换 OpenAI 和 Gemini 两种 AI 提供商
- 📚 **多题型训练** - 英译中、中译英、拼写、补全单词、听音辨意、听音拼写六大题型
- 🧠 **间隔重复算法** - 基于 Spaced Repetition 的科学记忆方法
- 📊 **进度追踪** - 实时统计准确率、学习进度、单词掌握情况
- 🎙️ **语音朗读** - 内置文本转语音功能，辅助发音学习
- 💬 **AI 学习助手** - 实时问答功能，解答单词、语法、用法问题
- 🎨 **精美界面** - 现代化 UI 设计，流畅的动画交互体验
- 🌐 **兼容性** - 支持 OpenAI、Gemini 及各类 OpenAI 兼容 API

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

复制 `.env.local.example` 文件为 `.env.local`：

```bash
cp .env.local.example .env.local
```

在 `.env.local` 中配置你的 API 密钥：

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

> 💡 OpenAI API 版本支持兼容 OpenAI 的第三方服务，如 OpenRouter、DeepSeek、通义千问、Moonshot 等

3. 启动开发服务器

```bash
npm run dev
```

4. 打开浏览器访问 `http://localhost:3000`

### 生产构建

```bash
npm run build
npm run start
```

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

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `NEXT_PUBLIC_AI_PROVIDER` | AI 提供商（openai/gemini） | ❌ | openai |
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI API 密钥 | 二选一 | - |
| `NEXT_PUBLIC_OPENAI_API_BASE` | OpenAI API 基础 URL | ❌ | https://api.openai.com/v1 |
| `NEXT_PUBLIC_OPENAI_MODEL` | 使用的 OpenAI 模型 | ❌ | gpt-4o-mini |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini API 密钥 | 二选一 | - |
| `NEXT_PUBLIC_GEMINI_MODEL` | 使用的 Gemini 模型 | ❌ | gemini-3.1-pro-preview |

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

## 📁 项目结构

```
revelation-ai-studio-applet/
├── app/                    # Next.js 应用目录
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主应用页面
│   └── globals.css         # 全局样式
├── lib/
│   ├── ai-service.ts       # AI 服务抽象层
│   └── utils.ts            # 工具函数
├── hooks/
│   └── use-mobile.ts       # 移动端检测 Hook
├── .env.local.example      # 环境变量示例
├── MIGRATION.md            # 迁移指南
└── package.json            # 项目配置
```

## 🔑 核心算法

### 间隔重复 (Spaced Repetition)

项目采用科学的间隔重复算法优化记忆效果：

1. **初始学习** - 每个单词需完成 6 种题型训练
2. **答对策略** - 延迟 2-3 步后再次复习
3. **答错策略** - 立即复习
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
