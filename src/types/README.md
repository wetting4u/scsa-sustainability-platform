# 数据库类型

在 Supabase 开发项目执行 migration 后，从实际 schema 生成 database.ts。
不要手写一份猜测的数据库类型。UsageRecord 等业务类型仍放在对应 feature 的 domain.ts，
由 repository 映射数据库命名和业务命名。
