# SCSA 家庭永续平台原型

使用 Next.js App Router、React、TypeScript、Supabase Auth 和 PostgreSQL。打开首页会跳转到
`/overview`；未登录用户会进入 `/sign-in`，注册用户需要使用邮件中的 6 位验证码确认邮箱。

## 在 VS Code 运行

安装 Node.js 22.13+（包含 npm），打开项目终端：

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

浏览器打开 http://localhost:3000，停止时按 Ctrl+C。
在 `.env.local` 填写 `NEXT_PUBLIC_SUPABASE_URL` 和
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。管理员 API 还需要只供服务端使用的
`SUPABASE_SECRET_KEY`。不要提交 `.env.local`。

## 注册与登录

- `/sign-up` 使用 Supabase Auth 创建账号，不在项目数据库中保存密码。
- Supabase 项目必须启用 Confirm email。
- Confirm sign up 邮件模板必须显示 `{{ .Token }}`，注册页面使用该 6 位验证码调用
  `verifyOtp()`；页面也支持重发验证码。
- 验证码通过后，网站调用 `/api/account/initialization`，确认新账号已有
  `household_profiles`、`account_roles`，角色为 `household`，且两个隐私开关默认关闭。
- `/sign-in` 使用邮箱和密码登录；Next.js Proxy 验证并刷新 Cookie Session。
- 普通认证只使用 publishable key；secret key 只允许出现在服务端管理员代码中。

## 页面流程

1. 注册并输入确认邮件中的验证码，或使用已确认账号登录。
2. 登录后进入 Overview，并可使用 Records、Goals、Challenges、Community 和 Settings。
3. 管理员账号还可进入用户及 Challenge 管理页面。

Settings 通过 `GET/PATCH /api/profile` 读取和修改当前用户的家庭名称、家庭人数及两个隐私偏好。Profile API 从登录会话确定用户，不接受浏览器指定所有者或角色。

## 架构与交接

- [架构和六人分工](docs/architecture.md)
- [API 接口约定](docs/api-contracts.md)
- [Supabase 建表及接入步骤](docs/database.md)
- [原始 SQL 评审与新旧字段对照](docs/schema-review.md)

家庭页面位于 `src/app/(household)`，登录和注册页面位于 `src/app/(public)`。
Admin 页面和 API 位于 `(household)/admin` 与 `app/api/admin`，并在服务端检查角色。
管理员页面、Admin Users API 和 Admin Challenges API 共用服务端 `requireAdmin()`；前端显示管理员入口不构成授权。
Records 表单和表格已拆到 `src/features/records/components/`。
RWD 沿用 `globals.css` 的 Grid、Flexbox 和 media queries，新元件独立样式可用 CSS Modules。

BE-05 Admin Users API 支持列出、创建、编辑、禁用/恢复及永久删除普通家庭账号。管理员创建
的账号已确认邮箱，可以直接登录；管理端不能修改密码、角色或查看家庭原始用量。永久删除
不可恢复。实际使用前必须在服务端 `.env.local` 配置 `SUPABASE_SECRET_KEY`，该值不得使用
`NEXT_PUBLIC_` 前缀或提交到 Git。

## 数据库状态

原始 SQLite 文件保存在 `database/legacy-sqlite/`。
新版 Supabase PostgreSQL schema 位于 `supabase/migrations/20260917000100_initial_schema.sql`，
用于全新开发项目，含 9 张业务表、Auth 用户初始化、日期/数值/重叠约束、列级授权与 RLS。
`supabase/seed.sql` 只提供可选开发挑战和徽章，没有真实账号或用量。

本地代码仍需连接实际 Supabase 开发项目验收 Auth、PostgREST、RLS 和邮件发送。

## 检查

```sh
pnpm test
pnpm test:db
pnpm typecheck
pnpm build
```

`test:db` 使用 PGlite 在本机运行 PostgreSQL migration 和权限测试，不连接云端。
仍需要在真实 Supabase 开发项目验收 Auth、PostgREST 和 RLS。

BE-02 手动验收时使用一个全新邮箱完成注册；成功进入 Overview 后，在浏览器已登录状态访问
`/api/account/initialization`，应返回 HTTP 200 和 `ready: true`。如果返回 409，请由数据库维护者检查共享项目是否已执行包含 `initialize_household()` 的 migration。

## 当前范围

- 只支持水（L）、电（kWh）、垃圾（kg）；公共交通和其他 eco-action 后续扩展。
- 记录的是区间用量，不是累计表读数；同资源的重叠区间不能重复记录。
- 月度、周度及目标统计只包含完整落在查询窗口内的记录，不按天摊分。
- 目标显示用量占上限比例，不能把缺少记录当作节约或完成。
- 挑战完成、徽章颁发、建议、社区数字均未形成真实认证或报告功能。
- 两个隐私开关当前只演示 UI 偏好。真实接入需要服务端验证、认证、RLS 和同意管理。
- 现有可访问性基础包括标签、键盘焦点和响应式布局，仍需正式 WCAG 2.2 AA 验收。
