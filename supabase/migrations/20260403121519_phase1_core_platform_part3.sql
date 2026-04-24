alter table public.dms_targets
  add constraint dms_targets_last_job_id_fkey
  foreign key (last_job_id)
  references public.dms_jobs(id)
  on delete set null;

alter table public.dns_domains
  add constraint dns_domains_last_job_id_fkey
  foreign key (last_job_id)
  references public.dns_jobs(id)
  on delete set null;

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_current_timestamp_updated_at();

create trigger prepare_users_before_write
before insert or update on public.users
for each row execute function public.prepare_user_row();

create trigger set_user_departments_updated_at
before update on public.user_departments
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_user_roles_updated_at
before update on public.user_roles
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_user_role_permissions_updated_at
before update on public.user_role_permissions
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_user_memberships_updated_at
before update on public.user_memberships
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_admin_departments_updated_at
before update on public.admin_departments
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_admin_roles_updated_at
before update on public.admin_roles
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_admin_role_permissions_updated_at
before update on public.admin_role_permissions
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_admin_employees_updated_at
before update on public.admin_employees
for each row execute function public.set_current_timestamp_updated_at();

create trigger prepare_admin_employees_before_write
before insert or update on public.admin_employees
for each row execute function public.prepare_admin_employee_row();

create trigger set_packages_updated_at
before update on public.packages
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_taxes_updated_at
before update on public.taxes
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_referrals_updated_at
before update on public.referrals
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_discount_coupons_updated_at
before update on public.discount_coupons
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_purchases_updated_at
before update on public.purchases
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_purchase_items_updated_at
before update on public.purchase_items
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_wvs_targets_updated_at
before update on public.wvs_targets
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_wvs_scan_batches_updated_at
before update on public.wvs_scan_batches
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_wvs_scan_runs_updated_at
before update on public.wvs_scan_runs
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dms_targets_updated_at
before update on public.dms_targets
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dms_jobs_updated_at
before update on public.dms_jobs
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dms_variants_updated_at
before update on public.dms_variants
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dms_evidence_updated_at
before update on public.dms_evidence
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dms_alerts_updated_at
before update on public.dms_alerts
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dns_domains_updated_at
before update on public.dns_domains
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dns_jobs_updated_at
before update on public.dns_jobs
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dns_scans_updated_at
before update on public.dns_scans
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_dns_diff_logs_updated_at
before update on public.dns_diff_logs
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_tickets_updated_at
before update on public.tickets
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_feedback_updated_at
before update on public.feedback
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_visitors_updated_at
before update on public.visitors
for each row execute function public.set_current_timestamp_updated_at();

create trigger set_files_updated_at
before update on public.files
for each row execute function public.set_current_timestamp_updated_at();

comment on table public.files is
  'Storage object metadata contract for Supabase Storage-backed ticket attachments, screenshots, artifacts, and reports.';
