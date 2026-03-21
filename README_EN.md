<div align="right">
  <a title="English" href="README_EN.md"><img src="https://img.shields.io/badge/-English-A31F34?style=for-the-badge" alt="English" /></a>
  <a title="简体中文" href="README.md"><img src="https://img.shields.io/badge/-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-545759?style=for-the-badge" alt="简体中文"></a>
</div>

<div align="center">

# 🎓 Revel Word - AI Vocabulary Training

**An intelligent English vocabulary learning and memory training system powered by AI, featuring multi-dimensional scientific memory training.**

![Next.js](https://img.shields.io/badge/Next.js-15.4.9-black) ![React](https://img.shields.io/badge/React-19.2.1-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-38B2AC) ![License](https://img.shields.io/badge/license-MIT-green) ![Release](https://img.shields.io/github/v/release/zyk121381/Revel-Word)

</div>


------

## ✨ Features

- 🤖 **Multi-AI Support** - Switch between OpenAI and Gemini AI providers
- 📚 **Multiple Exercise Types** - Six training types: EN→ZH, ZH→EN, Spelling, Fill-in-blank, Listening to ZH, Listening Spelling
- 🧠 **Spaced Repetition Algorithm** - Scientific memory method based on Spaced Repetition
- 📊 **Progress Tracking** - Real-time statistics on accuracy, learning progress, and word mastery
- 🎙️ **Text-to-Speech** - Built-in TTS for pronunciation assistance
- 💬 **AI Learning Assistant** - Real-time Q&A for vocabulary, grammar, and usage questions
- 🎨 **Beautiful UI** - Modern interface with smooth animations and interactions
- 🌐 **Compatibility** - Supports OpenAI, Gemini, and various OpenAI-compatible APIs

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository and install dependencies

```bash
npm install
```

2. Configure environment variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Choose the configuration method based on your use case:

#### Option 1: Development/Learning Environment (Client-side Mode)

Suitable for local development, testing, and learning. API keys will be exposed on the client side:

```env
# AI Provider Selection: openai or gemini
NEXT_PUBLIC_AI_PROVIDER="openai"

# OpenAI API version
NEXT_PUBLIC_OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_OPENAI_API_BASE="https://api.openai.com/v1"
NEXT_PUBLIC_OPENAI_MODEL="gpt-4o-mini"

# Gemini version (optional)
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_GEMINI_MODEL="gemini-3.1-pro-preview"
```

> ⚠️ **Note**: This mode exposes API keys to the client side, only suitable for personal learning and testing.

#### Option 2: Production Environment (Server-side Mode, Recommended)

Suitable for server deployment. API keys are only used on the server side, more secure:

```env
# AI Provider Selection: openai or gemini
AI_PROVIDER="openai"

# OpenAI API Configuration
OPENAI_API_KEY="your-openai-api-key"
OPENAI_API_BASE="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"

# Gemini API Configuration (optional)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.1-pro-preview"

# Application URL (optional)
APP_URL="http://localhost:3000"
```

> ✅ **Recommended**: In this mode, API keys are not exposed to the client side, providing higher security.

> 💡 OpenAI API version supports third-party services compatible with OpenAI API, such as OpenRouter, DeepSeek, Qwen, Moonshot, etc.

3. Start the development server

```bash
npm run dev
```

4. Open your browser and visit `http://localhost:3000`

### Production Build & Deployment

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

**Deployment Notes**:
- When configuring environment variables on the server, refer to "Option 2: Production Environment (Server-side Mode)" in the "Installation" section above
- Ensure you use variables without the `NEXT_PUBLIC_` prefix (such as `OPENAI_API_KEY`) for API key security
- Consider using PM2 or systemd for managing the Node.js process

## 📖 How to Use

1. **Enter Word List** - Input English words you want to learn (10-20 words recommended per session)
2. **AI Intelligent Analysis** - Automatically generates translations, parts of speech, example sentences, and distractors
3. **Multi-dimensional Training** - Strengthen memory through six exercise types
4. **View Learning Statistics** - Real-time tracking of accuracy and learning progress
5. **AI Assistant Q&A** - Ask the AI assistant anytime for learning-related questions

### Exercise Types

| Type | Description |
|------|-------------|
| English to Chinese | See English word, select correct Chinese translation |
| Chinese to English | See Chinese meaning, select corresponding English word |
| Spelling | Spell the complete English word based on Chinese meaning |
| Fill in Blank | Fill in missing letters based on hints |
| Listening to Chinese | Listen to audio, select correct Chinese meaning |
| Listening Spelling | Spell the word based on audio |

## 🔧 Environment Variables

### Development/Learning Environment (Client-side Mode)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_AI_PROVIDER` | AI provider (openai/gemini) | ❌ | openai |
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI API key | Choose one | - |
| `NEXT_PUBLIC_OPENAI_API_BASE` | OpenAI API base URL | ❌ | https://api.openai.com/v1 |
| `NEXT_PUBLIC_OPENAI_MODEL` | OpenAI model to use | ❌ | gpt-4o-mini |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Gemini API key | Choose one | - |
| `NEXT_PUBLIC_GEMINI_MODEL` | Gemini model to use | ❌ | gemini-3.1-pro-preview |

### Production Environment (Server-side Mode, More Secure)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AI_PROVIDER` | AI provider (openai/gemini) | ❌ | openai |
| `OPENAI_API_KEY` | OpenAI API key | Choose one | - |
| `OPENAI_API_BASE` | OpenAI API base URL | ❌ | https://api.openai.com/v1 |
| `OPENAI_MODEL` | OpenAI model to use | ❌ | gpt-4o-mini |
| `GEMINI_API_KEY` | Gemini API key | Choose one | - |
| `GEMINI_MODEL` | Gemini model to use | ❌ | gemini-3.1-pro-preview |
| `APP_URL` | Application deployment URL | ❌ | http://localhost:3000 |

**Security Notes**:
- Client-side mode (`NEXT_PUBLIC_*`): Variables are exposed to the browser, only suitable for local development or learning/testing
- Server-side mode (without prefix): Variables are only used on the server and not exposed to the client, suitable for production deployment

### Supported Models

**Recommended OpenAI-Compatible LLMs:**
- `gpt-4o` - OpenAI's latest flagship model
- `gpt-4o-mini` - Fast and cost-effective (recommended for daily use)
- `step-3.5-flash` - StepFun high cost-performance model
- `deepseek-chat` - DeepSeek high cost-performance model
- `qwen-max` - Alibaba Qwen flagship model
- `moonshot-v1-8k` - Moonshot Zhipu AI
- `claude-3.5-sonnet` - Anthropic Claude series
- All other OpenAI API compatible models

**Recommended Gemini LLMs:**
- `gemini-3.1-pro-preview` - Gemini 3.1 Pro (recommended)
- `gemini-3-flash-preview` - Gemini 3 Flash

## 🏗️ Tech Stack

- **Framework**: Next.js 15.4.9
- **UI Library**: React 19.2.1
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.1.11
- **Animation**: Motion (Framer Motion) 12.23.24
- **AI SDK**: OpenAI 4.71.1, Google GenAI 1.17.0
- **Icons**: Lucide React 0.553.0
- **Markdown**: react-markdown 10.1.0

## 📁 Project Structure

```
revelation-ai-studio-applet/
├── app/                    # Next.js app directory
│   ├── api/                # API Routes (server-side)
│   │   ├── chat/           # Chat API endpoint
│   │   └── generate/       # Content generation API endpoint
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application page (client-side)
│   └── globals.css         # Global styles
├── lib/
│   ├── ai-server.ts        # Server-side AI service abstraction layer
│   ├── ai-service.ts       # Client-side AI service wrapper
│   ├── rate-limit.ts       # API rate limiting
│   └── utils.ts            # Utility functions
├── hooks/
│   └── use-mobile.ts       # Mobile detection hook
├── components/             # React components
│   ├── ThemeProvider.tsx   # Theme provider
│   └── ThemeToggle.tsx     # Theme toggle button
├── .env.local.example      # Environment variables example
├── .env.local              # Local environment variables (not committed to Git)
└── package.json            # Project configuration
```

## 🔑 Core Algorithms

### Spaced Repetition

The project uses the scientifically proven Spaced Repetition algorithm to optimize memory retention:

1. **Initial Learning** - Each word requires completing 3-4 exercise types
2. **Correct Answer Strategy** - Review again after 2-3 steps delay
3. **Incorrect Answer Strategy** - Immediate review, and previously untrained exercise types are automatically added to the answer list
4. **Mastery Standard** - Complete all exercise types with required accuracy

### Progress Tracking

- Overall accuracy statistics
- Individual exercise type accuracy
- Word-level correct rate
- Learning progress visualization

## 🎨 UI/UX Features

- Responsive design for mobile and desktop
- Smooth page transition animations
- Instant answer feedback
- Clear progress visualization
- Intuitive statistics charts

## 🛠️ Development Commands

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Clean build files
npm run clean
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 🔗 Related Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

<div align="center">
Make learning smarter, make memories last longer 📚✨
</div>
