# 英文敏感词词库（Yulong 已确认）

日期：2026-10-15。状态：Yulong 已确认，三组共 40 个词/短语已接入共用后端校验工具。
文件名保留供历史链接使用。

本文为 BE05 提供一份小型初始清单。以下出现的侮辱性词语仅用于内容过滤审核，不代表项目
认可这些表达。本清单不是完整词库，也不能仅凭词语命中判断使用者有歧视意图。

## 第一组：明确的歧视性侮辱词候选

每行中的词形均已作为独立条目采用。共用文本校验命中后返回 `SENSITIVE_WORD` 并拒绝输入。

| 类别 | 英文候选词 | 审核说明 |
| --- | --- | --- |
| 针对黑人的种族侮辱 | `nigger`, `niggers`, `nigga`, `niggas` | 包括常见变体；引用、讨论或群体内部使用也可能命中 |
| 针对东亚人的种族侮辱 | `chink`, `chinks` | 也可能出现在 “a chink in the armour” 等非歧视表达中 |
| 针对东亚人的种族侮辱 | `gook`, `gooks` | 作为歧视性称呼的候选 |
| 针对南亚人的种族侮辱 | `paki`, `pakis` | 是地域相关的侮辱性称呼，不能扩展为禁止国籍名称 |
| 针对犹太人的族群侮辱 | `kike`, `kikes` | 作为歧视性称呼的候选 |
| 针对拉丁裔的族群侮辱 | `spic`, `spics` | 完整词匹配；避免误伤 `spice`、`spicy` 等正常词 |
| 针对同性恋者的侮辱 | `faggot`, `faggots` | 部分地域存在非侮辱用法，需结合应用场景审核 |
| 针对跨性别者的侮辱 | `tranny`, `trannies` | 部分语境存在其他含义，不能将身份词一并禁止 |

## 第二组：性别歧视等攻击性短语候选

短语比单独禁止 `women`、`men` 等正常词更适合初始清单。这里只覆盖少量示例，不能识别
所有改写、引用或反驳这些说法的语句。

| 类别 | 英文候选短语 |
| --- | --- |
| 性别歧视 | `women are inferior` |
| 性别歧视 | `women belong in the kitchen` |
| 性别歧视 | `women should not vote` |
| 性别歧视 | `men are inferior` |
| 种族歧视 | `white supremacy` |
| 种族歧视 | `inferior race` |
| 排外攻击 | `go back to your country` |
| 宗教群体攻击 | `all muslims are terrorists` |
| 性取向攻击 | `gay people are disgusting` |
| 跨性别群体攻击 | `trans people are disgusting` |

短语命中也可能来自反歧视讨论，例如 “We reject white supremacy”。如果应用允许自由文本
讨论，建议将这类命中用于提示或人工复核，而不是一律拒绝。

## 第三组：普通辱骂（可选，不等同于歧视）

| 候选词 | 审核说明 |
| --- | --- |
| `fuck`, `fucking`, `motherfucker` | 粗俗辱骂；是否限制取决于项目内容规则 |
| `shit`, `bullshit` | 粗俗表达，不能据此认定歧视 |
| `asshole` | 人身辱骂 |
| `bitch`, `bitches` | 可用于性别相关侮辱，也有动物称谓等其他语境 |
| `slut`, `sluts`, `whore`, `whores` | 可用于性羞辱；仍需考虑引用和说明性语境 |

## 不建议作为单词直接禁止的正常词

`black`、`white`、`asian`、`jewish`、`muslim`、`christian`、`women`、`men`、
`female`、`male`、`gay`、`lesbian`、`transgender`、`queer`、`race`、`sex`。

这些词可以正常描述身份、群体或主题。含有这些词并不等于歧视。

## 已采用的后端规则

1. 采用三组中的全部 40 个条目，命中后共用文本校验拒绝输入。
2. 匹配忽略大小写，例如 `bitch`、`BITCH`、`BiTch` 均命中同一条目。
3. 按完整词/短语边界匹配，避免误伤 `spice`、`spicy` 等普通单词。短语内连续空白、换行
   统一为单个空格后匹配；不会自动识别被插入符号拆开的词。
4. 仅覆盖列出的词形，不覆盖全部复数、拼写变形或谐音；扩展规则需另行确认。
5. 限定到确实需要审核的用户文本字段；不要应用于密码、邮箱或系统生成字段。

词库位于 `src/lib/validation/sensitive-words.ts`。调用共用 `validateText()` 时默认检查本词库；
家庭名称已在 Profile 修改、管理员创建用户及管理员修改用户的后端校验中接入。
其他业务字段由对应功能负责人在后端 DTO/service 中调用，未覆盖直接调用 Supabase 的写入。
本次未修改前端或数据库。
