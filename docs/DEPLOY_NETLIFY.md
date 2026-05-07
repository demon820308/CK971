# Netlify 部署详细指南

## 概述
本文档记录将 ClassMemo（Next.js 16 + Prisma + PostgreSQL）项目部署到 Netlify 的完整过程，包括所有踩过的坑和解决方案。相比 Vercel，Netlify 的优势是**邮箱即可注册**（无需手机验证），但 Next.js 16 的支持需要额外配置。

---

## 前置准备

1. 一个 [Netlify](https://netlify.com) 账号（邮箱注册即可）
2. 一个 [Neon](https://neon.tech) PostgreSQL 数据库（本项目使用 Neon）
3. 代码已推送到 GitHub

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

## 第二步：导入项目

1. 登录 Netlify Dashboard
2. 点击 **Add new site** → **Import an existing project**
3. 选择 **GitHub**，授权并选择你的仓库
4. Netlify 会自动识别为 Next.js 项目，显示提示：
   > "This is a Next.js project. Netlify auto-detected Next.js and will use the Next.js Runtime to build and deploy your project."

### 1.1 基础配置（保持默认）

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Branch | `main` | 默认分支 |
| Base directory | 留空 | 项目根目录 |
| Build command | `npm run build` | 需后续修改 |
| Publish directory | `.next` | Next.js 默认输出目录 |
| Functions directory | 留空 | 由 Next.js Runtime 自动处理 |

**注意**：此时不要直接 Deploy，先完成后续配置。

---

## 第二步：配置环境变量

进入项目 → **Site settings** → **Environment variables** → **Add a variable**

### 2.1 添加单个变量

选择 **"Add a single variable"**，逐个添加：

| Key | Value | Secret? |
|-----|-------|---------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_yR1MBZv2QGIq@ep-lively-violet-aopruxud.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | ✅ 勾选 |
| `AUTH_SECRET` | `yqFhXZBMi5K8LpQeTvRjWnUoAsDg1C3w` | ✅ 勾选 |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_UEnFOdlGHiuMOnYI_0Q4fmt5J9yQ4uFVPfP8UBj4C3NkjCt` | ✅ 勾选 |

**默认值备忘**：
- 默认班级邀请码：`CK971-1997`
- 默认管理员邮箱：`admin@classmemo.com`
- 默认管理员密码：`admin123`
- 默认测试用户邮箱：`xiaoming@classmemo.com`
- 默认测试用户密码：`123456`

### 2.2 Secret 变量的特殊处理

**重要**：如果变量标记为 Secret，Netlify 会强制使用 **"Different value for each deploy context"**。需要为每个环境（Production、Deploy Previews、Branch deploys、Preview Server）都填入相同的值。

**步骤**：
1. 勾选 **"Contains secret values"**
2. 选择 **"Different value for each deploy context"**（系统自动切换）
3. 在每个输入框填入相同的值
4. 点击 **"Create variable"**

---

## 第三步：修改 Build Command

**错误现象**：`Module not found: Can't resolve '@/generated/prisma/client'`

**原因**：Netlify 构建时先运行 `npm run build`，但此时 Prisma Client 尚未生成。

### 3.1 方法一：修改 Netlify 后台 Build 命令（推荐）

1. 进入项目 → **Site settings** → **Build & deploy** → **Build settings**
2. 将 **Build command** 从 `npm run build` 改为：
   ```
   prisma generate && npm run build
   ```
3. 保存

### 3.2 方法二：修改 package.json

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

推荐同时配置两种方式，确保万无一失。

---

## 第四步：修复 TypeScript 构建错误

### 4.1 错误：`typeof data.photoComments[0]`

**现象**：
```
./src/app/admin/comments/page.tsx:129:39
Type error: 'data' is possibly 'null'.
  (item as typeof data.photoComments[0]).photo.caption
```

**原因**：JSX 中 `!` 非空断言在 Turbopack 解析下不生效，`typeof data.photoComments[0]` 无法推断类型。

**修复**（在 `src/app/admin/comments/page.tsx` 中）：

```tsx
// 错误 ❌
(item as typeof data!.photoComments[0]).photo.caption ?? "（无标题）"

// 正确 ✅
((item as unknown) as { photo: { caption: string | null } }).photo.caption ?? "（无标题）"
```

**注意**：修改后如果 Netlify 仍然报错，可能是构建缓存导致。需要在 Netlify 手动触发 **"Clear cache and retry deploy"**。

### 4.2 错误：`prisma/seed-neon.ts` Type 错误

**现象**：
```
./prisma/seed-neon.ts:6:16
Type error: Expected 1 arguments, but got 0.
  const prisma = new PrismaClient()
```

**原因**：`seed-neon.ts` 使用了旧的 Prisma Client 导入路径和构造函数，在 Next.js 16 + 新 Prisma 版本下不兼容。

**修复**：这个文件是 seed 脚本，不参与实际构建。直接删除：

```bash
git rm prisma/seed-neon.ts
git commit -m "remove seed-neon.ts to fix build"
git push
```

---

## 第五步：修复 Page Not Found (404)

**现象**：构建成功，但访问网站显示：
```
Page not found
Looks like you've followed a broken link or entered a URL that doesn't exist on this site.
```

**原因**：Netlify 的 `@netlify/plugin-nextjs` 插件版本太旧，不支持 Next.js 16 的 Turbopack 构建输出。

### 5.1 更新插件

```bash
npm install -D @netlify/plugin-nextjs@latest
```

确保安装到最新版本（v5+），支持 Next.js 16。

### 5.2 创建 netlify.toml

在项目根目录创建 `netlify.toml`：

```toml
[build]
  command = "prisma generate && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 5.3 提交并推送

```bash
git add netlify.toml package.json package-lock.json
git commit -m "fix: update netlify plugin and config for Next.js 16"
git push
```

---

## 第六步：处理 Netlify 构建缓存

**现象**：代码已经修改并推送，但 Netlify 仍然报旧错误。

**原因**：Netlify 会缓存 `node_modules` 和构建产物，导致旧代码被复用。

### 清除缓存重新部署

1. 进入 Netlify 项目 → **Deploys**
2. 找到最新的构建记录
3. 点击 **"Retry deploy"** 下拉菜单
4. 选择 **"Clear cache and retry deploy"**

或者：

在本地做一次空提交，强制 Netlify 拉取最新代码：

```bash
git commit --allow-empty -m "trigger: force rebuild with latest code"
git push
```

---

## 第七步：图片上传配置（与 Vercel Blob 兼容）

Netlify 上可以继续使用 Vercel Blob 存储图片（只要 `BLOB_READ_WRITE_TOKEN` 正确配置），因为 Blob API 是 HTTP 调用，不依赖 Vercel 平台。

### 7.1 环境变量

确保已添加：
```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

### 7.2 next.config.ts 配置

与 Vercel 相同，添加远程图片域名：

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

### 7.3 客户端压缩

Netlify Functions 也有请求体大小限制，前端需要压缩图片：

```ts
// 上传前压缩到 < 4.5MB
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

## 完整部署检查清单

### 部署前检查

- [ ] `package.json` 中 `build` 脚本包含 `prisma generate`
- [ ] `netlify.toml` 已创建并提交
- [ ] `@netlify/plugin-nextjs` 已安装并提交到 package.json
- [ ] `prisma/seed-neon.ts` 已删除（如果存在）
- [ ] TypeScript 错误已修复（`as unknown as` 替代 `typeof`）
- [ ] 所有环境变量已在 Netlify 后台添加
- [ ] `AUTH_SECRET` 已生成并设置

### 部署后检查

- [ ] 首页能正常打开，无 404
- [ ] `/login` 页面能正常显示
- [ ] `/admin/setup` 能正常访问（创建超级管理员）
- [ ] 注册/登录功能正常
- [ ] 图片上传功能正常
- [ ] 数据库数据正确读写

---

## 常见问题速查

| 问题 | 原因 | 解决 |
|------|------|------|
| `Module not found: prisma/client` | Prisma 未生成 | Build command 加 `prisma generate &&` |
| `Type error: 'data' is possibly 'null'` | TypeScript 类型推断 | 用 `as unknown as` 替代 `typeof` |
| `seed-neon.ts` 构建失败 | 旧 seed 脚本不兼容 | 删除 `prisma/seed-neon.ts` |
| 构建成功但 404 | 插件版本太旧 | `npm i -D @netlify/plugin-nextjs@latest` |
| 修改后仍报旧错误 | 构建缓存 | Clear cache and retry deploy |
| 图片上传失败/太大 | 请求体超限 | 前端压缩图片 |
| Secret 变量无法选 Same value | Netlify 限制 | 为每个 context 填入相同值 |

---

## Netlify vs Vercel 对比

| 特性 | Netlify | Vercel |
|------|---------|--------|
| 注册 | ✅ 邮箱即可 | ⚠️ 可能需要手机验证 |
| Next.js 16 支持 | ⚠️ 需手动更新插件 | ✅ 原生支持 |
| 构建速度 | 中等 | 快 |
| 国内访问 | 有亚洲 CDN | 部分区域需代理 |
| 环境变量管理 | 较复杂（Secret 分 context） | 简单直观 |
| Blob 存储 | 需第三方（Vercel Blob / R2） | 原生支持 Vercel Blob |
| 数据库 | 需第三方（Neon / Supabase） | 需第三方 |
| 免费额度 | 100GB 流量/月 | 类似 |

**建议**：如果不想手机验证，Netlify 可用；如果追求最简单的 Next.js 体验，Vercel 更优。
