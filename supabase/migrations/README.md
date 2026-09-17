# PostgreSQL 迁移文件

20260917000100_initial_schema.sql 是针对全新 Supabase 项目的第一版 schema，包含表、约束、Auth 触发器、授权与 RLS。
按文件名顺序执行；初始化脚本不是可重复执行的重建脚本。

数据库维护者协调共享开发项目的变更。执行后的文件不再改写；新需求新增 migration 并提交 Git。
Git 切换分支不会切换云端数据库。

首次执行及手动 SQL Editor 与 CLI 历史的区别见 ../../docs/database.md。
