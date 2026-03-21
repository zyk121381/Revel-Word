# 迁移到 OpenAI API 指南

本项目现已支持 OpenAI 和 Gemini 两种 AI 提供商。以下是配置和使用说明。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

**注意**：如果你只使用 OpenAI，无需安装 Gemini SDK。如果需要使用 Gemini，请运行：

```bash
npm install @google/genai
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`：

```bash
cp .env.local.example .env.local
```

然后编辑 `.env.local` 文件，配置你的 API 密钥。

## 配置 OpenAI（推荐）

```env
NEXT_PUBLIC_AI_PROVIDER="openai"
NEXT_PUBLIC_OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_OPENAI_API_BASE="https://api.openai.com/v1"
NEXT_PUBLIC_OPENAI_MODEL="gpt-4o-mini"
```

### 获取 OpenAI API Key

1. 访问 https://platform.openai.com/api-keys
2. 登录或创建账户
3. 点击 "Create new secret key"
4. 复制生成的 API 密钥

### 支持的模型

- `gpt-4o` - 最强大的模型
- `gpt-4o-mini` - 快速且经济实惠（默认推荐）
- `gpt-3.5-turbo` - 性价比高
- 其他 OpenAI 兼容的模型

## 配置 Gemini（可选）

```env
NEXT_PUBLIC_AI_PROVIDER="gemini"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_GEMINI_MODEL="gemini-3.1-pro-preview"
```

### 获取 Gemini API Key

1. 访问 https://makersuite.google.com/app/apikey
2. 登录 Google 账户
3. 点击 "Create API Key"
4. 复制生成的 API 密钥

## 使用 OpenAI 兼容的 API

本项目支持任何 OpenAI 兼容的 API 端点，包括：

### Azure OpenAI

```env
NEXT_PUBLIC_AI_PROVIDER="openai"
NEXT_PUBLIC_OPENAI_API_KEY="your-azure-api-key"
NEXT_PUBLIC_OPENAI_API_BASE="https://your-resource.openai.azure.com/openai/deployments/your-deployment"
NEXT_PUBLIC_OPENAI_MODEL="gpt-4o"
```

### 本地模型（如 Ollama）

```env
NEXT_PUBLIC_AI_PROVIDER="openai"
NEXT_PUBLIC_OPENAI_API_KEY="ollama"
NEXT_PUBLIC_OPENAI_API_BASE="http://localhost:11434/v1"
NEXT_PUBLIC_OPENAI_MODEL="llama3"
```

### OpenRouter（你正在使用的）

```env
NEXT_PUBLIC_AI_PROVIDER="openai"
NEXT_PUBLIC_OPENAI_API_KEY="your-openrouter-api-key"
NEXT_PUBLIC_OPENAI_API_BASE="https://openrouter.ai/api/v1"
NEXT_PUBLIC_OPENAI_MODEL="stepfun/step-3.5-flash:free"
```

### 其他兼容服务

- Anthropic Claude（通过兼容层）
- DeepSeek
- Moonshot
- 其他支持 OpenAI API 格式的服务

## API 切换

你可以在任何时候通过修改 `.env.local` 文件中的 `NEXT_PUBLIC_AI_PROVIDER` 来切换 AI 提供商。无需修改代码。

## 功能对比

| 功能 | OpenAI | Gemini |
|------|--------|--------|
| 单词分析 | ✅ | ✅ |
| AI 助手聊天 | ✅ | ✅ |
| 结构化输出 | ✅ | ✅ |
| 成本 | 💰 | 🆓 |
| 速度 | ⚡ | ⚡ |
| 中文支持 | 优秀 | 优秀 |

## 故障排除

### 错误：未配置 API Key

确保在 `.env.local` 中配置了正确的 API 密钥，并且文件没有被提交到 Git（已在 `.gitignore` 中排除）。

**重要**：所有客户端可访问的环境变量必须以 `NEXT_PUBLIC_` 开头！

### 错误：API 调用失败

1. 检查 API 密钥是否有效
2. 确认 API 端点地址正确
3. 检查网络连接
4. 查看浏览器控制台的错误信息
5. 打开浏览器控制台查看调试日志（会显示当前使用的配置）

### 错误：Gemini SDK is not installed

如果使用 Gemini，请先安装依赖：

```bash
npm install @google/genai
```

## 技术细节

### 架构设计

项目采用抽象层设计，通过 `lib/ai-service.ts` 统一管理不同 AI 提供商：

```
app/page.tsx
    ↓
lib/ai-service.ts (抽象层)
    ↓
    ├─ OpenAIService (OpenAI 及兼容 API)
    └─ GeminiService (Google Gemini)
```

### Schema 转换

OpenAI 和 Gemini 使用不同的响应格式。项目自动处理：

- **OpenAI**: 使用 `response_format: { type: 'json_object' }`
- **Gemini**: 使用 `responseMimeType: "application/json"` + `responseSchema`

### 环境变量

所有环境变量都以 `NEXT_PUBLIC_` 开头，确保在客户端可访问。在生产环境中，建议通过服务器端 API 代理来保护密钥。

**环境变量列表**：
- `NEXT_PUBLIC_AI_PROVIDER`: AI 提供商（`openai` 或 `gemini`）
- `NEXT_PUBLIC_OPENAI_API_KEY`: OpenAI API 密钥
- `NEXT_PUBLIC_OPENAI_API_BASE`: OpenAI API 基础 URL
- `NEXT_PUBLIC_OPENAI_MODEL`: OpenAI 模型名称
- `NEXT_PUBLIC_GEMINI_API_KEY`: Gemini API 密钥
- `NEXT_PUBLIC_GEMINI_MODEL`: Gemini 模型名称

## 性能优化

1. **模型选择**：`gpt-4o-mini` 是性价比最高的选择
2. **缓存**：考虑添加单词分析结果的本地缓存
3. **批量处理**：一次输入 10-20 个单词效率更高

## 安全建议

1. **不要提交 `.env.local` 到版本控制**
2. **在生产环境中使用服务器端代理**保护 API 密钥
3. **限制 API 调用频率**避免超出配额
4. **监控 API 使用量**和成本

## 联系与支持

如有问题，请：
1. 查看项目 README.md
2. 检查浏览器控制台错误信息
3. 确认 API 密钥和配置正确
4. 打开浏览器控制台查看调试日志

---

**注意**：本项目的 AI 服务抽象层设计灵活，未来可以轻松添加更多 AI 提供商支持。
