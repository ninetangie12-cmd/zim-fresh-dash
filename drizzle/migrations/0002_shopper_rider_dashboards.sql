-- Shopper and rider workflow: account linking, assigned-order access,
-- picking detail, collection and delivery proof.

alter table public.staff_members add column link_code text;
create unique index staff_members_link_code_key on public.staff_members(link_code) where link_code is not null;

alter table public.orders add column collected_at timestamptz;
alter table public.orders add column delivered_at timestamptz;
alter table public.orders add column delivery_proof_path text;
alter table public.orders add column delivery_failed_reason text;
alter table public.orders add column id_checked boolean;
alter table public.orders add column pin_verified boolean not null default false;
alter table public.orders add column shopper_receipt_path text;

alter table public.order_items add column picked_quantity integer;
alter table public.order_items add column final_weight_kg numeric;
alter table public.order_items add column shopper_note text;

create or replace function public.my_staff_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.staff_members where user_id = auth.uid()
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff_members where user_id = _user_id and active)
$$;

create or replace function public.is_assigned_to_order(_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    where o.id = _order_id
      and (o.shopper_id in (select public.my_staff_ids())
        or o.rider_id in (select public.my_staff_ids()))
  )
$$;

create or replace function public.claim_staff_code(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare _id uuid;
begin
  update public.staff_members
     set user_id = auth.uid(), link_code = null
   where link_code = _code and user_id is null
   returning id into _id;
  return _id;
end;
$$;

grant execute on function public.my_staff_ids() to authenticated;
grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.is_assigned_to_order(uuid) to authenticated;
grant execute on function public.claim_staff_code(text) to authenticated;

create policy "staff read assigned orders" on public.orders
  for select to authenticated
  using (shopper_id in (select public.my_staff_ids()) or rider_id in (select public.my_staff_ids()));

create policy "staff update assigned orders" on public.orders
  for update to authenticated
  using (shopper_id in (select public.my_staff_ids()) or rider_id in (select public.my_staff_ids()))
  with check (shopper_id in (select public.my_staff_ids()) or rider_id in (select public.my_staff_ids()));

create policy "staff read assigned order items" on public.order_items
  for select to authenticated
  using (public.is_assigned_to_order(order_id));

create policy "staff update assigned order items" on public.order_items
  for update to authenticated
  using (public.is_assigned_to_order(order_id))
  with check (public.is_assigned_to_order(order_id));

create policy "staff read assigned history" on public.order_status_history
  for select to authenticated
  using (public.is_assigned_to_order(order_id));

create policy "staff write assigned history" on public.order_status_history
  for insert to authenticated
  with check (public.is_assigned_to_order(order_id));

create policy "staff update own record" on public.staff_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "staff upload delivery proof" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'delivery-proofs' and public.is_staff(auth.uid()));

create policy "staff read delivery proof" on storage.objects
  for select to authenticated
  using (bucket_id = 'delivery-proofs' and (public.is_staff(auth.uid()) or public.is_admin(auth.uid())));