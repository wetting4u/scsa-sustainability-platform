# 组员 C 开发交接

本次基于最新 main 压缩包完成家庭 Goals、Challenges 后端，并适配已有前端和 Dashboard。database (2) 压缩包中的三个 SQLite SQL 文件与 main 的 database/legacy-sqlite 完全一致，仅保留作历史参考。运行使用 Supabase PostgreSQL，无新增数据库迁移。

## 六项任务完成情况

| 任务 | 本次实现 |
| --- | --- |
| BE-07 Goals CRUD | 新增、列表、更新、删除；验证标题、资源、数值、真实日期、UUID；拒绝额外字段和用户伪造所有者。 |
| BE-08 用量计算 | GET goals 返回 usage；复用 Dashboard totalFor 的完整区间规则。无记录、零用量和超额分别处理，任何状态均不证明目标达成。 |
| BE-09 挑战列表 | 明确筛选 is_active=true，返回前端所需字段、日期、持续天数及本人参与状态。 |
| BE-10 加入退出 | 普通会话客户端及 RLS，数据库默认 auth.uid() 填充所有者；重复加入返回 409；只能操作本人，停用挑战仍可退出。 |
| BE-11 状态持久化 | 保留前端已有 memberships 接口，刷新后从数据库获取本人参与状态。 |
| BE-12 回归一致性 | 保持现有 JSON 响应及删除成功 200 格式；修复 Records 新增写受保护 user_id 的问题，并验证 CRUD、区间重叠和账号隔离。 |

## 重要修正

- 目标和参与记录新增不再写 user_id：现有迁移只给普通用户业务列的写入权限。Records 新增做相同修正。
- 列表和用量均分页读取，避免默认行数上限导致超过 1000 条时漏算。
- Goals 页面使用后端 usage，避免每张卡片重复请求记录。无记录显示横线和 No records；失败不会显示为真实零用量。
- Dashboard 原来的目标加载 useEffect 在 return 后不可达，现已改为正常加载 Goals 和 Records API，具备 loading/error 状态。
- 保存目标和修改参与状态期间禁用重复操作。目标保存成功但刷新失败时单独提示，不把已保存结果误报为保存失败。
- Goals、Challenges 使用 src/lib/api.ts 统一处理无配置、未登录、跨来源写入和数据库异常，错误响应不泄露内部详情。
- 旧的 Goals/Challenges server/service.ts 已移除，实际实现集中在 route.ts，避免两份逻辑不一致；管理员挑战 service 保留。

## 运行方法

在这个项目目录打开终端，不要在外层 ZIP 解压目录执行 npm。

```powershell
npm.cmd install
```

在 package.json 同级创建 .env.local，填团队实际 Supabase Project URL 和 publishable key，变量名参考 .env.example。保留自己已有的本地配置，不提交密钥。无需执行初始建表脚本，不要把 SQLite 脚本导入 Supabase。

```powershell
npm.cmd run dev
```

通过最新前端已有的 /sign-in 登录后访问 /goals、/challenges、/overview。普通家庭接口不使用 service-role key。

## 本地验证结果

| 命令 | 结果 |
| --- | --- |
| npm test | 4 项通过，含目标输入边界及用量计算断言 |
| npm run test:db | 7 项通过，已有数据库约束和权限回归 |
| npm run test:api | 10 项通过，实际路由函数加本地 PostgreSQL，两账号验证与 1005 条数据分页 |
| npm run typecheck | 通过 |
| npm run build | 使用非真实 Supabase 占位配置通过；该版共享登录布局在无环境配置时构建会失败 |
| 修改文件的 Prettier 检查 | 通过 |

test:api 的测试解析钩子要求 Node 22.15+ 或 Node 24（本次使用 24.14.1）。它使用一个小型 Supabase 查询适配器连接 PGlite，执行实际的两份 migration、SQL 约束和 RLS；模拟登录身份，不访问网络，不替代 Supabase Auth/JWT/PostgREST 的线上验收。

已验证目标新增、查询、更新、删除，非法输入 400、未登录 401、跨来源写入 403、其他账号目标 404、重复加入 409、缺配置 503；目标和 Records 数据隔离、记录重叠、停用挑战及分页均有断言。

## 真实项目验收仍需完成

本次未使用团队密钥登录线上项目，也未修改线上数据或推送 GitHub。真实浏览器和 Supabase 联调需要使用下面清单：

1. 普通账号 A 登录，新建带明确测试名称的目标，刷新后仍存在；修改及删除均持久化。
2. 新增目标区间内的用量，Goals 与 Dashboard 显示一致；没有记录显示 No records，不显示达标。
3. 加入挑战、刷新、退出、刷新，状态一致；重复提交不会重复创建成员记录。
4. 普通账号 B 无法读取、修改或删除 A 的目标、Records 或参与记录。不能用 SQL Editor 的 postgres 角色代替普通用户验收。
5. 验证会话过期、登出、浏览器刷新和实际部署的来源检查。共享登录会话刷新属于账号集成部分，本次未更换该机制。

自动挑战成功判定和颁发徽章不属于这次任务。具体接口见 member-c-api.md。
