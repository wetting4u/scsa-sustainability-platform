# SQLite 评审与 Supabase 设计对照

## 结论

原设计不是完全不能用。实体划分、外键、关联唯一约束、索引、演示 seed 和查询示例都有价值。
但它针对“单日活动记录 + SQLite 演示”，当前网页针对“家庭区间用量 + 两个隐私开关”。
新版本保留家庭、资源、目标、挑战、参与关系和徽章概念，重写身份、记录和权限设计。
原文件完整保留，不直接复制到 Supabase 执行。

## 关键差异

| 项目     | 原 SQLite                                 | 当前网页 / 新 Supabase                                |
| -------- | ----------------------------------------- | ----------------------------------------------------- |
| 登录     | users + password_hash + 整数 ID           | Supabase Auth 管密码，业务 FK 用 UUID                 |
| 用量     | activity_logs.recorded_date 单日          | usage_records.start_date/end_date 区间用量            |
| 资源     | category_id，含 eco_action                | resource 字符串，仅 electricity/water/waste           |
| 水单位   | litres                                    | L，与网页统一                                         |
| 隐私     | community_opt_in 一个开关                 | share_analytics、display_leaderboard 独立，默认 false |
| 目标     | baseline、period_type、progress_direction | 当前为使用上限，保留 target 与日期范围                |
| 重叠     | 无数据库限制                              | 同家庭同资源区间排斥约束                              |
| 数值     | amount >= 0，REAL                         | numeric，非负且限制资源上限；目标必须 > 0             |
| 日期     | TEXT，部分使用 date() CHECK               | PostgreSQL date 与日期顺序约束                        |
| 管理员   | 没有角色                                  | 独立 account_roles，用户无法自行修改                  |
| 挑战显示 | 缺 tag/icon，duration_days 重复存储       | 补 tag/icon，duration 由起止日期计算                  |
| 挑战进度 | 可存 progress_value/completed             | 先只记录加入/退出，不伪造认证完成                     |
| 社区统计 | 按 opt-in 聚合且至少 3 户                 | 暂不暴露跨家庭 view/RPC，待隐私规则确定               |
| 演示日期 | 随 date('now') 滚动                       | 开发 seed 固定 2026-09，与网页匹配                    |

## 原 SQL 中需要修正的逻辑

1. `v_goal_progress` 把没有日志的值 COALESCE 为 0，lower 类型会显示 100% 并判定达标。
   少记录不能证明节约；新库不存或自动计算“达标”。网页继续显示已记录用量占上限比例。
2. 单日 recorded_date 无法知道一笔“每月电量”实际覆盖哪几天，不能可靠生成网页周/月区间统计。
   旧记录不能直接凭空补回真实起止日期；若迁移真实历史数据，需要先人工确认时间范围。
3. SQLite CHECK 的结果若为 NULL 会通过，date(无效字符串) 可能是 NULL，不能当作完整日期验证。
4. recommendation_rules 有 evaluation_days，但示例查询固定使用 30 天，没有按每条规则执行。
5. badges 的 category_total 条件缺少对应 category_id，规则含义不够明确。
6. 查询中的 user_id=1 是演示写法；正式接口必须由验证过的会话决定用户。
7. 转换系数标为 illustrative，不能用来发布真实减碳结论。

## 新库 9 张业务表

| 表                    | 职责                             | 普通登录用户权限                         |
| --------------------- | -------------------------------- | ---------------------------------------- |
| resources             | 三种资源及固定单位/上限          | 只读                                     |
| household_profiles    | 家庭名称、人数、系统假名、两开关 | 只读本人；仅允许修改指定资料字段         |
| account_roles         | household / admin                | 只读本人，禁止自行提权                   |
| usage_records         | 区间用量                         | 仅本人 CRUD；不可修改所有者              |
| goals                 | 用量上限与目标期间               | 仅本人 CRUD                              |
| challenges            | 官方挑战及展示字段               | 只读启用项                               |
| challenge_memberships | 家庭参加挑战                     | 本人加入、查询、退出；不能自行写完成结果 |
| badges                | 徽章定义                         | 只读                                     |
| user_badges           | 已获徽章                         | 只读本人，颁发逻辑后续实现               |

Auth 的 auth.users 由 Supabase 管理，不计入上面的 9 张业务表。
管理员当前没有额外读取其他家庭资料的 RLS 分支。所有表均启用 RLS，匿名角色无业务表授权。
UI 修改姓名不会修改系统生成的 pseudonym；不把家庭名称直接用作公开排行榜身份。

## 前端字段如何接

| 前端                           | 数据库                             | 处理方式                                              |
| ------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| record.id                      | usage_records.id                   | UUID 字符串                                           |
| record.resource                | usage_records.resource             | 同名、同值                                            |
| record.start / end             | start_date / end_date              | repository 双向映射                                   |
| record.amount                  | amount                             | PostgREST 数字；使用原生 PG 驱动时需确认 numeric 转换 |
| goal.title / resource / target | 同名                               | 直接对应                                              |
| household                      | household_profiles.display_name    | 名称映射                                              |
| analytics                      | share_analytics                    | 布尔值映射                                            |
| leaderboard                    | display_leaderboard                | 布尔值映射                                            |
| joined: string[]               | challenge_memberships.challenge_id | 查询后组成 UUID 数组                                  |
| challenge.duration             | end_date - start_date + 1          | 格式化为天数文字，不重复存储                          |

假数据 ID e1/g1/c1 不是 UUID，不会直接灌入真实记录。开发挑战 seed 使用稳定 UUID。
月度和目标合计沿用前端 totalFor：只统计完全落在窗口内的记录，不自动按天平摊。
区间首尾日期都计入；9/1–9/7 与 9/7–9/14 重叠，9/8 开始则不重叠。
资源上限来自当前 domain.ts，仍属于演示业务限制，真实上线前应与 client 确认；修改时同步 DB CHECK、resources 和前后端验证。

## 暂缓的功能

eco_action、公共交通、碳换算、自动徽章/挑战认证、可配置建议规则、公开排行榜和社区报告。
原设计的 conversion_factors/recommendation_rules 可供下一阶段参考，不为尚未确认的规则预建复杂字段。
当前一次登录对应一个家庭；未来多个账号共同管理同一家庭时，再引入 households 与 household_members。
