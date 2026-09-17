# Records API 接口约定

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
