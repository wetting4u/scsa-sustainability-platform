# Week 9 BE01、BE04、BE05、BE06 交接说明

## 本次完成范围

- **BE01**：管理员现有禁用/恢复操作继续使用 Supabase Auth `ban_duration`；新增
  `requireActiveUser()`，使禁用后的账号不能继续使用已有会话访问本项目受保护页面和 API。
  恢复后，下一次受保护请求重新查询状态并允许继续。
- **BE04**：复核所有现有 `/api/admin/*` 服务入口；它们在读取请求体或执行操作前调用
  `requireAdmin()`。管理员角色来自数据库查询，客户端不能声明角色；secret 只保留在
  server-only 模块，响应不包含密码或密码哈希。
- **BE05**：完成共用长度、格式、数字范围和允许值校验工具。敏感词接口已建立，但生产
  词库按决定保持为空，等待其他同事提供经确认的列表。
- **BE06（不含 API/UI 对接）**：统一账号状态错误约定，增加自动化回归测试和下方手动
  回归清单。没有新建要求其他前端调用的 API。
- **BE03**：按决定暂时跳过，本次没有实施。

## 需要其他同事完成

### API/UI 对接同事

现有客户端遇到以下响应时，应读取 `error.code`，显示合适状态并引导用户重新登录或联系
管理员：

- 401 `UNAUTHENTICATED`
- 403 `ACCOUNT_DISABLED`
- 403 `FORBIDDEN`
- 503 `ACCOUNT_STATUS_UNAVAILABLE`
- 503 `ADMIN_SERVICE_UNAVAILABLE`

本次没有要求前端调用新的账号状态 API；这些错误来自现有受保护 API。

### 数据库同事

应用层已阻止禁用账号继续调用 Next.js API，但禁用前签发的 Supabase JWT 可能在到期前仍可
用于直接 Data API 请求。若验收要求“禁用后立即阻止任何直接数据库 API 调用”，数据库同事
需要提供 RLS/数据库层的账号启用状态规则与 migration。本次没有越权修改数据库组文件。

### 内容规则负责人

请提供最终敏感词词库及匹配要求（例如大小写、完整词或子串、语言和例外词）。收到确认后，
将词库填入 `src/lib/validation/sensitive-words.ts`，或通过校验工具的注入参数接入。

## 手动回归清单

1. 普通用户能够注册、验证邮箱并登录。
2. 登录用户能够读取和修改 Profile；非法长度与数字范围仍被拒绝。
3. 管理员能够列出用户，并将一个普通账号设为 disabled。
4. 被禁用账号用原有浏览器会话刷新 `/overview`，不能继续进入；调用 Records、Goals、
   Challenges 或 Profile API 时返回 403 `ACCOUNT_DISABLED`。
5. 被禁用账号重新登录时显示稳定的禁用提示，不暴露 Supabase 原始错误。
6. 管理员恢复同一账号后，该账号重新登录或刷新有效会话即可继续使用受保护功能。
7. 普通用户调用任一 `/api/admin/*` 返回 403；禁用的管理员也不能继续调用管理 API。
8. 暂时移除本地 `SUPABASE_SECRET_KEY` 后，受保护 API 返回安全的 503，不出现运行时堆栈；
   验证结束后恢复该环境变量。

## 当前配置要求

`SUPABASE_SECRET_KEY` 必须只存在于服务端 `.env.local`/部署环境，不能使用 `NEXT_PUBLIC_`
前缀、提交到 Git 或发给前端。没有该 secret 时，账号最新状态无法安全验证，系统会按
fail-closed 返回 503。
