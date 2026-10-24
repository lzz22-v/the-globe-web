-- Host controlled room video library and private Realtime broadcast.
-- Apply this migration in the Supabase project before using room media.

drop policy if exists "Room media members can list files" on storage.objects;
create policy "Room media members can list files"
on storage.objects for select to authenticated
using (
  bucket_id = 'rooms'
  and (storage.foldername(name))[1] = 'media'
  and exists (
    select 1 from public.rooms r
    where r.id::text = (storage.foldername(name))[2]
      and (
        r.created_by = auth.uid()
        or exists (
          select 1 from public.room_members rm
          where rm.room_id = r.id and rm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "Room hosts can upload media" on storage.objects;
create policy "Room hosts can upload media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rooms'
  and (storage.foldername(name))[1] = 'media'
  and exists (
    select 1 from public.rooms r
    where r.id::text = (storage.foldername(name))[2]
      and r.created_by = auth.uid()
  )
);

drop policy if exists "Room hosts can delete media" on storage.objects;
create policy "Room hosts can delete media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'rooms'
  and (storage.foldername(name))[1] = 'media'
  and exists (
    select 1 from public.rooms r
    where r.id::text = (storage.foldername(name))[2]
      and r.created_by = auth.uid()
  )
);

drop policy if exists "Room members can receive media state" on realtime.messages;
create policy "Room members can receive media state"
on realtime.messages for select to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) ~ '^room_[0-9a-fA-F-]+_media$'
  and exists (
    select 1 from public.rooms r
    where r.id::text = split_part((select realtime.topic()), '_', 2)
      and (
        r.created_by = auth.uid()
        or exists (
          select 1 from public.room_members rm
          where rm.room_id = r.id and rm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "Only room hosts can broadcast media state" on realtime.messages;
create policy "Only room hosts can broadcast media state"
on realtime.messages for insert to authenticated
with check (
  extension = 'broadcast'
  and (select realtime.topic()) ~ '^room_[0-9a-fA-F-]+_media$'
  and exists (
    select 1 from public.rooms r
    where r.id::text = split_part((select realtime.topic()), '_', 2)
      and r.created_by = auth.uid()
  )
);
