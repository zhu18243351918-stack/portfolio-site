# Anthony Portfolio

使用 React、Tailwind CSS、OGL、Supabase 和 lucide-react 构建的可编辑个人作品集。

## 在线编辑

1. 打开网页右下角的设置按钮。
2. 使用 Supabase Auth 中创建的管理员邮箱和密码登录。
3. 可修改品牌、导航、首屏文案、项目、文章、履历、个人介绍和二级图库。
4. 首屏背景可在 `Galaxy` 和 `Image` 之间切换。
5. 图片支持公开 URL 或上传到 Supabase Storage。
6. 点击 `Save changes` 后，内容会发布到 Supabase，并保留当前浏览器备份。

Galaxy 背景由 `src/Galaxy.jsx` 和 `src/Galaxy.css` 提供。默认视觉参数位于 `src/App.jsx` 的 `BackgroundMedia` 组件中。

## Supabase

数据库、Storage 和 RLS 初始化脚本：

`supabase/setup.sql`

管理员账号和权限配置说明：

`supabase/README.md`

## 默认内容

默认文案和素材集中在：

`src/content.js`

## 本地运行

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

输出目录为 `dist`。

前端只能使用 Supabase `Publishable key`。不要把 `secret`、`service_role` 或数据库密码写入前端源码。
