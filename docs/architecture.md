# 项目架构与团队分工

## 当前目录

```text
database/legacy-sqlite/       组员原始 SQLite 文件，只作参考
supabase/migrations/         新版 PostgreSQL 建表、约束和 RLS
supabase/seed.sql            可选开发挑战与徽章，不含用户数据
src/
  app/
    layout.tsx              全局 HTML、元数据和 CSS
    globals.css             共用样式与 RWD 断点
    (public)/page.tsx        / 跳转到 /overview
    (public)/sign-in/        Supabase 登录页面
    (public)/sign-up/        注册、邮箱验证码与重发流程
    (household)/layout.tsx   登录检查与家庭导航
    (household)/.../page.tsx 家庭及管理员功能页面
    api/                     Records、Goals、Challenges 与管理员 API
  components/               共用导航和 UI
  features/records/
    records.tsx             页面组合与演示状态操作
    components/record-form.tsx   新增、编辑表单
    components/record-table.tsx  历史记录表格
    domain.ts               业务类型、单位和演示验证
    client.ts               未来调用 API 的适配层，当前未接入 UI
    server/service.ts       后端占位逻辑，目前返回 501
  features/auth/domain.ts   密码规则和认证错误映射
  features/account/         注册后资料初始化验证
  features/admin/           共用管理员授权规则与服务端 requireAdmin
  features/admin-users/     BE-05 用户管理 DTO、客户端和服务端逻辑
  features/privacy/         Profile API、客户端适配与 Settings 页面
  features/...              其他功能模块
  lib/supabase/             浏览器、服务器客户端及环境变量配置
  mocks/                    前端假数据
  types/                    后续生成数据库类型的位置
docs/                       中文交接文档
tests/                      前端业务与本机数据库测试
```

认证数据流：登录或注册页面 → Supabase Auth → Cookie Session → Next.js Proxy。
业务数据流：页面 → client → API Route Handler → service → Supabase。

BE-02 数据流：邮箱验证码验证成功 → `GET /api/account/initialization` → 使用当前会话读取本人的 `household_profiles` 和 `account_roles` → 确认普通角色及两个隐私开关默认关闭 → 进入 Overview。验证失败时不在应用代码中越权补建数据，由数据库维护者检查 Auth trigger 和 migration。

BE-03 数据流：Settings 页面 → `GET/PATCH /api/profile` → 服务端从 Cookie Session 获取用户 → 验证字段白名单及类型 → 使用用户会话客户端和 RLS 读取或修改本人的 `household_profiles`。浏览器不再直接查询资料表，接口不接受客户端提供的所有者、角色或系统假名。

BE-04 管理员授权流：管理员页面或 API → 共用 `requireAdmin()` → Supabase 验证 Cookie Session → 查询当前用户的 `account_roles` → 只有 `admin` 继续执行。Admin Users 和 Admin Challenges 不再维护各自的重复授权实现；每个管理 API 仍须在服务函数入口调用该工具。

BE-05 用户管理流：`/admin/users` → `/api/admin/users` → `requireAdmin()` → 仅服务端
Supabase Admin client → Auth 用户及家庭资料。管理员创建的普通家庭账号设置为邮箱已确认，
可以直接登录；更新严格限定为邮箱、家庭名称、家庭人数和启用状态；删除采用不可恢复的
Auth 硬删除，并由现有外键 cascade 清理关联资料。该管理服务不提供密码、角色或原始用量
数据的访问接口。

| 项目层                           | .NET 对应概念     | 职责                         |
| -------------------------------- | ----------------- | ---------------------------- |
| `app/api/.../route.ts`           | Controller action | HTTP 参数、认证、响应        |
| `features/.../server/service.ts` | Service           | 业务规则、服务端验证、所有权 |
| 后续 `server/repository.ts`      | Repository        | 查询与数据库字段映射         |
| `lib/supabase/server.ts`         | 请求级客户端工厂  | 携带当前用户会话访问数据库   |
| `domain.ts`                      | DTO / 业务模型    | 前后端约定的业务字段         |

## Admin 是独立区域

当前页面和管理员 API 结构：

```text
src/app/
  (public)/sign-in/page.tsx   登录页 → /sign-in
  (household)/...            家庭页面 → /overview 等
  (household)/admin/layout.tsx  管理区域服务端身份检查
  (household)/admin/users/page.tsx  用户管理 → /admin/users
  api/admin/users/route.ts   管理员 API
```

Admin 不放进 household，也不放进 public。括号目录只是路由分组，不是权限机制。
管理页面和每一个管理 API 都必须检查管理员权限。
新 schema 的 `account_roles` 支持 household/admin，但角色存在不代表后台功能已完成。
管理员不会因此获得所有家庭水电垃圾原始记录的读取权限。
首次管理员由可信数据库维护者设置；用户不能在个人资料页把自己改为管理员。

## CSS 与 RWD

沿用当前 CSS、Grid/Flexbox 和 media queries。新元件的独立样式使用同目录下
`*.module.css`。现有 className 和断点不改写，暂不迁移到 Tailwind。

## 六人分工

- 前端 1：仪表板、共用布局、RWD。
- 前端 2：Records 表单、表格，后续加载与错误状态。
- 后端 1：Records API、服务端验证与数据映射。
- 后端 2：登录、隐私、后续管理员授权。
- DB：migration、约束、RLS、开发数据与数据库类型。
- QA：演示回归、两用户隔离、越权、RWD 与可访问性。

`src/proxy.ts` 负责验证和刷新 Supabase Cookie Session；页面布局与每个管理员 API
仍须独立验证用户和角色，不能只依赖 Proxy 或前端隐藏按钮。
