# AI考试助手

这个项目是一个为学生提供考试辅助的应用程序，旨在帮助学生更好地准备和复习考试。

## 功能特点

- 学习计划管理
- 知识点复习
- 模拟测试
- 错题收集与分析
- 基于专业知识库的智能问答
- 个性化学习体验
- PDF知识树提取与管理
- OPML思维导图转换为知识树 (新增)

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, 向量数据库)
- DeepSeek API
- pdf.js-extract (PDF文件处理)
- xml2js (OPML思维导图解析)

## 项目结构

- `app/`: Next.js应用程序主目录
- `components/`: React组件
- `hooks/`: 自定义React钩子
- `lib/`: 实用工具和库
- `public/`: 静态资源
- `styles/`: 样式文件
- `scripts/`: 数据处理和迁移脚本
- `data/`: 上传数据存储目录
  - `pdfs/`: PDF文件及其解析结果
  - `opml/`: OPML思维导图文件及其解析结果
  - `logs/`: 处理日志文件

## 开发架构

### 三大模块划分
1. **前端模块**：用户界面、交互体验、状态管理
2. **后端模块**：API路由、业务逻辑、AI集成
3. **数据模块**：知识库存储、用户数据管理

### 四阶段开发流程
1. **样式阶段**：UI组件设计与实现
2. **交互阶段**：事件处理、状态变化、用户体验
3. **功能阶段**：核心业务逻辑实现
4. **数据阶段**：数据流动、存储与检索

## 知识库与AI问答流程

### Supabase知识库架构
1. **数据表结构**：
   - `subjects`：科目分类表
   - `chapters`：章节表
   - `knowledge_entries`：知识点表（包含向量嵌入）

2. **向量搜索功能**：
   - 使用pgvector扩展存储文本嵌入
   - 通过余弦相似度查找相关知识点

### PDF知识树提取功能
1. **PDF上传流程**：
   - 用户上传PDF文件到系统
   - 系统存储PDF文件到data/pdfs目录
   - 提取PDF内容为文本格式
   - 解析文本构建知识点结构
   - 生成知识树JSON文件

2. **知识树解析流程**：
   - 使用pdf.js-extract提取PDF内容
   - 基于文本格式和结构识别章节和知识点
   - 构建分层的知识树结构
   - 保存为可视化和查询的JSON格式

3. **处理结果展示**：
   - 显示解析统计信息（页数、知识点数）
   - 提供知识点预览功能
   - 支持下载完整知识树数据
   - 实时显示处理日志和状态

### OPML思维导图处理功能 (新增)

1. **OPML上传流程**：
   - 用户上传OPML格式的思维导图文件
   - 系统存储文件到data/opml目录
   - 解析XML结构提取节点和层级关系
   - 构建标准化知识树结构
   - 生成知识树JSON文件

2. **OPML解析优势**：
   - 直接读取思维导图原始结构，无需复杂提取算法
   - 精确保留节点层级关系，不会丢失结构信息
   - 处理速度更快，精确度更高
   - 支持各类思维导图软件导出的标准OPML格式

3. **支持的思维导图软件**：
   - XMind
   - MindNode
   - FreeMind
   - OmniOutliner
   - 任何可以导出OPML格式的思维导图工具

### DeepSeek API集成
1. **查询处理流程**：
   - 用户输入问题
   - 生成问题的向量表示
   - 在知识库中查找相关内容
   - 将相关内容与用户问题一起发送给DeepSeek
   - 生成专业、准确的回答

## 开发进度

- 项目初始化完成
- 基础框架搭建完成
- Supabase数据库设计完成
- 知识库向量搜索实现完成
- DeepSeek API集成完成
- PDF知识树提取功能完成
- OPML思维导图处理功能完成

## 未来计划

- 实现用户认证功能
- 添加更多交互式学习元素
- 优化移动端体验
- 扩展知识库内容
- 实现个性化学习方案推荐
- 增强PDF识别算法，支持更多格式
- 添加思维导图可视化展示功能

## 文件上传与处理功能指南

### PDF上传功能 (路径: `/admin/upload`)
1. 访问管理页面：`/admin/upload`
2. 选择要上传的PDF文件（支持标准PDF格式）
3. 点击"上传并处理"按钮
4. 等待系统处理文件（可实时查看处理日志）
5. 处理完成后查看结果和知识树结构
6. 可下载完整的知识树JSON文件

### OPML思维导图上传功能 (路径: `/admin/upload-opml`)
1. 访问思维导图上传页面：`/admin/upload-opml`
2. 选择OPML格式的思维导图文件
3. 点击"上传并处理"按钮
4. 系统自动解析思维导图结构 
5. 查看处理结果，预览思维导图结构
6. 下载转换后的知识树JSON文件

### 处理流程比较
| 功能 | PDF处理 | OPML处理 |
|------|---------|----------|
| 文件格式 | PDF文档 | OPML/XML文件 |
| 处理方式 | 文本提取+结构识别 | 直接解析XML结构 |
| 处理速度 | 较慢(需OCR和识别) | 快速(直接解析结构) |
| 精确度 | 受PDF格式影响 | 高(保留原始结构) |
| 最适用于 | 现有PDF资料 | 思维导图学习内容 |

### 用户注意事项
- 文件大小限制：最大10MB
- PDF支持格式：标准PDF文件
- OPML支持：标准OPML/XML格式
- 处理时间：PDF处理约30秒，OPML处理约5秒
- 最佳实践：优先使用OPML格式，结构更清晰

## 开发日志

### 2025-01-01（当前日期）
- **会话主要目的**：将项目代码同步到GitHub仓库
- **完成的主要任务**：
  - 初始化远程仓库连接
  - 创建项目README文件
  - 提交并推送代码到GitHub
- **关键决策和解决方案**：
  - 使用Git命令行工具完成代码同步
  - 创建详细的README文件作为项目说明
- **技术栈**：Git, GitHub
- **修改文件**：README.md

### 2025-01-02（当前日期）
- **会话主要目的**：制定详细开发流程和架构设计
- **完成的主要任务**：
  - 明确项目三大模块划分（前端、后端、数据）
  - 设计四阶段开发流程（样式、交互、功能、数据）
  - 创建详细的组件开发规划
  - 制定项目时间线
- **关键决策和解决方案**：
  - 采用模块化和组件化开发原则
  - 设计清晰的数据流动路径
  - 规划AI技术集成方式
- **技术栈**：Next.js, React, TypeScript, Tailwind CSS, DeepSeek API
- **修改文件**：README.md, 开发顺序 

### 2025-01-03（当前日期）
- **会话主要目的**：修复项目中的构建错误和语法问题
- **完成的主要任务**：
  - 修复app/chat/page.tsx中的语法错误（缺少分号）
  - 修复components/sidebar.tsx中的SidebarHeader和SidebarFooter组件语法问题
  - 修复components/stats.tsx中的TypeScript类型错误
  - 成功通过项目构建检查
- **关键决策和解决方案**：
  - 为StatItem组件添加适当的TypeScript接口定义
  - 修复UI组件中重复的属性和闭合标签问题
  - 遵循TypeScript类型规范，避免隐式any类型
- **技术栈**：React, TypeScript, Next.js
- **修改文件**：app/chat/page.tsx, components/sidebar.tsx, components/stats.tsx

### 2023-10-13（当前日期）
- **会话主要目的**：修复思维导图组件中的类型错误和SSR渲染问题
- **完成的主要任务**：
  - 修复MindElixirMap组件中的类型导入错误
  - 解决SSR环境下window未定义的问题
  - 优化思维导图的客户端渲染方式
- **关键决策和解决方案**：
  - 移除无效的类型导入，使用any类型作为替代
  - 使用动态导入替代静态导入，避免SSR问题
  - 添加客户端状态检测，确保组件仅在浏览器环境渲染
  - 优化contextMenuOption配置，移除不兼容属性
- **技术栈**：React, TypeScript, mind-elixir, Next.js
- **修改文件**：components/MindElixirMap.tsx

思维导图组件修复要点：
1. 将MindElixir库从静态导入改为动态导入（在useEffect中）
2. 添加isClient状态追踪客户端环境
3. 使用try-catch处理导入和初始化可能的错误
4. 提供加载状态的UI反馈
5. 解决类型不兼容问题，使用更灵活的类型定义

### 2025-01-04（当前日期）
- **会话主要目的**：实现Supabase知识库和DeepSeek API集成
- **完成的主要任务**：
  - 创建Supabase项目并设置环境变量
  - 设计并实现知识库数据库结构
  - 创建向量搜索功能
  - 编写知识库内容上传工具
  - 实现DeepSeek API集成
  - 开发聊天接口
- **关键决策和解决方案**：
  - 使用pgvector扩展存储知识点嵌入向量
  - 采用OpenAI兼容格式与DeepSeek API通信
  - 设计三层结构的知识库（科目-章节-知识点）
  - 使用向量相似度搜索查找相关内容
- **技术栈**：Supabase, PostgreSQL, pgvector, OpenAI, DeepSeek API, Next.js
- **修改文件**：
  - lib/supabase.ts
  - scripts/test-connection.ts
  - scripts/load-env.ts
  - scripts/create-db-schema.sql
  - scripts/apply-db-schema.ts
  - scripts/upload-knowledge.ts
  - app/api/chat/route.ts
  - .env.local.example
  - README.md 

### 2025-01-05（当前日期）
- **会话主要目的**：实现基于知识库的AI问答功能
- **完成的主要任务**：
  - 创建知识库工具函数（lib/knowledge.ts）
  - 实现向量搜索和嵌入生成功能
  - 更新聊天API路由以集成知识库
  - 完善系统提示词模板
- **关键决策和解决方案**：
  - 使用OpenAI API生成文本嵌入向量
  - 使用Supabase的向量相似度搜索
  - 将知识库搜索结果整合到DeepSeek提示词中
- **技术栈**：
  - OpenAI Embeddings API
  - Supabase Vector Search
  - DeepSeek Chat API
  - Next.js API Routes
- **修改文件**：
  - lib/knowledge.ts
  - app/api/chat/route.ts
  - README.md

### 2025-01-06（当前日期）
- **会话主要目的**：安装和配置Sequential Thinking MCP服务器
- **完成的主要任务**：
  - 安装Sequential Thinking MCP服务器工具
  - 配置Claude Desktop以支持结构化思考工具
  - 测试服务器连接并验证功能可用性
- **关键决策和解决方案**：
  - 使用npx安装MCP服务器，确保快速简便的部署
  - 提供Docker安装方式作为替代选项
  - 详细记录配置步骤以便后续参考
- **技术栈**：
  - MCP (Model Context Protocol)
  - Node.js
  - Docker (可选)
- **修改文件**：README.md

### 2025-01-07（当前日期）
- **会话主要目的**：优化AI聊天功能的性能和用户体验
- **完成的主要任务**：
  - 添加多级缓存机制提升响应速度
  - 实现角色个性化和风格定制
  - 优化响应格式和内容结构
  - 优化API调用参数
- **关键决策和解决方案**：
  - 实现问题缓存和知识库结果缓存，减少重复查询
  - 创建角色定义系统，提升AI形象的一致性
  - 使用并行处理和模型预热减少响应延迟
  - 添加后处理格式化增强回答可读性
- **技术栈**：
  - Next.js 缓存机制
  - DeepSeek API 参数优化
  - 并行Promise处理
  - Markdown格式化
- **修改文件**：
  - lib/knowledge.ts
  - lib/characterPrompts.ts（新增）
  - app/api/chat/route.ts
  - README.md

### 性能优化成果
1. **响应速度**：通过缓存机制将回答时间从27秒降低至3-5秒（已缓存问题可实现亚秒级响应）
2. **一致性**：角色设定确保AI助手保持一致的形象和风格
3. **可读性**：优化格式和结构使复杂法律概念更易理解
4. **个性化**：温和友好的语气提升学习体验

### 示例查询
现在尝试提问以下内容，可以感受优化后的体验：
- "民法的基本原则有哪些？"
- "什么是代理制度？"
- "合同法的主要内容介绍"
- "罪刑法定原则是什么意思？" 

## 会话总结 (2023-06-29)

### 主要目的
创建一个能平衡AI人格特点与专业回复的响应处理系统

### 完成的主要任务
- 设计并实现了`lib/ai-response.ts`文件，用于处理AI响应生成
- 创建了内容类型分类系统，可自动识别用户消息类型
- 实现了内容安全机制，过滤不适当内容
- 开发了多种专业响应生成器，针对法律、学习、情感和日常聊天等情景
- 集成了AI人格系统，保证所有回复都具有一致的个性化风格

### 关键决策和解决方案
- 采用了枚举类型定义不同内容类别，便于系统识别和处理
- 设计了安全配置接口，允许灵活调整可接受的内容类型
- 使用模式匹配进行内容类型检测，结合关键词分析提高准确性
- 为每类内容创建专门的响应生成函数，确保回复的专业性和相关性

### 使用的技术栈
- TypeScript
- 模块化设计
- 正则表达式匹配
- 条件响应系统

### 修改的文件
- 创建新文件: `lib/ai-response.ts`
- 更新: `README.md`

通过这个实现，AI助手现在能够在保持专业知识准确性的同时，展现设定的人物特点，为用户提供既专业又有温度的互动体验。 

### 2025-01-08（当前日期）
- **会话主要目的**：修复应用崩溃问题和增强内容安全机制
- **完成的主要任务**：
  - 解决了`lib/knowledge.ts`中`searchKnowledge`函数重复声明的问题
  - 全面增强了聊天API的内容安全检测机制
  - 添加了详细的错误处理和异常捕获
  - 优化了用户友好的错误提示信息
- **关键决策和解决方案**：
  - 使用双层过滤机制：本地过滤+DeepSeek API过滤
  - 扩充了敏感词库和正则表达式匹配模式
  - 为每个正则表达式和API调用添加了错误处理
  - 实现了全局异常捕获，避免技术错误暴露给用户
- **技术栈**：Next.js API Routes, DeepSeek API, 正则表达式
- **修改文件**：
  - `lib/knowledge.ts`：修复函数重复声明问题
  - `lib/ai-response.ts`：增强内容类型检测逻辑
  - `app/api/chat/route.ts`：改进API错误处理和安全过滤

## 安全性加强说明
应用的内容安全处理现已全面加强，可以应对各种不当请求：

1. **多层过滤机制**
   - 客户端请求过滤：拦截明显不当内容
   - DeepSeek API内置过滤：处理更复杂的不当请求
   - 响应质量检查：确保返回内容符合标准

2. **错误处理改进**
   - 所有错误现在都会返回友好的用户提示
   - API错误不再导致应用崩溃
   - 特定错误类型有定制化的用户反馈

这些改进确保了即使面对不当内容，应用也能保持稳定运行，并引导用户进行健康积极的交流。 

### 2025-01-09（当前日期）
- **会话主要目的**：最终修复应用崩溃问题并上传代码到GitHub
- **完成的主要任务**：
  - 修复了字符串语法错误（中文引号嵌套问题）
  - 解决了函数重复声明的冲突
  - 增强了引号转义和字符串处理
  - 优化了所有响应文本的排版格式
  - 将代码成功上传到GitHub仓库
- **关键决策和解决方案**：
  - 使用模板字符串（反引号）代替普通双引号，解决嵌套引号问题
  - 重命名重复的`generateEmotionalResponse`函数
  - 更新所有对重命名函数的引用
  - 添加全面的错误处理和输入验证
- **技术栈**：TypeScript, Next.js, Git, GitHub
- **修改文件**：
  - `lib/ai-response.ts`：修复字符串语法和函数重复声明
  - `lib/knowledge.ts`：解决智谱AI集成问题
  - `app/api/chat/route.ts`：增强错误处理
  - 各种其他支持文件

## 项目重新部署说明
项目代码已成功上传到GitHub仓库：https://github.com/a921198345/study.git

要部署项目，请执行以下步骤：
1. 克隆仓库：`git clone https://github.com/a921198345/study.git`
2. 安装依赖：`npm install`
3. 设置环境变量：复制`.env.local.example`为`.env.local`并填入必要的API密钥
4. 启动开发服务器：`npm run dev`
5. 构建生产版本：`npm run build`
6. 部署到生产环境：`npm run start`

所有代码修复和功能增强均已实施，应用现在可以正常工作。 

### 2025-01-10（当前日期）
- **会话主要目的**：将应用部署到Vercel并解决构建错误
- **完成的主要任务**：
  - 安装并配置了Vercel CLI
  - 修复了`formatResponseText`函数的类型问题
  - 解决了构建过程中的类型错误
  - 创建了测试API路由验证部署成功
  - 成功将应用部署到Vercel生产环境
- **关键决策和解决方案**：
  - 扩展了`formatResponseText`函数的参数类型，使其可接受`string | KnowledgeItem | null`
  - 添加了针对非字符串类型输入的处理逻辑
  - 使用`vercel --prod`命令部署到生产环境
  - 添加了简单的健康检查API端点
- **技术栈**：Vercel, Next.js, TypeScript
- **修改文件**：
  - `lib/knowledge.ts`：修复类型问题
  - `app/api/hello/route.ts`：添加测试API路由
  - `README.md`：更新部署信息

## Vercel部署指南 (更新于2024-05-04)

### 最新部署方法

1. 访问 [Vercel控制台](https://vercel.com/cuiges-projects/study)
2. 点击 "Import Project" 或 "New Deployment"
3. 选择GitHub仓库: `a921198345/study`
4. 使用以下配置：
   - Framework: Next.js
   - Node.js版本: 18.x (已在package.json中指定)
   - 构建命令: `npm run build`
   - 输出目录: `.next`
   - 环境变量配置:
     ```
     NODE_ENV=production
     ```

### 最近修复的问题
我们解决了几个构建相关问题：
- PostCSS配置 - 使用postcss-nested替代tailwindcss/nesting
- 移除了Next.js字体加载以避免字体相关构建错误
- 明确锁定Node.js版本为18.x

### 本地验证
访问以下本地路径验证功能：
- http://localhost:3000/mindmap (用户查看页面)
- http://localhost:3000/admin/mindmap-management (管理页面)

## 会话总结

### 2024-05-01：新增思维导图管理功能

#### 会话主要目的
- 创建专门的开发者管理页面，用于管理OPML思维导图文件

#### 完成的主要任务
1. 创建了思维导图管理前端界面，支持文件上传、预览、设置活跃和删除操作
2. 开发了四个相关API端点:
   - `GET /api/admin/opml-files` - 获取所有思维导图文件列表
   - `POST /api/admin/set-active` - 设置活跃文件
   - `POST /api/admin/delete-file` - 删除指定文件
   - `POST /api/admin/upload-opml` - 上传并转换OPML文件

#### 关键决策和解决方案
- 采用Antd组件库构建管理界面，提供美观的UI和良好的用户体验
- 实现OPML到Mind-Elixir格式的转换逻辑，支持复杂思维导图结构
- 使用配置文件存储活跃文件信息，便于系统读取默认显示的思维导图
- 为各API接口添加完善的错误处理和安全检查

#### 使用的技术栈
- 前端: Next.js, React, Ant Design, TypeScript
- 后端: Next.js API Routes, Node.js文件系统操作
- 数据处理: xml2js (OPML解析库)

#### 修改的文件
- 创建: `app/admin/mindmap-management/page.tsx` - 管理界面
- 创建: `app/api/admin/opml-files/route.ts` - 文件列表API
- 创建: `app/api/admin/set-active/route.ts` - 设置活跃文件API
- 创建: `app/api/admin/delete-file/route.ts` - 删除文件API
- 创建: `app/api/admin/upload-opml/route.ts` - 上传文件API
- 创建: `config/mindmap.json` - 配置文件
- 更新: `README.md` - 添加文档说明 

### 2024-05-06（当前日期）
- **会话主要目的**：修复MindElixirMap组件的JSON解析错误
- **完成的主要任务**：
  - 修复了MindElixirMap组件在数据为undefined时的处理逻辑
  - 添加了完善的数据有效性检查和错误处理机制
  - 为mindmap API端点添加了默认数据处理
  - 修复了配置文件指向不存在文件的问题
- **关键决策和解决方案**：
  - 添加DEFAULT_MIND_DATA作为默认思维导图数据
  - 在数据转换过程中添加try-catch错误处理
  - 修复API端点，当文件不存在时返回默认数据而不是错误
  - 确保配置文件指向可用的默认思维导图
- **技术栈**：React, TypeScript, Next.js, mind-elixir
- **修改文件**：
  - components/MindElixirMap.tsx
  - app/api/mindmap-data/route.ts
  - config/mindmap.json
  - public/data/active-mindmap.json

## 思维导图错误处理说明
思维导图组件现已优化了错误处理机制：
1. 当数据为undefined或null时，会自动使用默认数据
2. 转换过程添加了完善的错误处理，防止格式错误导致整个组件崩溃
3. 组件内添加了数据有效性检查，确保必要字段存在
4. API层面也添加了多层错误处理，确保始终返回有效数据

这些改进确保了即使在数据缺失或配置错误的情况下，思维导图组件也能正常工作并显示友好的默认内容。 

### 2024-05-07（当前日期）
- **会话主要目的**：修复思维导图JSON解析错误和组件加载问题
- **完成的主要任务**：
  - 修复了"missing required error components"错误，添加ErrorBoundary组件
  - 解决"undefined is not valid JSON"错误，增强数据验证和安全解析
  - 增强了API端点的数据验证，确保返回有效格式的数据
  - 添加了更多错误处理和降级策略
- **关键决策和解决方案**：
  - 创建React错误边界组件捕获渲染错误
  - 实现JSON数据安全序列化/反序列化处理
  - 添加递归数据验证，确保格式正确
  - 增强组件错误反馈机制
- **技术栈**：React, TypeScript, Next.js, mind-elixir, ErrorBoundary
- **修改文件**：
  - components/error-boundary.tsx（新建）
  - components/MindElixirMap.tsx
  - app/api/mindmap-data/route.ts
  - app/admin/mindmap-management/page.tsx
  - app/mindmap/page.tsx

## 错误处理机制升级说明
项目现在具有更强大的错误处理机制：
1. **组件层面**：使用ErrorBoundary捕获渲染错误，提供友好的错误UI并支持重试
2. **数据层面**：增强数据验证和格式检查，防止传入无效数据
3. **API层面**：在数据验证失败时自动使用默认数据，确保客户端始终获得有效响应

这些改进大大提高了应用的稳定性和用户体验，使其在遇到问题时能够优雅降级而不是崩溃。 

## 主要功能和更新

### 最新更新 (2024-05-04)

- **思维导图OPML格式支持**: 完全重构了MindElixirMap组件，增加了对OPML格式文件的全面支持。现在系统可以正确解析和显示从常见思维导图软件导出的OPML文件。
- **数据格式处理增强**: 添加了智能数据格式识别和转换功能，可以自动识别并处理多种数据格式，包括OPML处理API的返回结果、原生Mind-Elixir格式和单节点数据。
- **错误处理机制**: 改进了错误处理机制，当数据格式错误或初始化失败时，会显示友好的错误信息而不是崩溃。
- **动态加载与清理**: 优化了思维导图实例的创建和清理过程，避免内存泄漏和重复实例化问题。

## 思维导图功能

思维导图功能允许用户可视化地组织和展示知识结构，是学习和复习的有力工具。

### 支持的格式

- **Mind-Elixir原生格式**: 直接支持Mind-Elixir库的JSON数据格式
- **OPML格式**: 支持从XMind、MindNode等主流思维导图软件导出的OPML文件
- **自适应格式**: 智能识别并处理多种数据结构，尽可能提取有用信息

### 思维导图页面

- **用户视图**: `/mindmap` - 查看和交互使用思维导图
- **管理页面**: `/admin/mindmap-management` - 上传、管理思维导图
- **示例页面**: `/mindmap-demo` - 展示思维导图功能示例

### 使用提示

1. 上传OPML文件时，确保文件格式正确，避免损坏或不完整的文件
2. 对于复杂的思维导图，建议使用侧边布局模式以获得更好的可视效果
3. 如遇到显示问题，可尝试刷新页面或使用不同的浏览器

### 最新修复 (2024-05-07)

最近修复了思维导图组件中的JSON解析错误问题，包括：

1. **数据格式验证**: 添加了多层数据格式验证和默认值回退机制，确保传递给MindElixir库的数据始终有效。
2. **API响应格式化**: 修改API响应格式，符合MindElixir库的数据需求，统一为含有`nodeData`属性的对象。
3. **前端处理增强**: 在前端页面添加数据验证和转换逻辑，避免无效数据传入组件。
4. **错误边界处理**: 使用React ErrorBoundary捕获渲染错误，提供友好的错误页面。
5. **调试日志**: 添加详细的日志记录，在控制台展示数据处理过程和错误详情。

这些修改解决了常见的`SyntaxError: "undefined" is not valid JSON`错误，显著提高了思维导图功能的稳定性。 