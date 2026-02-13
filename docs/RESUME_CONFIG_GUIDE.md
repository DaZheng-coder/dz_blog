# AI 智能简历配置指南

## 概述

本项目已转型为 **AI 智能简历对话系统**，使用 AI 技术让面试官通过对话方式深入了解求职者。

### 核心特点

- 🤖 AI 扮演求职者，第一人称回答面试官的问题
- 📝 基于结构化配置文件生成完整的简历信息
- 💬 自然对话交互，比传统简历更生动
- ⚡ 快速配置，只需修改一个文件即可定制
- 🎯 专为前端开发工程师设计（可扩展到其他职位）

## 快速开始

### 1. 修改简历配置

打开 `src/config/resume.ts` 文件，根据您的实际情况修改以下内容：

#### 基本信息

```typescript
basicInfo: {
  name: "您的姓名",        // 修改为您的真实姓名
  title: "前端开发工程师",  // 您的职位
  location: "北京市",       // 所在城市
  email: "your.email@example.com",
  phone: "138-xxxx-xxxx",
  github: "https://github.com/yourusername",
  website: "https://your-portfolio.com",
},
```

#### 个人简介

```typescript
summary: `
我是一名拥有 5 年经验的前端开发工程师...
  `.trim(),
```

**建议**:

- 字数控制在 100-200 字
- 突出核心优势和经验年限
- 体现技术专长和职业追求

#### 技能清单

```typescript
skills: {
  frontend: [
    "React 18+",
    "Vue 3",
    "TypeScript",
    // 添加您熟练掌握的前端技术
  ],
  backend: [
    "Node.js",
    "Express",
    // 如果有后端经验可以添加
  ],
  tools: [
    "Git",
    "Docker",
    "CI/CD",
    // 添加您使用的工具
  ],
},
```

**建议**:

- 只列出真正熟练的技术
- 可以注明技术版本号
- 按熟练程度排序

#### 工作经历

```typescript
experience: [
  {
    company: "某互联网科技公司",
    position: "前端开发工程师",
    period: "2022.03 - 至今",
    location: "北京",
    responsibilities: [
      "负责公司核心产品前端架构设计和开发",
      "带领 5 人前端团队完成多个重点项目",
      // 您的工作职责
    ],
    achievements: [
      "主导重构核心业务系统，代码质量提升 40%",
      // 您的工作成果
    ],
    techStack: ["React", "TypeScript", "Next.js"],
  },
  // 添加更多工作经历
],
```

**建议**:

- 按时间倒序排列（最新的在前）
- 职责用动词开头（负责、主导、实现）
- 成果量化（用数据说话）
- 技术栈列出实际使用的

#### 项目经验

```typescript
projects: [
  {
    name: "企业级 SaaS 管理平台",
    description: "为中小企业提供...",
    role: "前端负责人",
    period: "2022.06 - 2023.12",
    techStack: ["React 18", "TypeScript", "Ant Design"],
    highlights: [
      "设计并实现微前端架构",
      "搭建通用组件库，复用率达到 80%",
    ],
    url: "https://example.com/project",  // 可选
  },
],
```

**建议**:

- 选择 3-5 个最有代表性的项目
- 突出您的角色和贡献
- 用数据体现项目价值
- 如果有线上链接务必提供

#### 教育背景

```typescript
education: [
  {
    school: "某某大学",
    degree: "本科",
    major: "计算机科学与技术",
    period: "2015.09 - 2019.06",
    gpa: "3.6/4.0",  // 可选
  },
],
```

#### AI 角色设定

```typescript
aiPersonality: {
  avatar: "👨‍💻",  // 可以改成其他 emoji
  tone: "专业、自信、谦逊",
  responseStyle: `
作为一名前端开发工程师，我会以第一人称回答面试官的问题。
// 可以调整回答风格
  `.trim(),
},
```

### 2. 测试配置

1. 启动开发服务器：

```bash
npm run dev
```

2. 访问 `http://localhost:5173/chat`

3. 尝试提问：
   - "请介绍一下你自己"
   - "你有哪些工作经历？"
   - "能讲讲你最骄傲的项目吗？"

### 3. 调整优化

根据 AI 的回答效果，调整 `resume.ts` 中的内容：

- 如果回答过于简短：增加细节描述
- 如果回答不够准确：调整措辞和表达
- 如果遗漏重要信息：补充到配置中

## 配置文件结构

### 完整类型定义

```typescript
export interface IResumeConfig {
  basicInfo: {
    name: string;
    title: string;
    location: string;
    email?: string;
    phone?: string;
    github?: string;
    website?: string;
    linkedin?: string;
  };

  summary: string;

  skills: {
    frontend: string[];
    backend?: string[];
    tools: string[];
    other?: string[];
  };

  experience: Array<{
    company: string;
    position: string;
    period: string;
    location?: string;
    responsibilities: string[];
    achievements?: string[];
    techStack?: string[];
  }>;

  projects?: Array<{
    name: string;
    description: string;
    role: string;
    period?: string;
    techStack: string[];
    highlights: string[];
    url?: string;
  }>;

  education: Array<{
    school: string;
    degree: string;
    major: string;
    period: string;
    gpa?: string;
  }>;

  languages?: Array<{
    language: string;
    level: string;
  }>;

  certificates?: string[];

  interests?: string[];

  aiPersonality: {
    avatar: string;
    tone: string;
    responseStyle: string;
  };
}
```

## AI 系统提示词生成

配置文件会自动生成 AI 系统提示词，包含：

1. **基本信息** - 姓名、职位、联系方式
2. **个人简介** - 一句话总结
3. **技能清单** - 技术栈分类展示
4. **工作经历** - 完整工作历史
5. **项目经验** - 项目亮点和贡献
6. **教育背景** - 学历信息
7. **回答要求** - 角色设定和风格指导

### 提示词生成函数

```typescript
export function generateSystemPrompt(config: IResumeConfig): string {
  // 自动整合所有配置信息
  // 生成结构化的系统提示词
}
```

## 常见问题

### Q1: AI 回答不够详细？

**解决方案**:

- 在配置文件中添加更多细节
- 在 `achievements` 中补充量化数据
- 在 `highlights` 中增加项目亮点

### Q2: AI 回答偏离事实？

**解决方案**:

- 检查 `systemPrompt` 中的指导规则
- 确保 `responseStyle` 强调基于简历回答
- 在配置中明确不要编造经历

### Q3: 如何调整回答风格？

**解决方案**:

修改 `aiPersonality.responseStyle`：

```typescript
responseStyle: `
我的回答风格：
1. 专业且自信 - 清晰阐述技术能力
2. 具体而详细 - 用数据和实例支撑
3. 诚实谦逊 - 承认不足，表达学习意愿
// 自定义您的风格
`.trim(),
```

### Q4: 如何适配其他职位？

**解决方案**:

1. 修改 `basicInfo.title` 为目标职位
2. 调整 `skills` 为该职位相关技能
3. 更新 `experience` 和 `projects` 内容
4. 修改 `aiPersonality` 以匹配职位特点

### Q5: 能否添加多语言支持？

**解决方案**:

可以创建多个配置文件：

```typescript
// resume.zh.ts - 中文简历
// resume.en.ts - 英文简历
```

然后根据语言选择加载不同配置。

## 最佳实践

### 1. 内容准备

- ✅ 收集所有工作经历和项目资料
- ✅ 准备量化数据和成果证明
- ✅ 整理技能清单和证书
- ✅ 思考个人优势和职业目标

### 2. 配置编写

- ✅ 真实准确，不夸大不编造
- ✅ 重点突出，筛选最有价值的内容
- ✅ 结构清晰，便于 AI 理解
- ✅ 数据支撑，多用数字说话

### 3. 测试优化

- ✅ 多角度提问测试 AI 回答
- ✅ 模拟真实面试场景
- ✅ 让朋友帮忙测试提问
- ✅ 根据反馈持续优化

### 4. 面试准备

- ✅ 自己先体验 AI 回答效果
- ✅ 准备补充说明的内容
- ✅ 了解 AI 可能的局限性
- ✅ 准备面对面深入讨论的话题

## 进阶功能

### 1. 添加面试题目推荐

可以在配置中增加常见面试题：

```typescript
commonQuestions: [
  "请介绍一下你自己",
  "你的优势是什么？",
  "为什么离职？",
  // 更多问题
],
```

### 2. 集成作品集链接

在项目中增加作品展示：

```typescript
projects: [
  {
    name: "个人作品集",
    url: "https://your-portfolio.com",
    screenshots: [
      "https://example.com/img1.png",
    ],
  },
],
```

### 3. 添加技能评分

为技能添加熟练度评分：

```typescript
skills: {
  frontend: [
    { name: "React", level: 5 },
    { name: "Vue", level: 4 },
  ],
},
```

## 部署建议

### 1. 环境变量

确保 `.env.local` 配置正确：

```bash
VITE_ALIBABA_API_KEY=your-api-key
```

### 2. 隐私保护

- ⚠️ 不要将真实联系方式提交到公开仓库
- ⚠️ 使用环境变量管理敏感信息
- ⚠️ 生产环境考虑添加访问控制

### 3. 性能优化

- 考虑使用流式响应提升体验
- 实现对话缓存减少 API 调用
- 添加 loading 状态提示

## 相关文件

- `src/config/resume.ts` - 简历配置文件
- `src/pages/ChatPage.tsx` - 对话页面组件
- `src/services/alibabaService.ts` - AI API 服务
- `.env.local` - 环境变量配置

## 技术支持

如有问题，请参考：

- [项目 README](../README.md)
- [AI 对话指南](./AI_CHAT_GUIDE.md)
- [更新日志](./CHANGELOG.md)

---

**最后更新**: 2026-02-10  
**版本**: 1.0.0  
**状态**: ✅ 稳定使用
