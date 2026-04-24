alter function public.set_current_timestamp_updated_at() set search_path = public;
alter function public.normalize_email(text) set search_path = public;
alter function public.set_runtime_setting(text, text) set search_path = public;
alter function public.prepare_user_row() set search_path = public;
alter function public.prepare_admin_employee_row() set search_path = public;

do $$
declare
  target_table record;
begin
  for target_table in
    select table_schema, table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  loop
    execute format(
      'alter table %I.%I enable row level security',
      target_table.table_schema,
      target_table.table_name
    );
  end loop;
end;
$$;
