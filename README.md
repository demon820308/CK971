# ClassMemo 青春回忆录

一个为毕业班级打造的沉浸式数字纪念空间。以照片拼贴、留言便签、活动记录为核心，营造充满青春感的回忆体验。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 样式 | Tailwind CSS 4 |
| 动画 | Framer Motion |
| 认证 | NextAuth v5 |
| ORM | Prisma 7 |
| 数据库 | PostgreSQL |
| 图片处理 | sharp |
| 状态/数据 | SWR |

## 核心功能

### 首页 (单页长滚动)
- **Hero 封面** — 蓝天背景 + 班级名称悬浮
- **班级信息** — 点击左上角查看班级详情
- **照片回忆** — 拼贴式瀑布流，随机旋转角度，拖拽式位置调整
- **留言墙** — 便签式散布，手写体风格
- **活动记录** — 卡片式事件展示
- **时间轴结尾** — 入学年份 ~ 毕业年份

### 照片系统
- 上传照片，拖动调整显示位置（`object-position` 存储百分比）
- 缩略图固定 4:3 比例，原图保留完整比例
- 点赞、评论、评论回复
- 详情页全屏查看原图
- 删除（本人/管理员）

### 用户系统
- 注册/登录（邮箱+密码）
- 邀请码加入班级
- 三种角色：MEMBER / ADMIN / SUPER_ADMIN

### 管理后台 (`/admin`)
- 照片管理
- 留言管理
- 活动管理
- 评论管理（照片/留言/活动评论）
- 基本信息设置（班级名称、学校、入学/毕业年份）

## 项目结构

```
src/
  app/                 # Next.js App Router
    api/               # API 路由
    admin/             # 管理后台页面
    (auth)/            # 登录/注册/加入班级
    page.tsx           # 首页
  components/
    sections/          # 页面大区块（Hero、PhotoMemories、MessageBoard...）
    scrapbook/         # 拼贴组件（PolaroidPhoto、Doodle...）
    interactive/       # 交互弹窗（PhotoUploadModal、PhotoCommentModal...）
  hooks/               # 自定义 Hooks（usePhotos、useMessages...）
  lib/                 # 工具库（auth、prisma、upload）
  types/               # TypeScript 类型定义
prisma/
  schema.prisma        # 数据库模型
public/
  uploads/             # 本地图片存储（照片、头像）
```

## 数据库模型

- `User` — 用户（含角色 ROLE）
- `Class` — 班级（含 `cropX`/`cropY` 照片位置百分比）
- `ClassMember` — 班级成员关联
- `Photo` — 照片（含 `cropX`/`cropY` 位置百分比）
- `PhotoLike` / `PhotoComment` — 照片点赞与评论
- `Message` / `MessageReply` — 留言与回复
- `Event` / `EventAttendee` / `EventComment` — 活动与评论

## 环境变量

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/classmemo"
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 开发与部署

```bash
# 安装依赖
npm install

# 数据库迁移
npx prisma db push
npx prisma generate

# 开发
npm run dev

# 构建
npm run build
npm start
```

## 关键 API 路由

| 路由 | 说明 |
|------|------|
| `GET /api/photos` | 照片分页列表 |
| `POST /api/photos` | 上传照片（formData: file, caption, cropX, cropY） |
| `GET /api/classes` | 班级信息 |
| `GET /api/messages` | 留言列表 |
| `GET /api/events` | 活动列表 |
| `POST /api/auth/*` | NextAuth 认证 |
| `/api/admin/*` | 管理后台接口 |

## 设计原则

- 情绪优先，弱化功能性提示
- 拼贴式非对齐布局
- 手写体 + 复古色调
- 滚动淡入 + 轻微浮动动效
