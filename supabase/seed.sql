-- 可选开发数据：与网页演示一致的 2026 年 9 月挑战。
-- 不创建 Auth 账号、密码、用量或家庭资料，也不打开隐私开关。
begin;
insert into public.challenges (id, title, description, resource, target, start_date, end_date, tag, icon)
values
('00000000-0000-4000-8000-000000000001', 'The lighter bin challenge',
 'Notice what goes into your bin. Keep your household waste below 15 kg over a fortnight.',
 'waste', 15, '2026-09-01', '2026-09-14', 'WASTE LESS', 'sprout'),
('00000000-0000-4000-8000-000000000002', 'Switch off, save a little',
 'Build a habit of switching off unused appliances. Aim for no more than 65 kWh in a week.',
 'electricity', 65, '2026-09-15', '2026-09-21', 'ENERGY SAVER', 'bolt'),
('00000000-0000-4000-8000-000000000003', 'Small drops, big difference',
 'Try shorter showers and mindful watering. Keep your weekly household water use below 2,000 L.',
 'water', 2000, '2026-09-15', '2026-09-21', 'WATER WISE', 'drop')
on conflict (id) do nothing;
insert into public.badges(id, code, name, description, icon)
values ('00000000-0000-4000-8000-000000000101', 'FIRST_LOG', 'First Step',
 'Record the first household usage entry.', 'footprints')
on conflict (code) do nothing;
commit;
