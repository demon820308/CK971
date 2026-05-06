# 更新日志

## [1.0.0] - 项目完成

### 新增功能

#### 班级信息与管理
- 首页动态显示班级名称、学校、入学年份、毕业年份
- 管理后台 `/admin/settings` 可编辑班级基本信息
- 支持 `endYear` 字段，时间轴自动计算显示年份范围

#### 照片系统增强
- 上传照片时支持 **拖动调整显示位置**（在固定 4:3 框内上下左右移动图片）
- 调整位置使用 CSS `object-position` 百分比存储，**原图完整保留**不裁切
- 缩略图卡片 `PolaroidPhoto` 根据存储的 `cropX`/`cropY` 显示用户选定的区域
- 照片详情弹窗以 **原始比例** 显示完整照片（`object-contain`）
- 详情页右下角新增 **全屏查看** 按钮，点击后最大化展示原图，支持 ESC 键关闭

#### 管理后台
- 照片管理 — 查看/删除所有照片
- 留言管理 — 查看/删除留言
- 活动管理 — 查看/删除活动
- **评论管理** — 统一管理照片评论、留言回复、活动评论，支持删除
- **基本信息设置** — 查看/编辑班级名称、学校、入学/毕业年份（先只读后编辑模式）
- 侧边栏导航分组：照片、留言、活动、回复、基本信息

#### 数据模型
- `Class` 模型新增 `endYear` 字段
- `Photo` 模型新增 `cropX`、`cropY` 字段（默认 50，居中）
- Prisma 迁移并生成客户端

### 技术改动

- 新增依赖：`react-image-crop`（后移除 canvas 裁切逻辑，仅用于 UI 参考）
- 照片上传 API (`POST /api/photos`) 接收 `cropX`、`cropY` 参数
- 照片查询 API 返回 `cropX`、`cropY`
- 前端 `Photo` 类型扩展 `cropX`、`cropY` 字段
- `PhotoUploadModal` 三步流程：选图 → 调整位置 → 填写说明
- `PhotoCommentModal` 支持全屏查看原图

### 修复
- 修复 `GET /api/admin/settings` 500 错误
- 修复 `admin/comments` 页面 `author` 字段名不匹配 Prisma schema 的问题（应为 `user`）
