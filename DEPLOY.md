# ClassMemo 部署指南

## 环境准备

- Node.js 20+
- PostgreSQL 14+
- 或 SQLite（开发环境）

## 步骤

### 1. 克隆项目

```bash
git clone <repo-url>
cd classmemo
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`（如无则手动创建）：

```env
# 数据库（PostgreSQL）
DATABASE_URL="postgresql://用户名:密码@localhost:5432/classmemo"

# NextAuth v5
AUTH_SECRET="随机字符串，至少32字符"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. 初始化数据库

```bash
# 推送 Schema 到数据库
npx prisma db push

# 生成 Prisma Client
npx prisma generate

# （可选）导入种子数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 生产部署

### 构建

```bash
npm run build
```

### 生产环境运行

```bash
npm start
```

或使用 PM2：

```bash
npx pm2 start npm --name "classmemo" -- start
```

### 图片存储

项目默认使用本地文件系统存储上传图片（`public/uploads/`）。

生产环境建议：
- 配置 Nginx 反代静态资源
- 或使用云存储（OSS/S3），修改 `src/lib/upload.ts`

### 反向代理配置（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /path/to/classmemo/public/uploads/;
        expires 30d;
    }
}
```

## 管理员设置

数据库中直接修改用户 `role` 字段为 `SUPER_ADMIN`：

```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = '你的邮箱';
```

---

## 常见问题

**Q: 数据库连接失败？**
A: 检查 `DATABASE_URL` 格式，确保 PostgreSQL 服务运行。

**Q: 图片上传失败？**
A: 确保 `public/uploads/` 目录有写入权限。

**Q: 样式不生效？**
A: 清除 `.next` 缓存：`rm -rf .next` 后重新构建。
