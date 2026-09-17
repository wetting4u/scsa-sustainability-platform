# SCSA 家庭永续平台原型

使用 Next.js App Router、React、TypeScript 和普通 CSS。打开首页会跳转到 `/overview`，
目前免登录展示水、电、垃圾的家庭仪表板。无需数据库或环境变量就能运行。

## 在 VS Code 运行

安装 Node.js 22.13+（包含 npm），打开项目终端：

```sh
npm install
npm run dev
```

浏览器打开 http://localhost:3000，停止时按 Ctrl+C。
如果 PowerShell 阻止 npm 脚本，使用 Command Prompt 终端或 npm.cmd。
项目维护 pnpm-lock.yaml；团队若统一采用 pnpm，可使用 `pnpm install --frozen-lockfile` 和 `pnpm dev`，避免同时维护两套锁文件。

## 演示流程

1. Overview 显示固定在 2026 年 9 月的假数据。
2. 在 My records 新增 9 月 15–21 日电量 50 kWh，回到 Overview，电量从 122 变成 172 kWh。
3. 可以筛选、编辑、删除记录，新增目标，加入或退出挑战。
4. Settings & privacy 的两个隐私开关独立，默认关闭。
5. 页面间导航保留内存修改；刷新或 Reset demo 恢复原始假数据。

## 架构与交接

- [架构和六人分工](docs/architecture.md)
- [API 接口约定](docs/api-contracts.md)
- [Supabase 建表及接入步骤](docs/database.md)
- [原始 SQL 评审与新旧字段对照](docs/schema-review.md)

现有页面位于 `src/app/(household)`。`(public)` 目前只有首页跳转。
Admin 规划为独立 `src/app/admin`，当前没有管理页面、管理员 API 或登录流程。
Records 表单和表格已拆到 `src/features/records/components/`。
RWD 沿用 `globals.css` 的 Grid、Flexbox 和 media queries，新元件独立样式可用 CSS Modules。

## 数据库状态

原始 SQLite 文件保存在 `database/legacy-sqlite/`。
新版 Supabase PostgreSQL schema 位于 `supabase/migrations/20260917000100_initial_schema.sql`，
用于全新开发项目，含 9 张业务表、Auth 用户初始化、日期/数值/重叠约束、列级授权与 RLS。
`supabase/seed.sql` 只提供可选开发挑战和徽章，没有真实账号或用量。

尚未在云端执行，也没有接通真实数据。`/api/records` 及其记录子路由目前返回 501。
填写 `.env.local` 或执行 migration 不会自动切换演示模式。
数据库类型、repository、登录和正式管理功能属于下一阶段。

## 检查

```sh
npm run test
npm run test:db
npm run typecheck
npm run build
```

`test:db` 使用 PGlite 在本机运行 PostgreSQL migration 和权限测试，不连接云端。
仍需要在真实 Supabase 开发项目验收 Auth、PostgREST 和 RLS。

## 当前范围

- 只支持水（L）、电（kWh）、垃圾（kg）；公共交通和其他 eco-action 后续扩展。
- 记录的是区间用量，不是累计表读数；同资源的重叠区间不能重复记录。
- 月度、周度及目标统计只包含完整落在查询窗口内的记录，不按天摊分。
- 目标显示用量占上限比例，不能把缺少记录当作节约或完成。
- 挑战完成、徽章颁发、建议、社区数字均未形成真实认证或报告功能。
- 两个隐私开关当前只演示 UI 偏好。真实接入需要服务端验证、认证、RLS 和同意管理。
- 现有可访问性基础包括标签、键盘焦点和响应式布局，仍需正式 WCAG 2.2 AA 验收。
