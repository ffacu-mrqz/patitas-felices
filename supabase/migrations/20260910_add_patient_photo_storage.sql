alter table public.pacientes
add column if not exists foto_url text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'mascotas',
  'mascotas',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuarios autenticados pueden subir imagenes" on storage.objects;
create policy "Usuarios autenticados pueden subir imagenes"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'mascotas');

drop policy if exists "Usuarios autenticados pueden actualizar imagenes" on storage.objects;
create policy "Usuarios autenticados pueden actualizar imagenes"
on storage.objects
for update
to authenticated
using (bucket_id = 'mascotas')
with check (bucket_id = 'mascotas');

drop policy if exists "Usuarios autenticados pueden borrar imagenes" on storage.objects;
create policy "Usuarios autenticados pueden borrar imagenes"
on storage.objects
for delete
to authenticated
using (bucket_id = 'mascotas');

notify pgrst, 'reload schema';
