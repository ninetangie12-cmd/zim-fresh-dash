-- Roles ---------------------------------------------------------------
create type public.app_role as enum ('customer','shopper','rider','store_manager','admin','super_admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Profiles ------------------------------------------------------------
create table public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  default_substitution text not null default 'contact',
  age_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer')
  on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Addresses -----------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null default 'Home',
  zone_id text not null,
  line text not null,
  landmark text,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "own addresses" on public.addresses for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Favourites and saved lists -----------------------------------------
create table public.favourite_products (
  user_id uuid not null,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
grant select, insert, delete on public.favourite_products to authenticated;
grant all on public.favourite_products to service_role;
alter table public.favourite_products enable row level security;
create policy "own favourites" on public.favourite_products for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.saved_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  product_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_lists to authenticated;
grant all on public.saved_lists to service_role;
alter table public.saved_lists enable row level security;
create policy "own lists" on public.saved_lists for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders --------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null,
  status text not null default 'Order received',
  payment_method text not null,
  payment_status text not null default 'awaiting',
  slot_id text not null,
  address_line text not null,
  address_zone text not null,
  address_landmark text,
  delivery_notes text,
  handover text,
  recipient_name text,
  recipient_phone text,
  hide_prices boolean not null default false,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  service_fee numeric(10,2) not null default 0,
  savings numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  final_total numeric(10,2),
  pin text not null,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders select" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "own orders insert" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "own orders update" on public.orders for update to authenticated using (auth.uid() = user_id);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create index orders_user_idx on public.orders (user_id, placed_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  store_id text not null,
  name text not null,
  pack_size text,
  unit_price numeric(10,2) not null,
  final_unit_price numeric(10,2),
  quantity integer not null default 1,
  substitution text not null default 'contact',
  status text not null default 'pending',
  line_total numeric(10,2) not null
);
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "own order items" on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert on public.order_status_history to authenticated;
grant all on public.order_status_history to service_role;
alter table public.order_status_history enable row level security;
create policy "own order history" on public.order_status_history for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Payments ------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null,
  method text not null,
  amount numeric(10,2) not null,
  status text not null default 'awaiting',
  reference text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id)
);
grant select, insert on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "own payments" on public.payments for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null,
  file_path text,
  reference text,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert on public.payment_proofs to authenticated;
grant all on public.payment_proofs to service_role;
alter table public.payment_proofs enable row level security;
create policy "own proofs" on public.payment_proofs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Shopping list submissions -------------------------------------------
create table public.shopping_list_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  body text,
  image_path text,
  preference text,
  instructions text,
  status text not null default 'Received',
  created_at timestamptz not null default now()
);
grant select, insert on public.shopping_list_requests to authenticated;
grant all on public.shopping_list_requests to service_role;
alter table public.shopping_list_requests enable row level security;
create policy "own list requests" on public.shopping_list_requests for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage policies for payment proofs ---------------------------------
create policy "own proof files read" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own proof files write" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);
