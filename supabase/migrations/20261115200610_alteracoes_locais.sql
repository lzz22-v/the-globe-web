SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_own_room_message (
  p_message_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  target public.messages%rowtype;
  updated_message public.messages%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select m.* into target
  from public.messages m
  where m.id = p_message_id;

  if not found then
    raise exception 'Message not found';
  end if;
  if target.user_id <> auth.uid() then
    raise exception 'You can only delete your own messages';
  end if;

  if target.deleted_at is not null then
    return jsonb_build_object(
      'id', target.id,
      'content', target.content,
      'deleted_at', target.deleted_at
    );
  end if;

  update public.messages m
  set content = '', deleted_at = now()
  where m.id = target.id and m.user_id = auth.uid() and m.deleted_at is null
  returning m.* into updated_message;

  return jsonb_build_object(
    'id', updated_message.id,
    'content', updated_message.content,
    'deleted_at', updated_message.deleted_at
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_room_user_profiles (
  p_room_id uuid
)
  RETURNS TABLE (
    user_id      uuid,
    display_name text,
    avatar_url   text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.validate_character_folder_owner()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
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
$function$;
