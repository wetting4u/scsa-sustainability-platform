# API 接口约定

## Week 9：账号状态与共用错误响应

所有需要登录的 Next.js 页面和业务 API 在继续处理前调用共用的
`requireActiveUser()`。该检查不信任浏览器传入的账号状态，而是使用当前 Cookie Session
取得用户，再由仅服务端使用的 Supabase Admin client 查询最新 `banned_until`。

- 未登录或账号已不存在：HTTP 401 `UNAUTHENTICATED`。
- 账号已被管理员禁用：HTTP 403 `ACCOUNT_DISABLED`。
- 无法查询最新账号状态（包括未配置 `SUPABASE_SECRET_KEY`）：HTTP 503
  `ACCOUNT_STATUS_UNAVAILABLE`，请求采用 fail-closed，不继续读取或修改业务数据。
- 已登录但不是管理员：管理 API 返回 HTTP 403 `FORBIDDEN`。
- Admin client 无法建立：管理功能返回 HTTP 503 `ADMIN_SERVICE_UNAVAILABLE`。

错误格式统一为：

```json
{
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "This account has been disabled by an administrator."
  }
}
```

上述响应均使用 `Cache-Control: no-store`。前端/API 对接同事应按 `error.code` 判断状态，
不要依赖英文文案，也不要把 Supabase 原始错误直接显示给用户。本次未新增需要前端调用的
账号状态 API；检查已内置在现有服务入口。

重要边界：这层保护覆盖本项目的 Next.js 页面与 API。若客户端绕过本项目接口，直接携带
禁用前签发且尚未过期的 JWT 调用 Supabase Data API，仍需数据库同事在 RLS/数据库层增加
账号启用状态约束，才能立即拒绝该类请求。

## BE-02 注册后资料初始化验证

`GET /api/account/initialization` 使用当前 Supabase 登录会话检查新账号初始化结果，不接受浏览器提供的 `user_id`。

成功响应为 HTTP 200：

```json
{
  "data": {
    "ready": true,
    "checks": {
      "profileExists": true,
      "roleExists": true,
      "householdRole": true,
      "analyticsPrivate": true,
      "leaderboardPrivate": true
    }
  }
}
```

账号未登录或邮箱尚未确认时返回 401；数据库查询失败返回 500；缺少 `household_profiles`、`account_roles`，角色不是 `household`，或两个隐私开关不是 `false` 时返回 409 `ACCOUNT_INITIALIZATION_INCOMPLETE`。

该接口只验证初始化结果，不使用管理员密钥补建资料或修改角色。初始化由数据库维护者提供的 Auth trigger 完成。

## BE-03 Profile GET/PATCH API

`GET /api/profile` 使用当前 Supabase 登录会话返回本人的家庭资料：

```json
{
  "data": {
    "displayName": "Green household",
    "householdSize": 3,
    "shareAnalytics": false,
    "displayLeaderboard": false
  }
}
```

`PATCH /api/profile` 接受上述字段的任意非空子集。`displayName` 去除首尾空白后必须为 1–60 个字符；`householdSize` 必须是 1–20 的整数；两个隐私字段必须是 JSON boolean。

接口拒绝 `user_id`、`userId`、`role`、`pseudonym` 和其他未知字段。用户 ID 只来自验证后的 Cookie Session，并且数据库 RLS 再次限制只能读取或修改本人记录。未登录返回 401，非法 JSON 或字段返回 400，初始化资料不存在返回 404，数据库错误返回 500。成功 GET/PATCH 均返回 200，并设置 `Cache-Control: no-store`。

## BE-04 管理员授权

所有 `/api/admin/*` 服务在读取请求内容或执行高权限操作前调用共用的 `requireAdmin()`。该工具只信任 Supabase 验证后的 Cookie Session，并从 `account_roles` 查询当前用户角色。

- 未登录：HTTP 401 `UNAUTHENTICATED`。
- 已登录但角色缺失或不是 `admin`：HTTP 403 `FORBIDDEN`。
- 角色查询失败：HTTP 500 `ROLE_CHECK_FAILED`，不向客户端暴露数据库详情。
- 已验证管理员：将请求级用户会话客户端和可信 `userId` 交给后续服务。

管理员页面布局也使用同一工具：未登录跳转 `/sign-in`，非管理员或角色检查失败跳转 `/overview`。页面隐藏或 Proxy 不能替代各个管理 API 的服务端检查。

Week 9 审计确认：当前 `/api/admin/users*` 与 `/api/admin/challenges*` 的每个入口都在读取
请求体或执行高权限操作前调用 `requireAdmin()`；角色只取自服务端查询，不接受客户端提供
的 `role`。`SUPABASE_SECRET_KEY` 只由 server-only 模块读取，响应 DTO 不包含密码、密码哈希
或 secret。

## Week 9 BE-05 共用输入校验工具

`src/lib/validation/index.ts` 提供独立、可复用的服务端校验工具：

- `validateText()`：去除首尾空白，检查最短/最长长度、正则格式及敏感词匹配器。
- `validateNumberRange()`：检查 number、有限值、整数要求和最小/最大值。
- `validateAllowedValue()`：只接受显式 allow-list 中的字符串。
- `findSensitiveWord()`：敏感词匹配接口。

生产敏感词列表位于 `src/lib/validation/sensitive-words.ts`，目前按任务决定保持空数组。
收到内容规则负责人确认的词库后，只需填写 `SENSITIVE_WORDS`，或由具体功能通过
`sensitiveWords`/`sensitiveWordMatcher` 注入。各功能负责人仍须在自己的 DTO/service 中调用
这些工具；工具本身不会自动拦截尚未接入的字段，也不会改写现有密码规则。

## BE-05 Admin Users API

所有接口先执行 BE-04 `requireAdmin()`，并使用仅存在于服务端的
`SUPABASE_SECRET_KEY` 创建 Supabase Admin client。普通家庭账号不能调用这些接口。

| 方法   | 地址                       | 行为                                                  |
| ------ | -------------------------- | ----------------------------------------------------- |
| GET    | `/api/admin/users`         | 列出账号、家庭名称、家庭人数、角色、状态和创建时间    |
| POST   | `/api/admin/users`         | 创建已确认的普通家庭账号，无需邮箱验证即可立即登录    |
| PATCH  | `/api/admin/users/:userId` | 只允许修改邮箱、家庭名称、家庭人数和启用状态          |
| DELETE | `/api/admin/users/:userId` | 永久删除普通家庭账号及设置了 cascade 的数据库关联资料 |

POST 必须提供 `email`、`password`、`householdName` 和 `householdSize`。密码沿用 BE-01
规则：至少 8 位，并包含大写字母、小写字母、数字和特殊字符。服务端调用 Admin Auth
时设置 `email_confirm: true`，因此不会发送注册验证码或确认链接。

PATCH 只接受 `email`、`householdName`、`householdSize`、`disabled` 的非空子集；
`role`、`password`、所有者字段、隐私字段以及所有未知字段均返回 400。BE-05 不提供任意
密码重置或管理员角色编辑接口，也不读取家庭水、电、垃圾原始记录。

管理员角色账号不能被禁用或删除，当前管理员也不能删除自己。DELETE 是明确选择的硬删除，
成功返回 200；页面执行前会提示该操作不可恢复。账号不存在返回 404，重复邮箱返回 409，
其他 Auth 或资料查询失败返回安全的 500 错误。所有响应均设置 `Cache-Control: no-store`。
服务端未配置 secret key 时返回 503 `ADMIN_SERVICE_UNAVAILABLE`，不会把环境变量详情或
运行时堆栈暴露给页面。

## Records API

以下成功响应属于下一阶段目标，并非已经完成的功能。
目前 GET、POST、PATCH、DELETE 都返回 HTTP 501：
`{ "error": { "code": "NOT_IMPLEMENTED", "message": "..." } }`，并设置 `Cache-Control: no-store`。
演示页面目前不调用这些接口。

| 方法   | 地址                     | 目标响应                      |
| ------ | ------------------------ | ----------------------------- |
| GET    | `/api/records`           | 200 `{ data: UsageRecord[] }` |
| POST   | `/api/records`           | 201 `{ data: UsageRecord }`   |
| PATCH  | `/api/records/:recordId` | 200 `{ data: UsageRecord }`   |
| DELETE | `/api/records/:recordId` | 204，无响应体                 |

POST 和第一版 PATCH 都接收完整输入：

```json
{
  "resource": "water",
  "start": "2026-09-15",
  "end": "2026-09-21",
  "amount": 1200
}
```

资源只允许 water（L）、electricity（kWh）、waste（kg）。响应增加 UUID 字符串 `id`。
repository 将 `start` / `end` 映射为 `start_date` / `end_date`，返回时再转换回来。
不要把 UI 的 `e1`、`c1` 等演示 ID 传入真实 UUID 字段。

## 身份与权限

所有权来自验证后的登录会话，不能接受浏览器指定的 `user_id`。
数据库使用 `auth.uid()` 作为所有者默认值；普通用户没有写入或修改所有者列的权限。
服务端必须验证请求格式、真实日历日期、有限数值、上限和日期顺序；TypeScript 类型不能验证外部 JSON。
同资源时间重叠由数据库排斥约束最终保证，避免两个请求同时通过前置检查。
新增时只能发送允许的业务字段，不要把整份数据库 row 原样写回。

计划错误响应：400 输入错误、401 未登录、404 不存在或非本人记录、409 时间重叠。
上线前还要测试同源写请求保护、两账号隔离、直接 Data API 越权及失效会话。
普通家庭 API 使用用户会话客户端，不使用绕过 RLS 的 service-role key。
