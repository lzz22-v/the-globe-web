begin;

-- Permite que cada criador remova as próprias salas com a chave pública do cliente.
create policy "Room creators can delete their own rooms"
    on public.rooms
    for delete
    to authenticated
    using (created_by = (select auth.uid()));

commit;
