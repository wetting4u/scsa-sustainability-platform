# Supabase 数据库接入与交接

## 当前状态

- 已参考组员原始 SQL，创建 `supabase/migrations/20260917000100_initial_schema.sql`。
- 原始 SQLite 文件保留在 `database/legacy-sqlite/`，没有修改。
- 新 migration 面向全新 Supabase 项目，不是线上旧库升级或旧数据搬迁脚本。
- 尚未在云端执行；网页仍使用 DemoProvider，API 仍返回 501。
- SDK 已安装，`.env.local` 不是运行演示的必要条件。

详细设计和新旧字段对照见 [schema 评审](schema-review.md)。

## 建表步骤

1. 在 Supabase 建立开发项目，确认目标项目没有同名业务表。
2. 打开 SQL Editor，执行上述 migration 的完整内容。脚本包含事务、扩展、9 张业务表、Auth 触发器、授权与 RLS。
3. 刷新 Table Editor，应能看到 resources、household_profiles、account_roles、usage_records、goals、challenges、challenge_memberships、badges、user_badges。
4. 可选执行 `supabase/seed.sql`，只建立开发挑战和徽章。日期固定为 2026 年 9 月，与前端示例一致。
5. 通过 Supabase Auth 创建测试账号。触发器自动建立家庭资料与 household 角色；不要向 auth.users 手写演示密码。
6. 在真实 Supabase 开发项目中验证两账号的 RLS、注册触发器及 Auth 流程。本机测试无法替代实际 Auth/PostgREST 验收。
7. 从已建立的 schema 生成 `src/types/database.ts`，给两个 Supabase 客户端加上生成类型。
8. 复制 `.env.example` 为 `.env.local`，填写项目 URL 和 publishable key，再重启开发服务器。
9. 后端完成登录、会话刷新、repository、服务端验证后，再把 UI 从演示数据切换为 API。

手动执行 SQL Editor 不会自动登记 Supabase CLI 的 migration 历史。以后引入 CLI 时，先核对远端结构并登记已应用版本，不要重复执行初始化脚本。
以后每次改字段新增 migration，不要修改已执行的初始版本，也不要使用 DROP 重建真实数据库。
SQL Editor 通常以高权限执行，查询成功不证明普通用户 RLS 正确。

## 管理员与隐私

第一阶段假设一个账号代表一个家庭。`account_roles` 单独保存应用角色，普通用户只能读自己的角色。
首次管理员由可信维护者在 SQL Editor 中更新已存在账号的角色：

```sql
-- 将占位文字换成 Auth 页面确认过的用户 UUID 后再执行。
update public.account_roles set role = 'admin' where user_id = '<用户 UUID>'::uuid;
```

此操作只分配角色，不创建管理页面，也不自动赋予读取他人原始用量的权限。
管理账号的停用、删除与邮箱查询需要后续受保护的服务端 Admin API，不能直接给浏览器高权限 key。
`share_analytics` 和 `display_leaderboard` 独立且默认 false；目前没有公开数据的 view/RPC。
不要因为用户开启开关就把整张家庭表开放读取。
后续聚合必须考虑最小群体、固定时间窗口、撤回同意和差分查询风险；旧版“至少 3 户”不是完整匿名保证。

## 开发与验证

```sh
npm run test:db
```

测试使用 PGlite（本机 PostgreSQL 引擎），模拟最小 auth.users、auth.uid() 和 Supabase 数据库角色，
执行真实 migration、seed 和权限检查，不联网、不修改云端，也不需要另外安装 PostgreSQL。
它不测试 Supabase Auth 服务、JWT 签名、PostgREST、网络或真正的并发连接。

密钥不要提交到 Git。Vercel 环境变量需另外设置；publishable key 可用于客户端，secret/service-role key 不可放在 NEXT_PUBLIC 变量中。
客户端工厂当前适用于浏览器及可写 cookie 的 Route Handler / Server Action；认证 Server Component 还需要会话刷新 Proxy。

参考：[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、
[PostgreSQL 范围与排斥约束](https://www.postgresql.org/docs/15/rangetypes.html)。
