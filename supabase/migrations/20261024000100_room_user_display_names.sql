-- Returns only public display fields for the host and accepted members of a room.
create or replace function public.get_room_user_profiles(p_room_id uuid)
returns table (user_id uuid, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(u.email, '@', 1), ''),
      'Usuário'
    ) as display_name,
    u.raw_user_meta_data ->> 'avatar_url' as avatar_url
  from auth.users u
  where exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and (
        r.created_by = auth.uid()
        or exists (
          select 1 from public.room_members rm
          where rm.room_id = r.id and rm.user_id = auth.uid()
        )
      )
      and (
        u.id = r.created_by
        or exists (
          select 1 from public.room_members rm
          where rm.room_id = r.id and rm.user_id = u.id
        )
      )
  );
$$;

revoke all on function public.get_room_user_profiles(uuid) from public;
grant execute on function public.get_room_user_profiles(uuid) to authenticated;
