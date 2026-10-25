-- Private folders for each user's character wallet.
create table if not exists public.character_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists character_folders_user_id_idx
  on public.character_folders(user_id);

alter table public.character_folders enable row level security;
drop policy if exists "Users manage their own character folders" on public.character_folders;
create policy "Users manage their own character folders"
on public.character_folders
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

alter table public.characters
  add column if not exists folder_id uuid references public.character_folders(id) on delete set null;

create index if not exists characters_folder_id_idx
  on public.characters(folder_id);

create or replace function public.validate_character_folder_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  folder_owner_id uuid;
begin
  if new.folder_id is null then
    return new;
  end if;

  select folder.user_id into folder_owner_id
  from public.character_folders as folder
  where folder.id = new.folder_id;

  if folder_owner_id is null or folder_owner_id <> new.user_id then
    raise exception 'Character folder must belong to the character owner';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_character_folder_owner on public.characters;
create trigger validate_character_folder_owner
before insert or update of folder_id, user_id on public.characters
for each row execute function public.validate_character_folder_owner();
