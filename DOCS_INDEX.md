# 📚 Revel Word - 文档索引

## 项目文档

### 主文档
- **[README.md (中文)](README.md)** - 项目主要说明文档（中文）
- **[README_CN.md](README_CN.md)** - 项目说明文档（中文）
- **[README_EN.md](README_EN.md)** - 项目说明文档（英文）

### 配置文档
- **[.env.local.example](.env.local.example)** - 环境变量配置模板
- **[.env.example](.env.example)** - 环境变量配置示例

### 技术文档
- **[MIGRATION.md](MIGRATION.md)** - API 迁移和配置指南
- **[test-api.js](test-api.js)** - API 连接测试脚本

### 备份文档
- **[README_OLD.md](README_OLD.md)** - 旧版 README 备份

## 快速链接

### 🚀 快速开始
1. 克隆项目
2. 运行 `npm install`
3. 复制 `.env.local.example` 为 `.env.local` 并配置 API 密钥
4. 运行 `npm run dev`
5. 访问 http://localhost:3000

### 📖 详细阅读
- 中文用户 → [README_CN.md](README_CN.md)
- English Users → [README_EN.md](README_EN.md)
- API 配置 → [MIGRATION.md](MIGRATION.md)

### 🔧 环境变量
所有环境变量必须以 `NEXT_PUBLIC_` 开头：
- `NEXT_PUBLIC_AI_PROVIDER` - AI 提供商选择
- `NEXT_PUBLIC_OPENAI_API_KEY` - OpenAI API 密钥
- `NEXT_PUBLIC_OPENAI_API_BASE` - OpenAI API 基础 URL
- `NEXT_PUBLIC_OPENAI_MODEL` - OpenAI 模型名称
- `NEXT_PUBLIC_GEMINI_API_KEY` - Gemini API 密钥
- `NEXT_PUBLIC_GEMINI_MODEL` - Gemini 模型名称

## 项目概览

**Revel Word** - 智能英语单词检测与记忆特训系统

### 技术栈
- **Next.js** 15.4.9
- **React** 19.2.1
- **TypeScript** 5.9.3
- **Tailwind CSS** 4.1.11
- **OpenAI SDK** 4.71.1
- **Google GenAI** 1.17.0 (可选)

### 功能特性
- ✅ 多 AI 提供商支持（OpenAI、Gemini）
- ✅ 六种训练题型
- ✅ 间隔重复算法
- ✅ 实时进度追踪
- ✅ 文本转语音
- ✅ AI 学习助手

### 项目结构
```
├── app/              # Next.js 应用
├── lib/              # 工具库
├── hooks/            # 自定义 Hooks
├── public/           # 静态资源
└── docs/             # 文档
```

## 支持与反馈

如有问题或建议，请：
1. 查阅相关文档
2. 检查环境变量配置
3. 运行测试脚本验证 API 连接
4. 查看浏览器控制台日志

---

最后更新：2025-03-16
