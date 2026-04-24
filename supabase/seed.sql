begin;

insert into public.admin_departments (name)
values (coalesce(nullif(current_setting('app.seed_default_admin_department', true), ''), 'Operations'))
on conflict (name) do nothing;

with department as (
  select id
  from public.admin_departments
  where name = coalesce(nullif(current_setting('app.seed_default_admin_department', true), ''), 'Operations')
)
insert into public.admin_roles (department_id, name)
select department.id, coalesce(nullif(current_setting('app.seed_default_admin_role', true), ''), 'Super Admin')
from department
on conflict (department_id, name) do nothing;

insert into public.admin_role_permissions (role_id, domain, action, allowed)
select
  r.id,
  permission.domain,
  permission.action,
  true
from public.admin_roles r
join public.admin_departments d
  on d.id = r.department_id
cross join (
  values
    ('users', 'view'),
    ('users', 'create'),
    ('packages', 'view'),
    ('packages', 'create'),
    ('packages', 'update'),
    ('packages', 'status'),
    ('packages', 'delete'),
    ('taxes', 'view'),
    ('taxes', 'create'),
    ('taxes', 'update'),
    ('taxes', 'status'),
    ('taxes', 'delete'),
    ('coupons', 'view'),
    ('coupons', 'create'),
    ('coupons', 'update'),
    ('coupons', 'status'),
    ('coupons', 'delete'),
    ('targets', 'view_all'),
    ('scans', 'view_all'),
    ('tickets', 'view'),
    ('transactions', 'view')
) as permission(domain, action)
where d.name = coalesce(nullif(current_setting('app.seed_default_admin_department', true), ''), 'Operations')
  and r.name = coalesce(nullif(current_setting('app.seed_default_admin_role', true), ''), 'Super Admin')
on conflict (role_id, domain, action) do update
set allowed = excluded.allowed,
    updated_at = timezone('utc', now());

insert into public.taxes (tax_type, cgst, sgst, igst, tax_name, other_tax)
values
  ('GST', 9.00, 9.00, null, 'Goods and Services Tax', null),
  ('IGST', null, null, 18.00, 'Integrated GST', null),
  ('Other Tax', null, null, null, 'Other Tax', 0.00)
on conflict do nothing;

with candidate_admin as (
  select
    nullif(current_setting('app.seed_default_admin_email', true), '') as email,
    nullif(current_setting('app.seed_default_admin_name', true), '') as name,
    nullif(current_setting('app.seed_default_admin_password_hash', true), '') as password_hash
),
department as (
  select id
  from public.admin_departments
  where name = coalesce(nullif(current_setting('app.seed_default_admin_department', true), ''), 'Operations')
),
role as (
  select r.id
  from public.admin_roles r
  join department d
    on d.id = r.department_id
  where r.name = coalesce(nullif(current_setting('app.seed_default_admin_role', true), ''), 'Super Admin')
)
insert into public.admin_employees (
  department_id,
  role_id,
  name,
  email,
  email_normalized,
  password_hash
)
select
  department.id,
  role.id,
  candidate_admin.name,
  candidate_admin.email,
  lower(candidate_admin.email),
  candidate_admin.password_hash
from candidate_admin
cross join department
cross join role
where candidate_admin.email is not null
  and candidate_admin.name is not null
  and candidate_admin.password_hash is not null
on conflict (email_normalized) do update
set
  department_id = excluded.department_id,
  role_id = excluded.role_id,
  name = excluded.name,
  password_hash = excluded.password_hash,
  updated_at = timezone('utc', now());

commit;
