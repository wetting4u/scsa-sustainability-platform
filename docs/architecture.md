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
    (public)/page.tsx        / 暂时跳转到 /overview
    (household)/layout.tsx   DemoProvider 与家庭导航
    (household)/.../page.tsx 六个家庭功能页面
    api/records/route.ts     GET、POST 骨架，目前返回 501
    api/records/[recordId]/route.ts  PATCH、DELETE 骨架
  components/               共用导航和 UI
  features/records/
    records.tsx             页面组合与演示状态操作
    components/record-form.tsx   新增、编辑表单
    components/record-table.tsx  历史记录表格
    domain.ts               业务类型、单位和演示验证
    client.ts               未来调用 API 的适配层，当前未接入 UI
    server/service.ts       后端占位逻辑，目前返回 501
  features/demo/provider.tsx 内存中的演示状态
  features/...              其他功能模块
  lib/supabase/             浏览器、服务器客户端及环境变量配置
  mocks/                    前端假数据
  types/                    后续生成数据库类型的位置
docs/                       中文交接文档
tests/                      前端业务与本机数据库测试
```

当前数据流：页面 → DemoProvider → 内存假数据。刷新恢复原始数据。
目标数据流：页面 → client → API Route Handler → service → repository → Supabase。
设置环境变量或执行建表 SQL 都不会自动切换页面的数据来源。

| 项目层                           | .NET 对应概念     | 职责                         |
| -------------------------------- | ----------------- | ---------------------------- |
| `app/api/.../route.ts`           | Controller action | HTTP 参数、认证、响应        |
| `features/.../server/service.ts` | Service           | 业务规则、服务端验证、所有权 |
| 后续 `server/repository.ts`      | Repository        | 查询与数据库字段映射         |
| `lib/supabase/server.ts`         | 请求级客户端工厂  | 携带当前用户会话访问数据库   |
| `domain.ts`                      | DTO / 业务模型    | 前后端约定的业务字段         |

## Admin 是独立区域

以下为规划，还没有实现页面或管理员 API：

```text
src/app/
  (public)/sign-in/page.tsx   登录页 → /sign-in
  (household)/...            家庭页面 → /overview 等
  admin/layout.tsx          独立管理导航与服务端身份检查
  admin/users/page.tsx       用户管理 → /admin/users
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

登录阶段再补会话刷新 Proxy、认证工具和真实 API；现在继续保留免登录展示。
