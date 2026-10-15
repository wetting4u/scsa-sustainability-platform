# Goals / Challenges 文本校验

保留 main 已有的 Settings / Manage users 校验与测试，不恢复这些功能的 stash 实现。

新增覆盖：Goals 标题；Manage challenges 名称、描述、Tag。新增和编辑均检查。

- 表单提交时通过 reportSensitiveFields() 在字段旁显示浏览器原生浮动提示，重新输入清除旧状态。
- client.ts 请求前调用共用字段校验；后端 service 在写入前再次独立验证。
- content.ts 调用已有 validateText() 和词库，不修改公共词库或其校验行为。
- 这两个功能的提示为 `{field} contains a sensitive term.`；组员的 Household name 提示保持原样。
- tests/content-validation.test.mjs 检查真实客户端和服务函数，授权与数据库边界使用替身，不操作云端。

人工 QA：每个字段分别测试新增、编辑，输入 FUCK 或词库短语应在字段旁提示；改成正常内容应可提交。刷新检查保存结果。直接调用 API 仍应拒绝违规内容。日期、用量、权限规则保持原有行为。

注意：这是网站 API 的校验，不覆盖有权限直接调用 Supabase 的写入，也不做语义识别。
