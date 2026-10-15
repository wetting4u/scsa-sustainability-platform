# Week 9 BE01、BE04、BE05、BE06 交接说明

## 本次完成范围

- **BE01**：管理员现有禁用/恢复操作继续使用 Supabase Auth `ban_duration`；新增
  `requireActiveUser()`，使禁用后的账号不能继续使用已有会话访问本项目受保护页面和 API。
  恢复后，下一次受保护请求重新查询状态并允许继续。
- **BE04**：复核所有现有 `/api/admin/*` 服务入口；它们在读取请求体或执行操作前调用
  `requireAdmin()`。管理员角色来自数据库查询，客户端不能声明角色；secret 只保留在
  server-only 模块，响应不包含密码或密码哈希。
- **BE05**：完成共用长度、格式、数字范围和允许值校验工具。Yulong 于 2026-10-15 确认
  英文词库，40 个词/短语已接入共用工具，忽略大小写且按完整词/短语边界匹配。
- **BE06（不含 API/UI 对接）**：统一账号状态错误约定，增加自动化回归测试和下方手动
  回归清单。没有新建要求其他前端调用的 API。
- **BE02 Reset**：根据更新后的 API List，接入 `clear_my_account_data()` RPC；只清除当前用户
  的业务进度，保留 Auth 身份、Profile、角色、社区身份和隐私设置。
- **BE03**：原删除方案改为冻结/解冻。冻结保留全部身份与数据，受保护功能返回
  `ACCOUNT_FROZEN`；登录提示、解冻按钮及页面交由前端同事实现。

## 需要其他同事完成

### API/UI 对接同事

现有客户端遇到以下响应时，应读取 `error.code`，显示合适状态并引导用户重新登录或联系
管理员：

- 401 `UNAUTHENTICATED`
- 403 `ACCOUNT_DISABLED`
- 403 `ACCOUNT_FROZEN`
- 403 `FORBIDDEN`
- 503 `ACCOUNT_STATUS_UNAVAILABLE`
- 503 `ADMIN_SERVICE_UNAVAILABLE`

后端提供 `POST /api/account/reset`、`POST /api/account/freeze`、
`DELETE /api/account/freeze`，请求体为空，使用当前 Cookie Session。
完整成功响应、错误码与数据保留范围见 `docs/api-contracts.md`。
前端同事负责 Reset/Freeze 按钮与确认、冻结后的退出会话、登录时冻结提示及解冻页面。
冻结账号密码认证返回的 `app_metadata.account_frozen` 为 true 时，只显示提示和解冻按钮，
必须由用户点击后进入解冻页，不得自动跳转。后端会拦截冻结会话的受保护功能。

### 数据库同事

应用层已阻止禁用账号继续调用 Next.js API，但禁用前签发的 Supabase JWT 可能在到期前仍可
用于直接 Data API 请求。若验收要求“禁用后立即阻止任何直接数据库 API 调用”，数据库同事
需要提供 RLS/数据库层的账号启用状态规则与 migration。本次没有越权修改数据库组文件。

### 内容规则负责人

初始英文词库已确认并实现，详情见 `english-sensitive-words-draft.md`。后续词库扩充或例外
规则由内容负责人确认。各功能负责人仍须在实际文本字段的后端校验中调用共用工具，当前
词库不会自动覆盖所有业务接口。

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
以下流程需前端完成对接后联合验收：

9. 在 Settings 点击 Reset，取消确认时不发请求；确认后只清除用量、目标、挑战参与及徽章
   进度，Profile、角色、社区身份、隐私设置及登录仍保留。
10. 在 Settings 点击 Freeze 并确认后退出登录；随后使用正确凭据登录，只显示冻结提示和
    `Unfreeze account` 按钮，浏览器不会自行进入解冻页。
11. 手动点击解冻按钮进入前端制作的解冻页面；未确认前账号仍冻结，确认解冻后页面显示
    成功信息和返回登录页链接，不自动跳转。

## 当前配置要求

`SUPABASE_SECRET_KEY` 必须只存在于服务端 `.env.local`/部署环境，不能使用 `NEXT_PUBLIC_`
前缀、提交到 Git 或发给前端。没有该 secret 时，账号最新状态无法安全验证，系统会按
fail-closed 返回 503。
