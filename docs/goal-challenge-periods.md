# Goals 与 Challenges 固定周期

## 本轮规则

- 周期仅 Weekly 与 Monthly。Weekly 为星期一至星期日（包含两端）；Monthly 为完整日历月。
- 当前日期统一按 Australia/Adelaide 确定；日期运算不用本机时区或固定 24 小时的 Adelaide 时间差。
- 新 Goal 可选当周至本月最后一个星期一开始的周，允许该周结束日落在下月。月目标仅允许当月。
- 例：2026-10-09 可选 05/10–11/10、12/10–18/10、19/10–25/10、26/10–01/11；月目标为 01/10–31/10。
- Admin Challenge 可选当期或未来完整周期，没有 Goal 的本月限制；不允许新建已结束周期。
- 月初所在周可能从上月开始，仍是合法的当周；跨年同理。

## 界面及 API

使用共用 PeriodPicker：先选 Weekly／Monthly，再选择预设日期范围；Admin 可先选目标月份。隐藏表单字段仍提交 start、end。

创建 API 使用 validatePeriod；编辑 API 先读取数据库中的已有日期，再用 validatePeriodChange。只有与数据库原值完全一致的日期可保留旧规则；改日期则按新规则校验。前端传入的“原日期”不作为依据。

旧的任意日期或过期条目不会被批量修改，编辑表单默认 Keep existing period。新建时没有该选项。客户端页面跨过午夜后可能显示旧候选，后端仍按请求当时的日期拒绝过期范围；刷新页面可更新选项。

## 数据库

继续使用现有 start_date、end_date，无新增列、无 migration。合法区间可唯一识别 Weekly 或 Monthly，因此本阶段无需 period 列。今后如支持同日期但不同周期语义、重复任务或周期报表索引，再评估新增 period_type。

本轮保护范围是网站与 Next.js API。直接使用 Supabase SDK／PostgREST 写入或 SQL Editor 不会经过该验证；现有 RLS 仍负责所有权。若要让数据库也强制周期规则，需要另外设计 CHECK／trigger 或收敛写入入口，不能仅靠增加 period 列。

## 不包含的改动

未修改 Records 的日期输入或部分重叠的纳入规则；未添加自动结算、完整期间覆盖校验、积分或徽章发放，也未添加挑战开始后锁定编辑规则。这些仍需相应任务处理。

## 验证

tests/periods.test.ts 已纳入 npm test，覆盖本月最后一周跨月、月初跨月、过去周期、未来 Challenge、任意区间、双周、跨年、闰年及 Adelaide 夏令／标准时间的午夜边界。
