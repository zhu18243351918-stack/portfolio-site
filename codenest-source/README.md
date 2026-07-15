# CodeNest Hero

一个使用 React、Tailwind CSS、hls.js 和 lucide-react 构建的单屏高端编程教育首页。

## 在线编辑

1. 打开网页右下角的设置按钮。
2. 使用 Supabase Auth 中创建的管理员邮箱和密码登录。
3. 可替换品牌名、标题、描述、按钮、玻璃卡片文字、项目、文章、学习路径、个人介绍以及各区素材。
4. Logo 支持图片 URL 或本地上传。
5. 视频请填写 HLS `.m3u8` 链接。
6. 图片可填写公开图片 URL，也可上传本地图片进行当前浏览器预览。
7. `Section heights` 中可以拖动滑杆调整 Projects、Blog、Resume 和 About 的最小页面高度。
8. 学习路径包含 8 个可点击卡片，每个卡片都可替换封面、标题、描述，并设置自己的二级轮播图库。
9. 每个项目、文章、学习路径卡片和个人介绍均可设置二级图库高度，并增删或替换轮播图片 URL。
10. 点击 `Save changes` 后，内容会发布到 Supabase，同时保留当前浏览器备份；其他访客刷新即可看到新版本。
11. 点击 `Copy shareable text link` 可复制包含文字和公开素材 URL 的分享链接，本地上传图片不会写入分享链接。

## 二级图库

点击 Projects 图片、Blog 文章行、8 个 Resume 学习路径卡片或 About 人物图片会进入各自的二级图库。图库支持：

- 触摸或鼠标横向滑动
- 自动播放
- 上一张、下一张和暂停控制
- 键盘左右方向键
- 独立图片高度设置
- 密码编辑器内增删图片

登录管理员账号后，本地图片会压缩并上传到 Supabase Storage，生成可公开访问的图片 URL。浏览器 IndexedDB 仍作为网络异常时的本地备份。

## Supabase

数据库、Storage 和 RLS 初始化脚本位于：

`supabase/setup.sql`

管理员账号和权限配置说明位于：

`supabase/README.md`

## 默认内容替换

长期默认内容集中在：

`src/content.js`

修改该文件后重新构建和部署即可更新所有访问者看到的默认版本。

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

## 密码说明

这是部署在 GitHub Pages 上的静态网页。前端仅使用 Supabase `Publishable key`；写入权限由 Supabase Auth 和 RLS 控制。不要把 `secret`、`service_role` 或数据库密码写入前端源码。
