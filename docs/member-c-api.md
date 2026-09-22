# 家庭 Goals 和 Challenges 接口

所有接口要求有效 Supabase Cookie 会话，所有响应 Cache-Control: no-store。成功为 `{data: ...}`，错误为 `{error:{code,message}}`。本人身份由服务器验证，客户端不能指定 user_id。跨来源浏览器写入返回 403。

| 方法 | 路径 | 成功响应 |
| --- | --- | --- |
| GET | /api/goals | 200，GoalWithUsage 数组 |
| POST | /api/goals | 201，Goal |
| PATCH | /api/goals/:goalId | 200，Goal |
| DELETE | /api/goals/:goalId | 200，`{data:{id}}` |
| GET | /api/challenges | 200，启用挑战数组，附 joined/joinedAt |
| GET | /api/challenges/memberships | 200，`{data: string[]}`，本人已加入的挑战 UUID（含后来停用的挑战） |
| POST | /api/challenges/:challengeId/membership | 201，`{data:{challengeId,joined:true,joinedAt}}` |
| DELETE | /api/challenges/:challengeId/membership | 200，`{data:{challengeId,joined:false}}`；已退出时亦成功 |

POST 和 PATCH goals 均接收完整的五个字段，不接受未知字段：

```json
{"title":"September water","resource":"water","target":8000,"start":"2026-09-01","end":"2026-09-30"}
```

标题去除首尾空格后 1–120 字符，现有前端输入上限仍为 80。资源 water/electricity/waste，对应 L/kWh/kg。目标为 JSON 数字且大于零，水不超过 10000000，电与垃圾不超过 100000；布尔值、字符串、非有限值被拒绝。日期为真实 YYYY-MM-DD，年份 0001–9999，结束不早于开始。id 必须为 UUID。数据库日期列映射为 start/end。

GET goals 增加 usage：amount、recordCount、hasRecords、percentUsed（无记录时 null）、status。status 为 no_records、over_limit 或 within_recorded_limit。只统计本人同资源且完整落在目标区间内的记录，不按天拆分；有记录不等于覆盖完整时间范围，无自动完成判定。新增、编辑或 Records 变更后重新 GET goals。

Challenge 字段为 id/title/description/resource/target/start/end/tag/icon/duration/joined/joinedAt。duration 是包括首尾日期的天数字符串。加入、退出不需要请求体，不读取客户端传来的所有者。不存在或停用挑战不能加入；重复加入返回 409 CONFLICT，唯一约束处理并发；停用后仍可退出。

缺配置 503 NOT_CONFIGURED；未登录 401 UNAUTHENTICATED；无效输入 400 INVALID_INPUT；不存在或不属于本人目标 404 NOT_FOUND；权限拒绝 403 FORBIDDEN；数据库故障 500 DATABASE_ERROR。客户端不依赖原始数据库错误文本。
