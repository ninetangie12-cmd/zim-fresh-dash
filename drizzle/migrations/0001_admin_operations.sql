-- Admin/operations layer: staff members, order assignment, audit trail and
-- administrator access policies.

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','super_admin')
  )
$$;

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  phone text,
  role app_role not null,
  vehicle text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.staff_members to authenticated;
grant all on public.staff_members to service_role;
alter table public.staff_members enable row level security;

create policy "staff visible to admins and self" on public.staff_members
  for select to authenticated
  using (public.is_admin(auth.uid()) or user_id = auth.uid());

create policy "admins insert staff" on public.staff_members
  for insert to authenticated with check (public.is_admin(auth.uid()));

create policy "admins update staff" on public.staff_members
  for update to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins delete staff" on public.staff_members
  for delete to authenticated using (public.is_admin(auth.uid()));

alter table public.orders add column shopper_id uuid references public.staff_members(id);
alter table public.orders add column rider_id uuid references public.staff_members(id);
alter table public.orders add column admin_note text;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

create policy "admins read audit" on public.audit_logs
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admins write audit" on public.audit_logs
  for insert to authenticated
  with check (public.is_admin(auth.uid()) and actor_id = auth.uid());

-- Administrator access to customer-facing operational tables.
create policy "admins read orders" on public.orders
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins update orders" on public.orders
  for update to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins read order items" on public.order_items
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins update order items" on public.order_items
  for update to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins read order history" on public.order_status_history
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins write order history" on public.order_status_history
  for insert to authenticated with check (public.is_admin(auth.uid()));

create policy "admins read payments" on public.payments
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins update payments" on public.payments
  for update to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins read payment proofs" on public.payment_proofs
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admins read profiles" on public.profiles
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admins read list requests" on public.shopping_list_requests
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins update list requests" on public.shopping_list_requests
  for update to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins read roles" on public.user_roles
  for select to authenticated using (public.is_admin(auth.uid()));

-- Administrators can view uploaded proof of payment files.
create policy "admins read payment proof files" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin(auth.uid()));
