-- =============================================================================
-- KanTask · Migración 001: comentarios y menciones
-- -----------------------------------------------------------------------------
-- Para una base que ya tiene supabase/schema.sql aplicado.
-- Uso: Supabase Dashboard → SQL Editor → pegar este archivo → Run.
-- (schema.sql ya incluye estos cambios para instalaciones nuevas)
-- =============================================================================

-- Comentario en una tarea. "menciones" guarda los ids de los usuarios mencionados con @
create table public.comentarios (
  id          uuid primary key default gen_random_uuid(),
  tarea_id    uuid not null references public.tareas (id) on delete cascade,
  usuario_id  uuid not null default auth.uid() references public.usuarios (id) on delete cascade,
  texto       text not null check (char_length(texto) between 1 and 500),
  menciones   uuid[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index on public.comentarios (tarea_id, created_at);

-- Cada mención genera una actividad "mencion" para el usuario mencionado (Pantalla 4)
create or replace function public.registrar_actividad_comentario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text;
  v_autor  text;
begin
  select titulo into v_titulo from public.tareas where id = new.tarea_id;
  select nombre into v_autor from public.usuarios where id = new.usuario_id;

  insert into public.actividad (tipo, texto, tarea_id, usuario_id, destinatario_id)
  select 'mencion', format('%s te mencionó en ''%s''', v_autor, v_titulo), new.tarea_id, new.usuario_id, m
  from unnest(new.menciones) as m
  where m <> new.usuario_id
    and exists (select 1 from public.usuarios where id = m);

  return new;
end;
$$;

create trigger comentarios_registrar_actividad
  after insert on public.comentarios
  for each row execute function public.registrar_actividad_comentario();

-- Comentar no modifica la tarea: cualquier integrante (también el Visualizador) puede hacerlo.
-- Cada uno solo puede borrar sus propios comentarios.
alter table public.comentarios enable row level security;

create policy "comentarios: leer" on public.comentarios
  for select to authenticated using (true);
create policy "comentarios: crear (propios)" on public.comentarios
  for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "comentarios: borrar (propios)" on public.comentarios
  for delete to authenticated using (usuario_id = (select auth.uid()));

alter publication supabase_realtime add table public.comentarios;
