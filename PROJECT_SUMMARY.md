# ClassMemo（班级回忆录）项目总结文档

> 项目代号：CK971 | 版本：1.0.0 | 最后更新：2026-05-07

---

## 一、项目概述

### 1.1 项目定位
**ClassMemo（班级回忆录）** 是一个面向毕业班级的 Web 应用，用于记录和分享班级成员的青春记忆。用户可以在照片墙上浏览老照片、在留言板发布祝福便签、查看班级活动记录，管理员可以统一管理内容和用户。

### 1.2 目标用户
- 毕业多年的同班同学
- 班级管理员（超级管理员 / 普通管理员）
- 通过邀请码加入的班级成员

### 1.3 访问方式
- 部署地址（Vercel）：`https://ck1997.vercel.app`（国内可能需代理）
- 部署地址（Netlify）：根据实际分配的域名
- 本地开发：`http://localhost:3000`

### 1.4 默认账号

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| 超级管理员 | 首次在 `/admin/setup` 页面自行创建 | 自行设置 | 仅可创建一次 |
| 普通管理员 | 由超级管理员在后台添加 | - | 通过修改用户 role 实现 |
| 测试用户 | `xiaoming@classmemo.com` | `123456` | 通过邀请码注册 |
| 默认邀请码 | - | `CK971-1997` | 注册班级时使用 |

---

## 二、技术架构

### 2.1 核心技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 16.x | React 全栈框架，App Router |
| 运行时 | React | 19.x | UI 组件库 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 样式 | Tailwind CSS | 4.x | 原子化 CSS |
| 数据库 | PostgreSQL | 16+ | 关系型数据库 |
| ORM | Prisma | 6.x | 数据库操作 |
| 认证 | NextAuth.js | 5.x (beta) | OAuth + Credentials 登录 |
| 动画 | Framer Motion | 12.x | 页面交互动画 |
| 状态 | SWR | 2.x | 数据获取与缓存 |
| 上传 | Vercel Blob | latest | 图片云存储 |
| 构建 | Turbopack | - | Next.js 内置构建工具 |

### 2.2 项目结构

```
ClassMemo/
├── prisma/
│   ├── schema.prisma        # 数据库模型定义
│   └── seed.ts              # 初始数据填充脚本
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # 登录/注册/Setup 路由组
│   │   ├── admin/           # 管理员后台
│   │   ├── api/             # API 路由
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 首页
│   ├── components/          # React 组件
│   │   ├── interactive/     # 交互组件（上传/评论/活动弹窗）
│   │   └── ui/              # 基础 UI 组件
│   ├── hooks/               # 自定义 Hooks
│   ├── lib/                 # 工具库
│   │   ├── auth.ts          # NextAuth 配置
│   │   ├── prisma.ts        # Prisma Client 单例
│   │   └── upload.ts        # 图片上传封装
│   └── types/               # 全局类型定义
├── docs/                    # 部署文档
│   ├── DEPLOY_VERCEL.md     # Vercel 部署指南
│   └── DEPLOY_NETLIFY.md    # Netlify 部署指南
├── public/                  # 静态资源
├── next.config.ts           # Next.js 配置
├── netlify.toml             # Netlify 部署配置
└── package.json             # 项目依赖
```

---

## 三、功能模块

### 3.1 照片墙（核心功能）
- 瀑布流布局展示班级老照片
- 支持上传、裁剪（固定 4:3 比例）、旋转
- 图片点赞、评论（含楼中楼回复）
- 客户端图片压缩（Canvas → JPEG，质量 0.8）
- 存储：Vercel Blob（持久化云存储）

### 3.2 留言板
- 彩色便签样式留言（黄/粉/蓝/绿）
- 随机旋转角度、可拖拽定位
- 留言点赞、回复
- 按时间倒序排列

### 3.3 活动记录
- 班级活动列表（时间轴展示）
- 活动详情：标题、时间、地点、封面图、描述
- 报名参加 / 取消报名
- 活动评论

### 3.4 用户系统
- 邮箱 + 密码注册（需班级邀请码）
- NextAuth Credentials 登录
- 用户头像上传
- JWT + Session 认证策略

### 3.5 管理员后台
- 仪表盘：用户数、照片数、留言数、活动数统计
- 照片管理：审核、删除
- 留言管理：删除违规内容
- 活动管理：创建、编辑、删除
- 用户管理：封禁、解封、修改角色
- 评论管理：删除评论（照片评论 / 留言回复 / 活动评论）
- 系统设置：修改班级信息、邀请码等

---

## 四、数据库设计

### 4.1 模型总览

```
User ──1:N── Photo
  │       ├── PhotoLike
  │       └── PhotoComment ──1:N── PhotoComment (自关联，楼中楼)
  ├── Message ──1:N── MessageReply
  │       └── MessageLike
  ├── Event ──1:N── EventComment
  │       └── EventAttendee
  └── ClassMember (用户-班级多对多)
```

### 4.2 核心模型

| 模型 | 说明 | 关键字段 |
|------|------|----------|
| `User` | 用户 | email, name, password, role(MEMBER/ADMIN/SUPER_ADMIN), banned |
| `Class` | 班级 | name, inviteCode(唯一), gradeYear, schoolName |
| `ClassMember` | 班级成员关联 | userId, classId, joinedAt |
| `Photo` | 照片 | url, caption, cropX, cropY, rotation, zIndex |
| `PhotoLike` | 照片点赞 | userId, photoId |
| `PhotoComment` | 照片评论 | content, photoId, parentId(自关联) |
| `Message` | 留言便签 | content, color, posX, posY, rotation |
| `MessageLike` | 留言点赞 | userId, messageId |
| `MessageReply` | 留言回复 | content, messageId |
| `Event` | 活动 | title, eventTime, location, coverImage |
| `EventAttendee` | 活动报名 | userId, eventId |
| `EventComment` | 活动评论 | content, eventId |

### 4.3 数据库连接

- **提供商**：Neon（Serverless PostgreSQL）
- **区域**：AWS ap-southeast-1（新加坡）
- **本项目实际使用的连接字符串格式：

```
postgresql://user:pass@host/db?sslmode=require
```

- **SSL**：必须启用 `sslmode=require`
- **ORM**：Prisma，生成路径 `src/generated/prisma`

---

## 五、认证与安全

### 5.1 认证方式
- **Credentials Provider**：邮箱 + bcrypt 哈希密码
- **Session 策略**：JWT + Session 双策略
- **密码加密**：bcrypt，salt rounds = 10

### 5.2 角色权限

| 角色 | 权限 |
|------|------|
| `MEMBER` | 浏览照片/留言/活动，发布内容，点赞，评论 |
| `ADMIN` | 以上 + 进入后台，管理照片/留言/活动/评论/用户 |
| `SUPER_ADMIN` | 以上 + 系统设置，修改班级信息，管理管理员 |

### 5.3 路由保护
- **Middleware 方案**：已废弃（Next.js 16 弃用 `middleware.ts`）
- **当前方案**：`admin/layout.tsx` 客户端守卫
  - `useSession` 检查登录状态
  - `useEffect` 中判断 role，未授权则 `router.replace("/login")`
  - `/admin/setup` 路径**豁免**认证检查

### 5.4 安全配置
- `trustHost: true`（Vercel/Netlify 部署必需）
- `AUTH_SECRET` 用于 JWT 签名加密
- 环境变量全部标记为 Secret（Netlify）

---

## 六、图片上传方案

### 6.1 存储方式演进
1. **本地存储**（开发阶段）：`public/uploads/` 目录
2. **Vercel Blob**（生产阶段）：云端持久化存储

### 6.2 上传流程
1. 用户选择图片（前端限制 ≤ 8MB）
2. Canvas 客户端压缩（最大宽度 1200px，JPEG 质量 0.8）
3. 压缩后 typically < 1MB
4. FormData POST 到 `/api/photos`
5. 服务端调用 `put()` 上传到 Vercel Blob
6. 返回公开 URL，存入数据库

### 6.3 图片域名白名单
```ts
// next.config.ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**.public.blob.vercel-storage.com" }
  ]
}
```

---

## 七、部署配置

### 7.1 环境变量（生产环境）

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require`（你的 Neon 连接字符串） | Neon 数据库连接 |
| `AUTH_SECRET` | `（openssl rand -base64 32 生成）` | NextAuth JWT 密钥 |
| `BLOB_READ_WRITE_TOKEN` | `（从 Vercel Blob 获取）` | Vercel Blob Token |

### 7.2 构建命令

```json
// package.json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

### 7.3 部署平台对比

| 平台 | 优势 | 劣势 |
|------|------|------|
| **Vercel** | Next.js 原生支持，自动优化 | 国内访问慢，注册需手机验证 |
| **Netlify** | 邮箱即可注册，有亚洲 CDN | Next.js 16 需手动更新插件 |

### 7.4 部署踩坑记录

| 问题 | 解决 |
|------|------|
| Prisma Client 找不到 | Build 命令前加 `prisma generate &&` |
| `typeof data!.foo[0]` TS 错误 | 用 `as unknown as` 替代 `typeof` |
| Next.js Middleware 废弃 | 改为 `admin/layout.tsx` 客户端守卫 |
| `MissingSecret` 错误 | 设置 `AUTH_SECRET` 环境变量 |
| `邀请码无效` | API 中自动创建默认班级 |
| 超级管理员无法注册 | Setup 页面 API 自动创建班级 + layout 豁免 |
| 图片上传 413 | 前端 Canvas 压缩至 < 4.5MB |
| Netlify 404 | 更新 `@netlify/plugin-nextjs` 到 v5+ |
| Netlify 缓存旧代码 | "Clear cache and retry deploy" |

---

## 八、关键代码文件说明

### 8.1 认证相关
- `src/lib/auth.ts` — NextAuth 主配置（providers、callbacks、trustHost）
- `src/auth.config.ts` — 认证配置（pages、session strategy）
- `src/app/api/auth/[...nextauth]/route.ts` — API 路由入口
- `src/app/api/auth/register/route.ts` — 用户注册 API

### 8.2 管理员相关
- `src/app/admin/layout.tsx` — 管理员布局 + 认证守卫
- `src/app/admin/setup/page.tsx` — 超级管理员初始化页面
- `src/app/api/admin/setup/route.ts` — Setup API（自动创建默认班级）

### 8.3 核心业务 API
- `src/app/api/photos/route.ts` — 照片上传/列表
- `src/app/api/messages/route.ts` — 留言 CRUD
- `src/app/api/events/route.ts` — 活动 CRUD
- `src/app/api/admin/comments/route.ts` — 评论管理

### 8.4 核心组件
- `PhotoUploadModal.tsx` — 照片上传 + 裁剪 + 压缩
- `PhotoCommentModal.tsx` — 照片评论 + 全屏预览
- `MessageBoard.tsx` — 留言板（便签墙）
- `EventTimeline.tsx` — 活动时间轴

---

## 九、开发命令

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 推送 Schema 到数据库
npx prisma db push

# 填充初始数据
npx prisma db seed

# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start
```

---

## 十、后续可优化方向

1. **图片存储迁移**：Vercel Blob 免费额度有限，可考虑 Cloudflare R2 或阿里云 OSS
2. **服务端渲染优化**：部分列表页可使用 `loading.tsx` + Suspense
3. **搜索功能**：照片/留言/活动增加关键词搜索
4. **通知系统**：评论回复、活动提醒邮件通知
5. **数据统计**：班级活跃度图表、用户参与统计
6. **多班级支持**：当前一个部署对应一个班级，未来可扩展为多租户
7. **移动端适配**：进一步优化手机端交互体验
8. **图片懒加载**：瀑布流无限滚动 + 虚拟列表

---

## 十一、项目文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 项目 PRD | `PRD.md` | 产品需求文档（原始设计） |
| 项目总结 | `PROJECT_SUMMARY.md` | 本文档 |
| Vercel 部署 | `docs/DEPLOY_VERCEL.md` | Vercel 详细部署步骤 |
| Netlify 部署 | `docs/DEPLOY_NETLIFY.md` | Netlify 详细部署步骤 |
| 更新日志 | `CHANGELOG.md` | 版本变更记录 |
| README | `README.md` | 项目简介 |

---

> 文档维护：如有部署新问题或功能变更，请及时更新对应文档。
