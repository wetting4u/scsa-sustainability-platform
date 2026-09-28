# Adelaide 都会区 suburb / postcode / community area 对照表（讨论稿）

整理日期：2026-09-25。仅供 tutor/client 确认和开发规划；尚未批准用于正式用户分区。

## 范围与分组规则

本表以 Adelaide 都会区 suburb 名录为候选范围，包括 Gawler 和 Onkaparinga；不是整个南澳，也不是完整 Greater Adelaide。排除西澳、北领地、维州边界等偏远地区。来源不覆盖 Adelaide Hills 地区的完整 locality 清单；Hills、Mount Barker、Barossa、Murray Bridge、Fleurieu 其他地区应作为范围决定，不能因为本表没有就认定它们不是 Greater Adelaide。

保留先前讨论的四个产品分组，按整个 council 归组，便于解释和维护。此规则由本项目提出，不是官方东南西北行政区，也不是 ABS SA4 的 suburb 对照。ABS 另有 Adelaide - North / South / West / Central and Hills 四个统计区，若 client 选择该方案，需用官方边界重新做空间匹配，不可直接套用本表。

| Community area | 本稿包含的 councils |
|---|---|
| Northern Adelaide | City of Playford; City of Port Adelaide Enfield; City of Salisbury; City of Tea Tree Gully; Town of Gawler |
| Southern Adelaide | City of Holdfast Bay; City of Marion; City of Mitcham; City of Onkaparinga |
| Western Adelaide | City of Charles Sturt; City of West Torrens |
| Central & Eastern Adelaide | City of Adelaide; City of Burnside; City of Campbelltown; City of Norwood Payneham St Peters; City of Prospect; City of Unley; Corporation of the Town of Walkerville |

注意：Port Adelaide Enfield 整体暂列 Northern Adelaide，是本稿的产品规则，即使部分 suburb 位于西北沿海；Holdfast Bay 整体暂列 Southern Adelaide。Prospect、Unley 整体暂列 Central & Eastern Adelaide。请 client 特别审核这三类边界选择。跨 council 的同一 suburb/postcode 已合并；若对应不同分组则留空 area_id，不自动选择。

## 来源与质量

- Suburb、postcode、council 主清单：[Wikipedia: List of Adelaide suburbs](https://en.wikipedia.org/wiki/List_of_Adelaide_suburbs)。整理、去重并增加项目分组，保留来源署名；原页面文本按 CC BY-SA 许可，详见原页许可及历史。
- 邮递区号交叉核对：[Matthew Proctor Australian Postcodes](https://github.com/matthewproctor/australianpostcodes)，仅匹配 SA 的 Delivery Area，未使用它的 SA4/LGA 字段，因为抽查发现其不同地理字段存在矛盾。
- 最终邮递区号核实：[Australia Post postcode finder](https://auspost.com.au/postcode)。本表尚未逐行完成 Australia Post 官方核实；两份社区来源一致不等于官方认证。
- 官方统计分区参考：[ABS Data by Region](https://dbr.abs.gov.au/index.html)。未声称本稿已按官方边界验证。

未纳入 PO Box / 大宗收件专用 postcode。不能只按 postcode 的数字范围或前缀划分 area。同一 postcode 可有多个 suburb；选项应显示 suburb + postcode。来源名录也可能包含住宅较少的工业 suburb，不能把每行视为存在活跃住户。

## 数量汇总

- 原始名录行数：435。
- 合并后 suburb + postcode 组合：405。
- 需要额外核对的组合：8。
- Central & Eastern Adelaide：83。
- Northern Adelaide：139。
- Southern Adelaide：114。
- Western Adelaide：61。
- 待确定分区：8。

## 使用建议

1. 先由 tutor/client 确认本表覆盖范围和 council 分组。
2. DB 组核对下方待审项目，再维护统一 lookup。所有行当前 approved_for_production=false，避免讨论稿直接上线。
3. 用户搜索 suburb 或 postcode，再选明确的 suburb + postcode 组合；页面显示对应 area。
4. 找不到时显示“Area not currently supported / Contact us”，不要自动归到最近区域。
5. 如仅需要大区，可只保存 area_id；不要求家庭地址。选区不自动打开任何 privacy toggle。
6. 本次只生成资料；未修改网站、数据库或 RLS。

## 全部对照表

| Suburb | Postcode | Community area（建议） | Council | 核对状态 |
|---|---|---|---|---|
| Aberfoyle Park | 5159 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Adelaide | 5000 | Central & Eastern Adelaide | City of Adelaide | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Adelaide Airport | 5950 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Albert Park | 5014 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Alberton | 5014 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Aldinga | 5173 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Aldinga Beach | 5173 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Allenby Gardens | 5009 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Andrews Farm | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Angle Park | 5010 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Angle Vale | 5117 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ascot Park | 5043 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ashford | 5035 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Athelstone | 5076 | Central & Eastern Adelaide | City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Athol Park | 5012 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Auldana | 5072 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Banksia Park | 5091 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Beaumont | 5066 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Bedford Park | 5042 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Belair | 5052 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Bellevue Heights | 5050 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Beulah Park | 5067 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Beverley | 5009 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Bibaringa | 5118 | Northern Adelaide | City of Playford; Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Birkenhead | 5015 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Black Forest | 5035 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Blackwood | 5051 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Blair Athol | 5084 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Blakeview | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Blewitt Springs | 5171 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Bolivar | 5110 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Bowden | 5007 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Brahma Lodge | 5109 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Brighton | 5048 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Broadview | 5083 | 待确认：Central & Eastern Adelaide / Northern Adelaide | City of Port Adelaide Enfield; City of Prospect | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Brompton | 5007 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Brooklyn Park | 5032 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Brown Hill Creek | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Buckland Park | 5120 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Burnside | 5066 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Burton | 5110 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Camden Park | 5038 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Campbelltown | 5074 | Central & Eastern Adelaide | City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Cavan | 5094 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Chandlers Hill | 5159 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Cheltenham | 5014 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Cherry Gardens | 5157 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Christie Downs | 5164 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Christies Beach | 5165 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Clapham | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Clarence Gardens | 5039 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Clarence Park | 5034 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Clarendon | 5157 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Clearview | 5085 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Clovelly Park | 5042 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| College Park | 5069 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Collinswood | 5081 | Central & Eastern Adelaide | City of Prospect | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Colonel Light Gardens | 5041 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Coromandel East | 5157 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Coromandel Valley | 5051 | Southern Adelaide | City of Mitcham; City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Cowandilla | 5033 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Crafers West | 5152 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Craigburn Farm | 5051 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Craigmore | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Croydon | 5008 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Croydon Park | 5008 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Cumberland Park | 5041 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Darlington | 5047 | Southern Adelaide | City of Marion; City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Davoren Park | 5113 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Daw Park | 5041 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Dernancourt | 5075 | Northern Adelaide | City of Port Adelaide Enfield; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Devon Park | 5008 | 待确认：Northern Adelaide / Western Adelaide | City of Charles Sturt; City of Port Adelaide Enfield | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Direk | 5110 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Dorset Vale | 5157 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Dover Gardens | 5048 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Dry Creek | 5094 | Northern Adelaide | City of Port Adelaide Enfield; City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Dudley Park | 5008 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Dulwich | 5065 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Eastwood | 5063 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Eden Hills | 5050 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Edinburgh | 5111 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Edinburgh North | 5113 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Edwardstown | 5039 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth | 5112 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth Downs | 5113 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth East | 5112 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth Grove | 5112 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth North | 5113 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth Park | 5113 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth South | 5112 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Elizabeth Vale | 5112 | Northern Adelaide | City of Playford; City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Enfield | 5085 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Erindale | 5066 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ethelton | 5015 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Evandale | 5069 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Evanston | 5116 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Evanston Gardens | 5116 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Evanston Park | 5116 | Northern Adelaide | City of Playford; Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Evanston South | 5116 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Everard Park | 5035 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Exeter | 5019 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Eyre | 5121 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Fairview Park | 5126 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Felixstow | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ferryden Park | 5010 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Findon | 5023 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Firle | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Fitzroy | 5082 | Central & Eastern Adelaide | City of Prospect | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Flagstaff Hill | 5159 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Flinders Park | 5025 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Forestville | 5035 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Frewville | 5063 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Fulham | 5024 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Fulham Gardens | 5024 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Fullarton | 5063 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gawler | 5118 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gawler East | 5118 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gawler South | 5118 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gawler West | 5118 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gepps Cross | 5094 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gilberton | 5081 | Central & Eastern Adelaide | Corporation of the Town of Walkerville | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gilles Plains | 5086 | Northern Adelaide | City of Port Adelaide Enfield; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gillman | 5013 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glandore | 5037 | 待确认：Southern Adelaide / Western Adelaide | City of Marion; City of West Torrens | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Glanville | 5015 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glen Osmond | 5064 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glenalta | 5052 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glenelg | 5045 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glenelg East | 5045 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glenelg North | 5045 | 待确认：Southern Adelaide / Western Adelaide | City of Holdfast Bay; City of West Torrens | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Glenelg South | 5045 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glengowrie | 5044 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glenside | 5065 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glenunga | 5064 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Globe Derby Park | 5110 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Glynde | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Golden Grove | 5125 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Goodwood | 5034 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gould Creek | 5114 | Northern Adelaide | City of Playford; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Grange | 5022 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Green Fields | 5107 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Greenacres | 5086 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Greenwith | 5125 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Gulfview Heights | 5096 | Northern Adelaide | City of Salisbury; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hackham | 5163 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hackham West | 5163 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hackney | 5069 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hallett Cove | 5158 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hampstead Gardens | 5086 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Happy Valley | 5159 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hawthorn | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hawthorndene | 5051 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hazelwood Park | 5066 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Heathpool | 5068 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hectorville | 5073 | Central & Eastern Adelaide | City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hendon | 5014 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Henley Beach | 5022 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Henley Beach South | 5022 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Highbury | 5089 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Highgate | 5063 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hillbank | 5112 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hillcrest | 5086 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hillier | 5116 | Northern Adelaide | City of Playford; Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hilton | 5033 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hindmarsh | 5007 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Holden Hill | 5088 | Northern Adelaide | City of Port Adelaide Enfield; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hope Valley | 5090 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Houghton | 5131 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hove | 5048 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Humbug Scrub | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Huntfield Heights | 5163 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Hyde Park | 5061 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ingle Farm | 5098 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ironbank | 5153 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Joslin | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kangarilla | 5157 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kensington | 5068 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kensington Gardens | 5068 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kensington Park | 5068 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kent Town | 5067 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Keswick | 5035 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Keswick Terminal | 5035 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kidman Park | 5025 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kilburn | 5084 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kilkenny | 5009 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kings Park | 5034 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kingston Park | 5049 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kingswood | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Klemzig | 5087 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kudla | 5115 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Kurralta Park | 5037 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Largs Bay | 5016 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Largs North | 5016 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Leabrook | 5068 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Leawood Gardens | 5150 | 待确认：Central & Eastern Adelaide / Southern Adelaide | City of Burnside; City of Mitcham | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Lightsview | 5085 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Linden Park | 5065 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Lockleys | 5032 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Lonsdale | 5160 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Lower Mitcham | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Lynton | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| MacDonald Park | 5121 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Magill | 5072 | Central & Eastern Adelaide | City of Burnside; City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Malvern | 5061 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Manningham | 5086 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Mansfield Park | 5012 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Marden | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Marino | 5049 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Marion | 5043 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Marleston | 5033 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Marryatville | 5068 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Maslin Beach | 5170 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Mawson Lakes | 5095 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Maylands | 5069 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| McLaren Flat | 5171 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| McLaren Vale | 5171 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Medindie | 5081 | Central & Eastern Adelaide | Corporation of the Town of Walkerville | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Medindie Gardens | 5081 | Central & Eastern Adelaide | City of Prospect | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Melrose Park | 5039 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Mile End | 5031 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Mile End South | 5031 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Millswood | 5034 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Mitcham | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Mitchell Park | 5043 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Moana | 5169 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Modbury | 5092 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Modbury Heights | 5092 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Modbury North | 5092 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Morphett Vale | 5162 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Morphettville | 5043 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Mount Osmond | 5064 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Munno Para | 5115 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Munno Para Downs | 5115 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Munno Para West | 5115 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Myrtle Bank | 5064 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Nailsworth | 5083 | Central & Eastern Adelaide | City of Prospect | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Netherby | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Netley | 5037 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Newton | 5074 | Central & Eastern Adelaide | City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Noarlunga Centre | 5168 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Noarlunga Downs | 5168 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| North Adelaide | 5006 | Central & Eastern Adelaide | City of Adelaide | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| North Brighton | 5048 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| North Haven | 5018 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| North Plympton | 5037 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Northfield | 5085 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Northgate | 5085 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Norwood | 5067 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Novar Gardens | 5040 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| O'Halloran Hill | 5158 | Southern Adelaide | City of Marion; City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| O'Sullivan Beach | 5166 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Oakden | 5086 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Oaklands Park | 5046 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Old Noarlunga | 5168 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Old Reynella | 5161 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| One Tree Hill | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Onkaparinga Hills | 5163 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Osborne | 5017 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ottoway | 5013 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Outer Harbor | 5018 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ovingham | 5082 | 待确认：Central & Eastern Adelaide / Western Adelaide | City of Charles Sturt; City of Prospect | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Panorama | 5041 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Para Hills | 5096 | Northern Adelaide | City of Salisbury; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Para Hills West | 5096 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Para Vista | 5093 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Paradise | 5075 | Central & Eastern Adelaide | City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Parafield | 5106 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Parafield Gardens | 5107 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Paralowie | 5108 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Park Holme | 5043 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Parkside | 5063 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Pasadena | 5042 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Payneham | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Payneham South | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Penfield | 5121 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Penfield Gardens | 5121 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Pennington | 5013 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Peterhead | 5016 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Plympton | 5038 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Plympton Park | 5038 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Pooraka | 5095 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Port Adelaide | 5015 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Port Noarlunga | 5167 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Port Noarlunga South | 5167 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Port Willunga | 5173 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Prospect | 5082 | Central & Eastern Adelaide | City of Prospect | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Queenstown | 5014 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Redwood Park | 5097 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Regency Park | 5010 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Renown Park | 5008 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Reynella | 5161 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Reynella East | 5161 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Richmond | 5033 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ridgehaven | 5097 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Ridleyton | 5008 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Riverlea Park | 5120 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Rose Park | 5067 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Rosewater | 5013 | 待确认：Northern Adelaide / Western Adelaide | City of Charles Sturt; City of Port Adelaide Enfield | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Rosslyn Park | 5072 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Rostrevor | 5073 | Central & Eastern Adelaide | City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Royal Park | 5014 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Royston Park | 5070 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury | 5108 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury Downs | 5108 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury East | 5109 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury Heights | 5109 | Northern Adelaide | City of Salisbury; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury North | 5108 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury Park | 5109 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury Plain | 5109 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Salisbury South | 5106 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Sampson Flat | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seacliff | 5049 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seacliff Park | 5049 | Southern Adelaide | City of Holdfast Bay; City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seacombe Gardens | 5047 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seacombe Heights | 5047 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seaford | 5169 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seaford Heights | 5169 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seaford Meadows | 5169 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seaford Rise | 5169 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seaton | 5023 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Seaview Downs | 5049 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Sefton Park | 5083 | 待确认：Central & Eastern Adelaide / Northern Adelaide | City of Port Adelaide Enfield; City of Prospect | 跨 council 且对应不同分组，需由 client 确定整座 suburb 的归属 |
| Sellicks Beach | 5174 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Sellicks Hill | 5174 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Semaphore | 5019 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Semaphore Park | 5019 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Semaphore South | 5019 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Sheidow Park | 5158 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Skye | 5072 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Smithfield | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Smithfield Plains | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Somerton Park | 5044 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| South Brighton | 5048 | Southern Adelaide | City of Holdfast Bay | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| South Plympton | 5038 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Southwark | 5031 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Springfield | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| St Agnes | 5097 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| St Clair | 5011 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| St Georges | 5064 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| St Kilda | 5110 | Northern Adelaide | City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| St Marys | 5042 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| St Morris | 5068 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| St Peters | 5069 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Stepney | 5069 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Stirling | 5152 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Stonyfell | 5066 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Sturt | 5047 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Surrey Downs | 5126 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Taperoo | 5017 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Tatachilla | 5171 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Tea Tree Gully | 5091 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Tennyson | 5022 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| The Range | 5172 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Thebarton | 5031 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Thorngate | 5082 | Central & Eastern Adelaide | City of Prospect | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Tonsley | 5042 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Toorak Gardens | 5065 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Torrens Park | 5062 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Torrensville | 5031 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Tranmere | 5073 | Central & Eastern Adelaide | City of Campbelltown | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Trinity Gardens | 5068 | Central & Eastern Adelaide | City of Norwood Payneham St Peters | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Trott Park | 5158 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Tusmore | 5065 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Uleybury | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Underdale | 5032 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Unley | 5061 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Unley Park | 5061 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Upper Hermitage | 5131 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Upper Sturt | 5156 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Urrbrae | 5064 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Vale Park | 5081 | Central & Eastern Adelaide | Corporation of the Town of Walkerville | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Valley View | 5093 | Northern Adelaide | City of Port Adelaide Enfield; City of Salisbury; City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Virginia | 5120 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Vista | 5091 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Walkerville | 5081 | Central & Eastern Adelaide | Corporation of the Town of Walkerville | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Walkley Heights | 5098 | Northern Adelaide | City of Port Adelaide Enfield; City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Warradale | 5046 | Southern Adelaide | City of Marion | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Waterfall Gully | 5066 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Waterloo Corner | 5110 | Northern Adelaide | City of Playford; City of Salisbury | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Wattle Park | 5066 | Central & Eastern Adelaide | City of Burnside | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Wayville | 5034 | Central & Eastern Adelaide | City of Unley | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Welland | 5007 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| West Beach | 5024 | Western Adelaide | City of Charles Sturt; City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| West Croydon | 5008 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| West Hindmarsh | 5007 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| West Lakes | 5021 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| West Lakes Shore | 5020 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| West Richmond | 5033 | Western Adelaide | City of West Torrens | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Westbourne Park | 5041 | Southern Adelaide | City of Mitcham | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Whites Valley | 5172 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Willaston | 5118 | Northern Adelaide | Town of Gawler | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Willunga | 5172 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Willunga South | 5172 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Windsor Gardens | 5087 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Wingfield | 5013 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Woodcroft | 5162 | Southern Adelaide | City of Onkaparinga | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Woodville | 5011 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Woodville Gardens | 5012 | Northern Adelaide | City of Port Adelaide Enfield | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Woodville North | 5012 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Woodville Park | 5011 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Woodville South | 5011 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Woodville West | 5011 | Western Adelaide | City of Charles Sturt | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Wynn Vale | 5127 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Yatala Vale | 5126 | Northern Adelaide | City of Tea Tree Gully | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |
| Yattalunga | 5114 | Northern Adelaide | City of Playford | Postcode 已交叉核对／官方补充确认；分组待 client 批准 |

## 官方补充核对与更正

- Riverlea Park：主清单原列 5114，依据 [Australia Post](https://auspost.com.au/postcode/riverlea) 改为 **5120**。
- Col. Light Gardens：展开为 **Colonel Light Gardens 5041**，依据 [Australia Post 名录](https://auspost.com.au/content/dam/auspost_corp/media/documents/on-demand-service-availability-schedule.pdf)。
- Southwark 5031：另一社区数据源缺失，但 [南澳政府公告](https://www.dhud.sa.gov.au/news/southwark-officially-a-suburb-again) 确认重新设立及邮递区号，故保留。
- 表格中无待审说明的行表示 postcode 已交叉核对或经上述官方补充确认；具体核对方式以 JSON postcode_crosscheck 字段为准。
