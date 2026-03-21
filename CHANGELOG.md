# 更新日志

## [0.1.0] - 2025-03-16

### 🎉 首次发布 - Revel Word

#### 📝 项目重命名
- 项目名称从 "Revelation" 更改为 **"Revel Word"**
- 更新所有文档和代码中的项目名称

#### ✨ 新增功能
- ✅ 多 AI 提供商支持（OpenAI、Gemini）
- ✅ 六种训练题型：
  - 英译中（EN_TO_ZH）
  - 中译英（ZH_TO_EN）
  - 拼写（SPELL）
  - 补全单词（FILL）
  - 听音辨意（AUDIO_TO_ZH）
  - 听音拼写（AUDIO_SPELL）
- ✅ 间隔重复算法（Spaced Repetition）
- ✅ 实时进度追踪和统计
- ✅ 文本转语音（TTS）
- ✅ AI 学习助手聊天功能
- ✅ 多维度准确率统计

#### 🎨 UI/UX 改进
- 现代化界面设计
- 流畅的动画效果
- 响应式设计（支持移动端）
- 直观的进度可视化
- 清晰的统计图表

#### 🛠️ 技术栈
- **Next.js** 15.4.9
- **React** 19.2.1
- **TypeScript** 5.9.3
- **Tailwind CSS** 4.1.11
- **Motion** (Framer Motion) 12.23.24
- **OpenAI SDK** 4.71.1
- **Google GenAI** 1.17.0 (可选)

#### 📚 文档
- 完整的中文文档（README.md、README_CN.md）
- 完整的英文文档（README_EN.md）
- API 迁移指南（MIGRATION.md）
- 文档索引（DOCS_INDEX.md）
- 环境变量配置示例（.env.local.example）

#### 🔧 配置
- 支持环境变量配置
- 灵活的 AI 提供商切换
- OpenAI 兼容 API 支持（OpenRouter、DeepSeek 等）

#### 📦 文件结构
```
revel-word/
├── app/                    # Next.js 应用目录
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主应用页面
│   └── globals.css         # 全局样式
├── lib/
│   ├── ai-service.ts       # AI 服务抽象层
│   └── utils.ts            # 工具函数
├── hooks/
│   └── use-mobile.ts       # 移动端检测 Hook
├── docs/                   # 文档
└── config/                 # 配置文件
```

#### 🎯 核心特性
- 智能单词分析
- 科学记忆算法
- 实时学习反馈
- 多感官学习体验
- 个性化学习路径

---

## 未来计划

### 🚀 即将推出
- [ ] 单词本导入/导出功能
- [ ] 学习数据持久化
- [ ] 多语言界面支持
- [ ] 更多题型扩展
- [ ] 学习成就系统
- [ ] 社交分享功能

### 🔨 改进中
- [ ] 性能优化
- [ ] 离线模式支持
- [ ] PWA 支持
- [ ] 深色模式

---

## 📄 许可证

MIT License

---

**Revel Word** - 让学习更智能，让记忆更持久 📚✨
