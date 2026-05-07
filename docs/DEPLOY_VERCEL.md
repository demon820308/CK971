# Vercel 部署详细指南

## 概述
本文档记录将 ClassMemo（Next.js + Prisma + PostgreSQL）项目部署到 Vercel 的完整过程，包括所有踩过的坑和解决方案。

---

## 前置准备

1. 一个 [Vercel](https://vercel.com) 账号
2. 一个 [Neon](https://neon.tech) PostgreSQL 数据库（本项目使用 Neon）
3. 代码已推送到 GitHub/GitLab

---

## 第一步：Neon 数据库配置

### 1.1 注册 Neon
1. 访问 [https://neon.tech](https://neon.tech)
2. 用 GitHub 账号登录（推荐，一键授权）
3. 创建新项目（Project），选择 **AWS ap-southeast-1**（新加坡，国内访问较快）
4. 在 Dashboard 里找到你的数据库，点击 **Connection Details**
5. 复制 **Connection string**（选择 `Prisma` 格式，含 `sslmode=require`）

### 1.2 获取 DATABASE_URL

本项目实际使用的连接字符串：

```
postgresql://neondb_owner:npg_yR1MBZv2QGIq@ep-lively-violet-aopruxud.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**注意**：
- `sslmode=require` 必须包含，否则 Neon 会拒绝连接
- 这个连接字符串同时用于本地开发和生产部署
- Neon Serverless 免费额度：500MB 存储 + 每月 100 小时活跃时间，对小项目足够

### 1.3 推送 Prisma Schema 到 Neon

在本地终端执行：

```bash
# 设置环境变量指向 Neon
$env:DATABASE_URL="postgresql://neondb_owner:npg_yR1MBZv2QGIq@ep-lively-violet-aopruxud.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 推送 schema（不需要迁移，直接同步）
npx prisma db push
```

### 1.4 生成 Prisma Client

```bash
npx prisma generate
```

---

## 第二步：基础部署

### 1.1 导入项目
1. 登录 Vercel Dashboard
2. 点击 **Add New Project**
3. 选择你的 GitHub 仓库（如 `demon820308/CK971`）
4. Vercel 会自动识别为 Next.js 项目

### 1.2 配置环境变量
在 Vercel 项目设置 → **Environment Variables** 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_yR1MBZv2QGIq@ep-lively-violet-aopruxud.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Neon 连接字符串 |
| `AUTH_SECRET` | `yqFhXZBMi5K8LpQeTvRjWnUoAsDg1C3w` | NextAuth 加密密钥 |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_UEnFOdlGHiuMOnYI_0Q4fmt5J9yQ4uFVPfP8UBj4C3NkjCt` | Vercel Blob 图片存储 Token |
| `NEXTAUTH_URL` | `https://你的域名.vercel.app` | 可选，Vercel 会自动推断 |

**默认值备忘**：
- 默认班级邀请码：`CK971-1997`
- 默认管理员邮箱：`admin@classmemo.com`
- 默认管理员密码：`admin123`
- 默认测试用户邮箱：`xiaoming@classmemo.com`
- 默认测试用户密码：`123456`

### 1.3 修改 package.json
确保 `build` 脚本包含 Prisma 生成：

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

---

## 第二步：修复 TypeScript 构建错误

### 错误：`typeof data!.foo[0]` JSX 解析错误

**现象**：
```
Type error: 'data' is possibly 'null'.
(item as typeof data.photoComments[0]).photo.caption
```

**原因**：在 JSX 中 `data!` 的 `!` 被解析器误解为标签关闭符号，而且 `typeof data.photoComments[0]` 在 data 可能为 null 时不安全。

**修复**：使用 `as unknown as` 双重断言：

```tsx
// 错误 ❌
(item as typeof data!.photoComments[0]).photo.caption

// 正确 ✅
((item as unknown) as { photo: { caption: string | null } }).photo.caption ?? "（无标题）"
```

**受影响的文件**：
- `src/app/admin/comments/page.tsx`（128-130行附近）

---

## 第三步：修复废弃的 Next.js Middleware

### 错误：`The "middleware" file convention is deprecated`

**现象**：Vercel 构建日志出现黄色警告，部分功能异常。

**原因**：Next.js 16 已废弃 `src/middleware.ts` 文件约定。

**修复**：

1. **删除** `src/middleware.ts`（如果存在）
2. **移除** `auth.config.ts` 中的 `authorized` callback：

```ts
// src/auth.config.ts - 移除以下代码
// authorized({ auth, request: { nextUrl } }) { ... }
```

3. **在** `src/lib/auth.ts` 中添加 `trustHost: true`：

```ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true, // ← 添加这行，Vercel 部署必须
  providers: [ ... ]
})
```

4. **在** `src/app/admin/layout.tsx` 中添加客户端认证守卫：

```tsx
"use client"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // /admin/setup 页面豁免认证检查
  if (pathname === "/admin/setup") return <>{children}</>

  useEffect(() => {
    if (status === "loading") return
    const role = (session?.user as { role?: string })?.role
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      router.replace("/login")
    }
  }, [session, status, router])
  // ...
}
```

---

## 第四步：修复 Node.js Runtime 问题

### 错误：`PrismaClient / bcrypt` 在 Edge Runtime 不工作

**修复**：在所有使用 Prisma 的 API Route 中添加 Node.js runtime 指令：

```ts
// src/app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs"

// src/app/api/auth/register/route.ts
export const runtime = "nodejs"

// src/app/api/photos/route.ts
export const runtime = "nodejs"

// 其他所有使用 Prisma/bcrypt 的 API 路由
```

---

## 第五步：修复数据库相关错误

### 5.1 错误：`MissingSecret: Please define a \`secret\``

**原因**：`AUTH_SECRET` 环境变量未设置。

**修复**：在 Vercel 环境变量中添加 `AUTH_SECRET`，值用 `openssl rand -base64 32` 生成。

### 5.2 错误：`邀请码无效`

**原因**：数据库里没有班级数据，用户注册时找不到对应的 `inviteCode`。

**修复**：在注册 API 中自动创建默认班级：

```ts
// src/app/api/auth/register/route.ts
let targetClass = await prisma.class.findUnique({ where: { inviteCode } })

if (!targetClass) {
  const anyClass = await prisma.class.findFirst()
  if (!anyClass) {
    // 数据库为空，自动创建默认班级
    targetClass = await prisma.class.create({
      data: {
        name: "财会971班",
        description: "我们的青春记忆",
        inviteCode: "CK971-1997",
        gradeYear: 1997,
        schoolName: "厦门商业学校",
      },
    })
  } else {
    return NextResponse.json({ error: "邀请码无效" }, { status: 400 })
  }
}
```

### 5.3 错误：超级管理员无法注册

**原因**：`/admin/setup` 页面的 API 同样检查是否有班级，没有就报错；且 `admin/layout.tsx` 的认证守卫会拦截 setup 页面。

**修复**：
1. 在 `src/app/api/admin/setup/route.ts` 中同样自动创建默认班级
2. 在 `admin/layout.tsx` 中把 setup 页面的豁免检查放在 `useEffect` 之前：

```tsx
// 放在 useEffect 之前
if (pathname === "/admin/setup") return <>{children}</>
```

---

## 第六步：图片上传配置

### 6.1 安装 Vercel Blob

```bash
npm install @vercel/blob
```

### 6.2 修改上传逻辑

将 `src/lib/upload.ts` 从本地文件系统改为 Vercel Blob：

```ts
import { put } from "@vercel/blob"

export async function uploadPhoto(file: File) {
  const { url } = await put(`photos/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  })
  return url
}
```

### 6.3 配置 next.config.ts

添加 Vercel Blob 域名到 Image 组件白名单：

```ts
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
}
```

### 6.4 图片压缩

Vercel 请求体限制 4.5MB，前端需要先压缩图片：

```ts
function compressImage(file: File, maxW = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW }
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("fail")), "image/jpeg", quality)
    }
    img.src = url
  })
}
```

---

## 第七步：重新部署

修改完成后：
1. `git add . && git commit -m "fix: vercel deployment issues"`
2. `git push origin main`
3. Vercel 会自动触发新部署

---

## 完整环境变量清单

```
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=xxx（随机32位base64字符串）
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

---

## 常见问题速查

| 问题 | 解决 |
|------|------|
| `Module not found: Can't resolve '@vercel/blob'` | `npm install @vercel/blob` 并提交 package.json |
| `MissingSecret` | 添加 `AUTH_SECRET` 环境变量 |
| `邀请码无效` | 数据库没有班级数据，API 中自动创建或手动 seed |
| `Server error` on auth | 添加 `trustHost: true` 到 auth.ts |
| `Module not found: prisma/client` | package.json 添加 `"postinstall": "prisma generate"` |
| 图片上传后 404 | 检查 `BLOB_READ_WRITE_TOKEN` 和 next.config.ts 的 remotePatterns |
| 首页图片不显示 | seed 数据里的旧 URL 是本地路径，需要重新上传 |
| `Request Entity Too Large` | 前端压缩图片到 < 4.5MB |
| `Unexpected token 'R', "Request En"...` | 同上，请求体太大 |
