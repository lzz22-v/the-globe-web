-- Reply references and owner-only soft deletion for room messages.
alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists deleted_at timestamptz;

create or replace function public.delete_own_room_message(p_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
$$;

revoke all on function public.delete_own_room_message(uuid) from public, anon;
grant execute on function public.delete_own_room_message(uuid) to authenticated;
