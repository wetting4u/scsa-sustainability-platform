# BE01 至 BE05 变更记录

本文记录 Yulong 在 `main` 分支完成 BE01 至 BE05 期间产生的代码与文档变更。统计基准是当前工作区相对 Git HEAD 的差异。

对于项目中原本已经存在并被修改的文件，使用 `+新增行/-删除行` 记录实际 Git 行数变化。对于本次新增文件，只记录文件名，不记录行数。行数表示文本差异，不等同于功能代码净增量；格式调整也会计入。

## BE01 注册和登录

完成内容：

- 使用 Supabase Auth 实现邮箱密码注册和登录，不在项目数据库保存密码。
- 注册页面增加 6 位邮箱验证码验证、重新发送验证码和安全错误提示。
- 统一密码规则：至少 8 位，包含大写字母、小写字母、数字和特殊字符。
- 增加 Next.js Proxy，在受保护页面请求期间验证并刷新 Supabase Cookie Session。
- 修复注册步骤切换时 React 输入框由非受控变为受控的警告。
- 补充 Supabase URL、publishable key 和仅服务端 secret key 的环境变量说明。
- Supabase 确认邮件模板目前仍发送确认链接；需要后台维护者将模板改为显示 `{{ .Token }}`，该问题已留档等待最终统一通知团队。

## BE02 注册后资料初始化验证

完成内容：

- 新增 `GET /api/account/initialization`。
- 从已验证的用户会话确定用户 ID，不接受客户端传入所有者 ID。
- 验证新账号存在 `household_profiles` 和 `account_roles`。
- 验证默认角色是 `household`，两个隐私开关默认是 `false`。
- 邮箱验证成功后，注册页面必须通过初始化检查才进入 Overview。
- 初始化缺失时返回统一、安全的 409 错误，不使用管理员密钥在应用层越权补建数据。

## BE03 Profile GET 和 PATCH API

完成内容：

- 新增 `GET /api/profile` 和 `PATCH /api/profile`。
- Profile API 只能读取和修改当前登录用户自己的家庭资料。
- PATCH 严格限制为家庭名称、家庭人数和两个隐私开关。
- 拒绝角色、所有者、系统假名及未知字段。
- Settings 页面从浏览器直接访问 Supabase 改为调用 Profile API。
- 所有成功响应禁止缓存，错误响应不暴露 Supabase 或数据库内部详情。

## BE04 管理员授权工具

完成内容：

- 新增共用服务端 `requireAdmin()`。
- 未登录请求返回 HTTP 401，普通家庭账号返回 HTTP 403，角色查询失败返回安全的 HTTP 500。
- Admin Users、Admin Challenges 和管理员页面布局共用同一套角色验证。
- 每个管理员 API 在读取请求正文或执行高权限操作前验证登录会话和 `account_roles.role`。
- 前端隐藏管理员入口不作为权限控制依据。

## BE05 Admin Users API

完成内容：

- 管理员可以列出、创建、编辑、禁用、恢复和永久删除普通家庭账号。
- 管理员创建账号时使用 `email_confirm: true`，新账号不需要邮箱验证即可直接登录。
- 创建账号沿用 BE01 的密码强度规则。
- PATCH 只允许邮箱、家庭名称、家庭人数和启用状态，拒绝密码、角色、所有者、隐私和未知字段。
- 管理员角色账号不能被禁用或删除，当前管理员不能删除自己。
- 按确认决定采用不可恢复的 Supabase Auth 硬删除，并依赖现有 `ON DELETE CASCADE` 外键清理关联数据。
- 未配置服务端 secret key 时返回安全的 HTTP 503，不显示运行时堆栈。
- 没有增加 `deleted` 字段或软删除逻辑；软删除需求已与验证码模板问题一起留档，等待最终统一通知团队。

## 已存在并修改的文件

| 文件                                              | 新增行 | 删除行 | 主要涉及任务             |
| ------------------------------------------------- | -----: | -----: | ------------------------ |
| `.env.example`                                    |     +5 |     -3 | BE01、BE05               |
| `.gitignore`                                      |     +6 |     -1 | BE01                     |
| `README.md`                                       |    +41 |    -21 | BE01–BE05                |
| `docs/api-contracts.md`                           |    +84 |     -1 | BE02–BE05                |
| `docs/architecture.md`                            |    +30 |    -13 | BE01–BE05                |
| `next-env.d.ts`                                   |     +2 |     -2 | Next.js 开发环境自动生成 |
| `next.config.ts`                                  |     +1 |     -0 | BE02                     |
| `package.json`                                    |     +1 |     -1 | BE01–BE05 测试入口       |
| `src/app/(household)/admin/layout.tsx`            |     +5 |    -19 | BE04                     |
| `src/app/(household)/admin/users/page.tsx`        |    +31 |    -73 | BE05                     |
| `src/app/(household)/layout.tsx`                  |     +3 |     -1 | BE01                     |
| `src/app/(public)/sign-in/page.tsx`               |    +44 |    -44 | BE01                     |
| `src/app/(public)/sign-up/page.tsx`               |   +300 |   -153 | BE01、BE02               |
| `src/features/admin-users/domain.ts`              |   +184 |     -1 | BE05                     |
| `src/features/admin-users/server/service.ts`      |   +107 |   -257 | BE04、BE05               |
| `src/features/challenges/server/admin-service.ts` |    +20 |   -124 | BE04                     |
| `src/features/privacy/settings.tsx`               |   +186 |   -240 | BE03                     |
| `src/lib/supabase/client.ts`                      |     +0 |     -1 | BE01                     |
| `src/lib/supabase/server.ts`                      |     +3 |     -3 | BE01                     |

既有文件差异合计：新增 1053 行，删除 958 行，共 2011 行文本变化。

## 新增文件

- `backend/edit.md`
- `backend/BE01-BE05-changes.md`
- `src/app/api/account/initialization/route.ts`
- `src/app/api/profile/route.ts`
- `src/features/account/domain.ts`
- `src/features/account/server/initialization.ts`
- `src/features/admin/authorization.ts`
- `src/features/admin/server/authorization.ts`
- `src/features/auth/domain.ts`
- `src/features/privacy/client.ts`
- `src/features/privacy/domain.ts`
- `src/features/privacy/server/service.ts`
- `src/lib/supabase/proxy.ts`
- `src/proxy.ts`
- `tests/account-initialization.test.ts`
- `tests/admin-authorization.test.ts`
- `tests/admin-users.test.ts`
- `tests/auth.test.ts`
- `tests/profile.test.ts`

## 删除文件

当前 `main` 工作区相对 Git HEAD 没有删除受版本控制的文件。此前放弃的 Python 方案从未合并到 `main`，其未提交内容保存在 Git stash `abandoned Python BE-01 before Supabase main implementation` 中。

## 数据库边界

- BE01 至 BE05 没有修改数据库同事维护的 migration。
- BE02 使用现有 `initialize_household()` Auth trigger。
- BE03 使用现有 Profile 字段、列级授权和 RLS。
- BE04 使用现有 `account_roles`。
- BE05 硬删除依赖现有引用 `auth.users(id)` 的 `ON DELETE CASCADE` 外键。
- 管理员不会因为用户管理权限而获得其他家庭原始水、电、垃圾记录的读取权限。

## 最终验证状态

- Prettier 格式检查通过。
- TypeScript 类型检查通过。
- 业务测试通过，共 19 项。
- 数据库测试通过，共 7 项。
- Next.js production build 通过。
- BE03 已完成真实 Supabase 手动验收。
- BE05 自动测试已通过；真实管理员列表、创建、编辑、禁用、恢复和硬删除仍需使用已配置 secret key 的管理员账号完成最终手动验收。

## 不进入 main 的本地配置

`.env.local` 包含本机 Supabase 配置和服务端 secret key，已由 `.gitignore` 排除。该文件及其内容不属于可提交到 `main` 的变更，也不应复制到本记录中。
