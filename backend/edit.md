# Backend 变更记录

本文件在 `main` 分支继续记录 Yulong 的认证与账号后端工作。2026 年 9 月 23 日以前的条目来自原 `backend` 分支；Python 方案已经放弃，当前实现以 Next.js 和 Supabase Auth 为准。

## 2026-09-20：建立认证接口初稿

- 新建 `backend/auth/service.ts`，实现邮箱密码注册、登录、邮箱验证码验证、重发验证码，调用 Supabase Auth。
- 新建四个 `src/app/api/auth/*` POST 接口和 `src/features/auth/client.ts` 前端调用工具。
- 这些接口后来被 Python 迁移替换，当前 `main` 不再采用这套代理架构。

## 2026-09-20：安装并验证 Next.js 开发环境

- 安装 Node.js、npm、pnpm，并按 `pnpm-lock.yaml` 安装项目依赖。
- 类型检查、构建和本地开发服务器验证通过。

## 2026-09-20：将认证代码迁移到 Python

- 原 `backend` 分支曾使用 FastAPI、HTTPX 和 Uvicorn 调用 Supabase Auth。
- Next.js 通过 `/api/auth/*` 转发到 Python，Python 与 Next.js 之间使用内部 token。
- 该方案需要同时部署两个服务，已经于 2026-09-23 正式放弃，不合并到 `main`。

## 2026-09-20：准备认证交接文档

- 原 `backend` 分支建立了认证 API、登录注册页面和验证码流程的交接说明。
- 相关密码和验证码安全要求继续用于新的 Supabase 直接认证方案。

## 2026-09-23：完成并封存 Python BE-01 实验

- 原分支完成过注册密码验证、邮箱验证码、错误映射和内存 ASGI 测试。
- 未提交的 Python 工作已保存到 Git stash `abandoned Python BE-01 before Supabase main implementation`，用于审计或必要时恢复。
- `main` 中不保留 Python 文件、Uvicorn 服务、`AUTH_SERVICE_URL` 或 `AUTH_INTERNAL_TOKEN`。

## 2026-09-23：在 main 实施 Supabase BE-01

- 保留现有 `/sign-in` 和 `/sign-up` 页面视觉结构，改进可访问性、自动填充属性、提交状态和安全错误提示。
- 注册继续调用 `supabase.auth.signUp()`，项目不保存、记录或返回用户密码。
- 注册页面新增 6 位邮箱验证码步骤，使用 `supabase.auth.verifyOtp()` 验证，并使用 `supabase.auth.resend()` 重发注册确认邮件。
- 密码规则统一为至少 8 位且包含大写字母、小写字母、数字和特殊字符。
- 新增稳定的认证错误映射，避免直接显示 Supabase 的内部错误详情。
- 新增 Next.js 16 `src/proxy.ts` 和 Supabase Session 刷新逻辑，验证并刷新 Cookie 中的访问令牌。
- 新增认证 domain 自动化测试，覆盖密码规则和安全错误映射。
- Supabase 项目仍须启用 Confirm email，并在确认邮件模板中显示 `{{ .Token }}`，才能完成真实邮件验收。

## 2026-09-23：main 分支文件变更明细

从本节开始，项目内每次文件新增、修改和删除都记录在此文件中。

### 新增文件

- `backend/edit.md`：保存后端开发和文件变更日志。
- `src/features/auth/domain.ts`：集中实现密码规则校验和 Supabase 登录、注册错误信息转换。
- `src/lib/supabase/proxy.ts`：在请求进入受保护页面前刷新并校验 Supabase 登录会话。
- `src/proxy.ts`：配置 Next.js 16 Proxy，使会话检查应用到项目页面。
- `tests/auth.test.ts`：测试密码规则和常见认证错误转换。

### 修改文件

- `.env.example`：补充 Supabase URL、publishable key 和仅服务端使用的 secret key 示例。
- `.gitignore`：忽略 `.env.local`、其他本地环境文件、`.DS_Store` 和临时 Next.js 构建缓存目录。
- `README.md`：补充 Supabase Auth 配置、启动和手动测试说明。
- `docs/architecture.md`：更新 BE-01 的 Supabase Auth 架构、职责边界和认证流程。
- `package.json`：把认证测试加入项目测试命令。
- `src/app/(household)/layout.tsx`：将登录后区域设为动态渲染，并在服务端检查当前用户。
- `src/app/(public)/sign-in/page.tsx`：连接 Supabase 密码登录、显示友好错误并在成功后跳转到 `/overview`。
- `src/app/(public)/sign-up/page.tsx`：连接 Supabase 注册、六位邮箱验证码验证和重新发送验证码功能。
- `src/lib/supabase/client.ts`：整理浏览器端 Supabase client，移除过时的 demo 说明。
- `src/lib/supabase/server.ts`：更新服务端 client 和会话刷新相关说明。
- `backend/edit.md`：补充本次所有新增、修改、删除及本地维护操作的明细。

### 删除或清理

- 删除本地残留的 Python `.pyc` 和 `__pycache__` 缓存；main 分支不保留此前 Python 版认证实现。
- 删除运行开发服务器时自动生成、但不属于项目源码的 `AGENTS.md` 和 `CLAUDE.md`。
- 将旧 `.next` 缓存移到 `/private/tmp/scsa-next-cache-before-be01`，随后由 Next.js 重新生成有效构建缓存；该缓存不进入 Git。
- 此前 backend 分支尚未提交的 Python 工作保存在 Git stash `abandoned Python BE-01 before Supabase main implementation` 中，没有合并进 main。

### 验证记录

- `pnpm typecheck`：通过。
- `pnpm test`：通过，共 4 项测试。
- `pnpm test:db`：通过，共 7 项测试。
- `pnpm exec next build --webpack`：通过。
- 使用临时 Supabase 配置启动开发服务器，`/sign-in` 和 `/sign-up` 均返回 HTTP 200；真实注册和登录仍需在 `.env.local` 中配置实际 Supabase 项目。

## 2026-09-23：配置本地 Supabase 连接

### 修改文件

- `.env.local`：写入 `scsa-development` 的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；将用户提供的 Markdown 转义内容整理为有效 dotenv 格式。
- `backend/edit.md`：记录本次 `.env.local` 修改。

### 安全说明

- `SUPABASE_SECRET_KEY` 继续留空；登录和注册不需要该密钥。
- `.env.local` 已被 Git 忽略，不应提交到远程仓库。

## 2026-09-23：修复注册页面输入框状态警告

### 修改文件

- `src/app/(public)/sign-up/page.tsx`：为注册资料表单和邮箱验证码表单设置不同的 React `key`，确保步骤切换时重新创建输入框，避免邮箱输入框从非受控状态切换为验证码输入框的受控状态。
- `backend/edit.md`：记录本次 React 表单警告修复。

### 错误归属

- 该警告属于 BE-01 注册及邮箱验证集成过程中产生的问题，虽然表现为前端 React 警告，但由本次认证流程修改负责修复。

## 待全部工作完成后统一通知团队

- Supabase `Confirm signup` 邮件模板当前发送 `{{ .ConfirmationURL }}` 链接，但注册页面需要 6 位验证码；需要有 Supabase Dashboard 权限的同事将模板改为显示 `{{ .Token }}`。
- 此项属于 BE-01 的确认信流程依赖；Yulong 负责说明需求和最终验收，Supabase 后台维护者负责实际配置。
- Week 8 文档后续讨论提出在 `household_profiles` 增加 `deleted boolean` 以支持误删恢复，但当前 migration 没有该字段。经确认，BE-05 本次跳过软删除并使用 Supabase Auth 永久硬删除；此差异留档，最终统一通知团队，并由团队决定后续版本是否由数据库同事增加字段及恢复策略。
- 按用户要求，目前不单独联系其他同事；待所有工作完成后与其他依赖和交接事项一次性汇总通知。

## 2026-09-23：完成 BE-02 注册后资料初始化验证

### 新增文件

- `src/features/account/domain.ts`：定义账号初始化检查结果，并验证本人资料、普通角色和两个隐私默认值。
- `src/features/account/server/initialization.ts`：使用当前 Supabase 会话查询本人的 `household_profiles` 与 `account_roles`，返回安全、无缓存的验证结果。
- `src/app/api/account/initialization/route.ts`：提供 `GET /api/account/initialization` 验证入口。
- `tests/account-initialization.test.ts`：测试正常初始化、缺失记录、错误角色和非私密默认值。

### 修改文件

- `src/app/(public)/sign-up/page.tsx`：邮箱验证码通过后调用 BE-02 验证接口；初始化不完整时停止跳转并显示安全错误。
- `package.json`：将 BE-02 domain 测试加入 `pnpm test`。
- `docs/api-contracts.md`：记录初始化验证接口、状态码、响应格式和职责边界。
- `docs/architecture.md`：补充 BE-02 目录与数据流。
- `README.md`：补充自动验证行为和真实 Supabase 手动验收步骤。
- `backend/edit.md`：记录待最终统一通知的问题及本次 BE-02 的全部文件变更。
- `next.config.ts`：关闭 Next.js 16 开发服务器自动生成代理说明文件的行为，避免每次本地验证都产生无关文件。

### 删除或清理

- 本地 HTTP 验证启动 `next dev` 时临时生成了 `AGENTS.md` 和 `CLAUDE.md`；验证结束后已删除，并通过 `next.config.ts` 防止再次自动生成。

### 未修改的数据库文件

- `supabase/migrations/20260917000100_initial_schema.sql` 已包含 `initialize_household()` Auth trigger，负责为新用户创建 `household_profiles` 和 `account_roles`，本次没有改写数据库同事维护的 migration。
- `tests/database.test.mjs` 已验证新注册账号拥有两条初始化记录、`household` 角色及两个 `false` 隐私默认值，本次没有重复修改该测试。

### 验证结果

- 格式检查通过。
- TypeScript 类型检查通过。
- 业务测试通过，共 7 项。
- 数据库测试通过，共 7 项。
- Next.js production build 通过，构建结果包含动态路由 `/api/account/initialization`。
- 未登录请求 `/api/account/initialization` 返回 HTTP 401、`UNAUTHENTICATED` 和 `Cache-Control: no-store`。

## 2026-09-23：完成 BE-03 Profile GET/PATCH API

### 新增文件

- `src/features/privacy/domain.ts`：定义 Profile 响应与 PATCH 类型，并验证字段白名单、家庭名称、家庭人数和两个布尔隐私值。
- `src/features/privacy/client.ts`：提供 Settings 页面使用的 `profileApi.get()` 与 `profileApi.update()` 客户端适配层。
- `src/features/privacy/server/service.ts`：从当前 Supabase Cookie Session 获取用户，只查询和修改本人的 `household_profiles`，并提供安全错误响应。
- `src/app/api/profile/route.ts`：提供 `GET /api/profile` 和 `PATCH /api/profile`。
- `tests/profile.test.ts`：测试合法 Profile 更新、边界值、布尔值以及所有者、角色、假名和未知字段拒绝规则。

### 修改文件

- `src/features/privacy/settings.tsx`：保留现有页面结构和样式，将资料与隐私偏好的直接 Supabase 查询改为 BE-03 API，并避免显示 Supabase 原始错误。
- `package.json`：将 Profile domain 测试加入 `pnpm test`。
- `docs/api-contracts.md`：记录 BE-03 请求响应格式、字段限制、状态码和权限边界。
- `docs/architecture.md`：补充 BE-03 目录和数据流。
- `README.md`：说明 Settings 使用 Profile API 及会话所有权规则。
- `backend/edit.md`：记录本次 BE-03 的全部文件变更。

### 未修改的数据库文件

- BE-03 使用现有 `household_profiles` 字段、列级授权及 RLS，没有修改数据库同事维护的 migration。

### 验证结果

- Prettier 格式检查通过。
- TypeScript 类型检查通过。
- 业务测试通过，共 11 项，其中 4 项覆盖 Profile PATCH 验证。
- 数据库测试通过，共 7 项。
- Next.js production build 通过，构建结果包含动态路由 `/api/profile`。
- 未登录 `GET /api/profile` 和 `PATCH /api/profile` 均返回 HTTP 401、`UNAUTHENTICATED` 和 `Cache-Control: no-store`。
- 用户已使用真实登录账号完成 BE-03 手动验收：Profile GET、资料修改、隐私开关持久化及访问控制表现符合预期。
- `backend/edit.md`：补记 BE-03 真实 Supabase 手动验收成功。

## 2026-09-23：完成 BE-04 管理员授权工具

### 新增文件

- `src/features/admin/authorization.ts`：集中定义未登录、非管理员、角色查询失败和管理员通过的授权判定。
- `src/features/admin/server/authorization.ts`：实现共用服务端 `requireAdmin()`，验证 Supabase Session 并查询当前用户的 `account_roles`。
- `tests/admin-authorization.test.ts`：覆盖 401、403、500 和管理员通过四类授权结果。

### 修改文件

- `src/features/admin-users/server/service.ts`：删除内部重复 `requireAdmin()`，所有 Admin Users 操作改用共用授权工具。
- `src/features/challenges/server/admin-service.ts`：删除内部重复 `requireAdmin()`，所有 Admin Challenges 写操作改用共用授权工具。
- `src/app/(household)/admin/layout.tsx`：管理员页面改用共用授权工具决定跳转。
- `package.json`：将管理员授权测试加入 `pnpm test`。
- `docs/api-contracts.md`：记录 BE-04 状态码、错误代码和使用要求。
- `docs/architecture.md`：补充共用管理员授权目录与数据流。
- `README.md`：说明管理员页面和 API 共用服务端授权。
- `backend/edit.md`：记录本次 BE-04 的全部文件变更。

### 未修改的数据库文件

- BE-04 读取现有 `account_roles` 并依赖现有本人只读 RLS，没有修改数据库同事维护的 migration。

### 验证结果

- Prettier 格式检查和 TypeScript 类型检查通过。
- 业务测试通过，共 15 项；管理员授权测试覆盖未登录、普通用户、缺失角色、角色查询失败和管理员通过。
- 数据库测试通过，共 7 项。
- Next.js production build 通过。
- 未登录请求 Admin Users 与 Admin Challenges API 均在读取请求或执行管理操作前返回 HTTP 401、统一的 `UNAUTHENTICATED` 响应和 `Cache-Control: no-store`。
- 普通登录用户的 HTTP 403 和真实管理员通过仍需使用共享 Supabase 中相应角色账号手动验收。

## 2026-09-23：完成 BE-05 Admin Users API

### 已确认的实现决定

- 遵守 Week 8 文档权限边界：管理员可以管理 Yulong 工作范围内的账号和家庭资料，但不能修改其他用户密码、授予或撤销管理员角色，也不能查看家庭水、电、垃圾原始记录。
- 管理员创建的账号固定为普通 `household` 用户，并通过 Supabase Admin Auth 的 `email_confirm: true` 直接确认邮箱；用户可以立即登录，不需要收到或输入邮箱验证码。
- 按用户明确决定，本次采用不可恢复的硬删除。当前管理员不能删除自己，任何管理员角色账号均不能被禁用或删除。
- 暂不实现 Week 8 后续讨论中的 `household_profiles.deleted` 软删除；该数据库依赖已与验证码邮件模板问题一起保留在“待全部工作完成后统一通知团队”。

### 新增文件

- `tests/admin-users.test.ts`：测试管理员创建账号输入规范、统一密码强度、PATCH 字段白名单及越界字段拒绝。

### 修改文件

- `src/features/admin-users/domain.ts`：新增 POST/PATCH 严格运行时验证；复用 BE-01 密码规则，只接受已批准字段，拒绝角色、密码更新、所有者、隐私和未知字段。
- `src/features/admin-users/server/service.ts`：接入严格验证；管理员创建用户保持邮箱直接确认；检查初始化资料确实存在；重复邮箱返回 409；更新资料不存在返回 404；硬删除前确认目标存在并保护管理员账号；secret key 未配置时返回安全的 503 而不是运行时错误页面。
- `src/app/(household)/admin/users/page.tsx`：明确管理员创建账号可以直接登录且无需验证邮件，并使密码输入规则包含数字，与 BE-01 一致。
- `package.json`：将 BE-05 管理员用户验证测试加入 `pnpm test`。
- `docs/api-contracts.md`：记录 BE-05 路由、允许字段、权限边界、立即登录及硬删除语义。
- `docs/architecture.md`：补充 BE-05 目录与 Supabase Admin 数据流。
- `README.md`：补充 Admin Users 能力、安全边界、硬删除警告和 secret key 配置要求。
- `backend/edit.md`：记录 BE-05 决策、全部文件变更和待统一通知事项。

### 未修改的数据库文件

- 没有改动数据库同事维护的 migration。硬删除依赖现有表对 `auth.users(id)` 的 `ON DELETE CASCADE` 外键。
- 没有新增 `deleted` 字段或软删除逻辑。

### 验证结果

- Prettier 格式化完成，TypeScript 类型检查通过。
- 业务测试通过，共 19 项；其中 4 项新增测试覆盖 BE-05 创建、密码强度、允许更新字段及越界字段拒绝。
- 数据库测试通过，共 7 项，确认管理员仍没有跨家庭读取原始用量的数据库权限。
- Next.js production build 通过，构建结果包含 `/admin/users`、`/api/admin/users` 和 `/api/admin/users/[userId]`。
- 真实管理员的列出、创建、编辑、禁用/恢复及硬删除仍需在本机设置 `SUPABASE_SECRET_KEY` 后手动验收；该 secret 不应发送到聊天、加入 `NEXT_PUBLIC_` 前缀或提交到 Git。

## 2026-09-23：建立 BE01 至 BE05 汇总变更记录

### 新增文件

- `backend/BE01-BE05-changes.md`：按任务汇总 BE01 至 BE05 的实现内容；既有修改文件记录文件名及 Git 新增/删除行数，新文件只记录文件名，并说明数据库边界、验证状态和不进入 main 的本地配置。

### 修改文件

- `backend/edit.md`：记录新增 BE01 至 BE05 汇总变更文件。
