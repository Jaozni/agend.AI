-- Tabela de Perfis (Vinculada ao auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  user_photo text,
  user_type text default 'plantonista',
  settings jsonb default '{}'::jsonb,
  weekly_routine jsonb default '{}'::jsonb,
  shift_routine jsonb default '{}'::jsonb,
  rotating_routine jsonb default '{}'::jsonb,
  profile_photos jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Plantões
create table shifts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  value numeric default 0,
  location text,
  is_rotating boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Eventos Pessoais
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  date timestamp with time zone not null,
  start_time text,
  end_time text,
  color text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Notas
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  text text,
  color text,
  x numeric,
  y numeric,
  width numeric,
  height numeric,
  month text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Segurança (RLS - Row Level Security)
-- Permite que o usuário veja/edite APENAS os seus próprios dados

alter table profiles enable row level security;
alter table shifts enable row level security;
alter table events enable row level security;
alter table notes enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Shifts Policies
create policy "Users can crud own shifts" on shifts for all using (auth.uid() = user_id);

-- Events Policies
create policy "Users can crud own events" on events for all using (auth.uid() = user_id);

-- Notes Policies
create policy "Users can crud own notes" on notes for all using (auth.uid() = user_id);

-- Trigger para criar profile automaticamente ao criar usuário no auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
