# Records 后端

service.ts 目前只返回 501，不读取或写入数据库。

下一阶段：

1. Route Handler 验证登录身份、解析请求并返回 HTTP 响应。
2. service 做运行时输入验证和业务规则检查。
3. 在此新增 repository.ts，连接 usage_records 并映射 start/end 与 start_date/end_date。
4. 使用用户会话和 RLS，不接受客户端指定所有者，不把服务端模块导入 Client Component。
5. 处理数据库排斥约束返回的冲突；单纯先查重再写入不能防止并发重复。

新 schema 和接口约定见 docs/schema-review.md 与 docs/api-contracts.md。
