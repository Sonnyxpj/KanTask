-- =============================================================================
-- KanTask · Esquema de base de datos para Supabase
-- -----------------------------------------------------------------------------
-- Basado en el "Modelo de Datos" del informe:
--   Usuario, Tablero, Columna, Tarea, Checklist_Item, Evidencia
-- Además incluye:
--   · Roles Editor / Visualizador con Row Level Security (RLS)
--   · Validación de cierre: checklist completo + al menos una foto de evidencia
--   · Bucket de Storage "evidencias" para las fotos
--   · Tabla "actividad" para la Pantalla 4 (se llena sola con triggers)
--   · Tabla "invitaciones" para sumar integrantes con su rol (Pantalla 5)
--   · Publicación Realtime para sincronizar entre dispositivos
--
-- Uso: Supabase Dashboard → SQL Editor → pegar este archivo → Run.
-- =============================================================================


-- =============================================================================
-- 1. TIPOS
-- =============================================================================

create type public.rol_usuario as enum ('editor', 'visualizador');
create type public.prioridad_tarea as enum ('alta', 'media', 'baja');
create type public.estado_tarea as enum ('pendiente', 'en_progreso', 'terminado');
create type public.tipo_actividad as enum ('asignacion', 'cambio', 'evidencia', 'completada', 'mencion');


-- =============================================================================
-- 2. TABLAS
-- =============================================================================

-- Usuario: perfil público ligado a auth.users (Supabase Auth guarda correo y contraseña)
create table public.usuarios (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null check (char_length(nombre) between 1 and 80),
  correo      text not null unique,
  rol         public.rol_usuario not null default 'editor',
  turno       text,
  en_vivo     boolean not null default false,
  cargo       text,
  telefono    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Tablero
create table public.tableros (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (char_length(nombre) between 1 and 80),
  equipo      text,
  usuario_id  uuid not null default auth.uid() references public.usuarios (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Columna (Pendiente, En progreso, Terminado, ...)
create table public.columnas (
  id          uuid primary key default gen_random_uuid(),
  tablero_id  uuid not null references public.tableros (id) on delete cascade,
  nombre      text not null check (char_length(nombre) between 1 and 40),
  orden       smallint not null default 0,
  unique (tablero_id, orden)
);

-- Tarea
create table public.tareas (
  id            uuid primary key default gen_random_uuid(),
  columna_id    uuid not null references public.columnas (id) on delete cascade,
  asignado_a    uuid references public.usuarios (id) on delete set null,
  titulo        text not null check (char_length(titulo) between 1 and 120),
  descripcion   text not null default '',
  prioridad     public.prioridad_tarea not null default 'media',
  fecha_limite  timestamptz not null,
  estado        public.estado_tarea not null default 'pendiente',
  posicion      integer not null default 0,           -- orden de la tarjeta dentro de su columna
  creado_por    uuid default auth.uid() references public.usuarios (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Checklist_Item
create table public.checklist_items (
  id           uuid primary key default gen_random_uuid(),
  tarea_id     uuid not null references public.tareas (id) on delete cascade,
  descripcion  text not null check (char_length(descripcion) between 1 and 200),
  completado   boolean not null default false,
  orden        smallint not null default 0
);

-- Evidencia (url_foto guarda la ruta del archivo dentro del bucket "evidencias")
create table public.evidencias (
  id          uuid primary key default gen_random_uuid(),
  tarea_id    uuid not null references public.tareas (id) on delete cascade,
  url_foto    text not null,
  fecha       timestamptz not null default now(),
  subido_por  uuid default auth.uid() references public.usuarios (id) on delete set null
);

-- Actividad (Pantalla 4): historial de cambios del tablero
create table public.actividad (
  id               uuid primary key default gen_random_uuid(),
  tipo             public.tipo_actividad not null,
  texto            text not null,
  tarea_id         uuid references public.tareas (id) on delete cascade,
  usuario_id       uuid references public.usuarios (id) on delete set null,  -- quién hizo el cambio
  destinatario_id  uuid references public.usuarios (id) on delete cascade,   -- a quién afecta (asignación / mención)
  created_at       timestamptz not null default now()
);

-- Invitación (Pantalla 5 · botón "agregar persona"): un editor registra correo y rol;
-- al registrarse con ese correo, crear_perfil_usuario() aplica el rol y el cargo.
create table public.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  correo       text not null unique check (correo = lower(correo) and correo like '%_@_%'),
  nombre       text not null check (char_length(nombre) between 1 and 80),
  rol          public.rol_usuario not null default 'editor',
  cargo        text,
  invitado_por uuid default auth.uid() references public.usuarios (id) on delete set null,
  aceptada_en  timestamptz,                                   -- null = pendiente
  created_at   timestamptz not null default now()
);

-- Índices para las consultas más frecuentes
create index on public.tableros (usuario_id);
create index on public.columnas (tablero_id);
create index on public.tareas (columna_id, posicion);
create index on public.tareas (asignado_a);
create index on public.checklist_items (tarea_id, orden);
create index on public.evidencias (tarea_id);
create index on public.actividad (created_at desc);
create index on public.actividad (destinatario_id);


-- =============================================================================
-- 3. FUNCIONES Y TRIGGERS
-- =============================================================================

-- ¿El usuario actual tiene rol editor?
create or replace function public.es_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and rol = 'editor'
  );
$$;

-- Mantener updated_at
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger usuarios_updated_at before update on public.usuarios
  for each row execute function public.tocar_updated_at();
create trigger tareas_updated_at before update on public.tareas
  for each row execute function public.tocar_updated_at();

-- Crear el perfil en public.usuarios cuando alguien se registra en Supabase Auth.
-- El nombre se toma de options.data.nombre en supabase.auth.signUp().
-- Si el correo tenía una invitación pendiente, se usan su rol, nombre y cargo.
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.invitaciones;
begin
  select * into inv from public.invitaciones
  where correo = lower(new.email) and aceptada_en is null;

  insert into public.usuarios (id, nombre, correo, rol, cargo)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), inv.nombre, split_part(new.email, '@', 1)),
    new.email,
    coalesce(inv.rol, 'editor'),
    inv.cargo
  );

  if inv.id is not null then
    update public.invitaciones set aceptada_en = now() where id = inv.id;
  end if;
  return new;
end;
$$;

create trigger al_registrar_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();

-- Un usuario puede editar su perfil, pero no cambiarse el rol a sí mismo
create or replace function public.proteger_rol()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.rol is distinct from old.rol and auth.uid() is not null then
    raise exception 'No puedes cambiar tu propio rol';
  end if;
  return new;
end;
$$;

create trigger usuarios_proteger_rol before update on public.usuarios
  for each row execute function public.proteger_rol();

-- Columnas por defecto al crear un tablero
create or replace function public.crear_columnas_por_defecto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.columnas (tablero_id, nombre, orden) values
    (new.id, 'Pendiente', 0),
    (new.id, 'En progreso', 1),
    (new.id, 'Terminado', 2);
  return new;
end;
$$;

create trigger al_crear_tablero
  after insert on public.tableros
  for each row execute function public.crear_columnas_por_defecto();

-- Validación de cierre: para pasar a "terminado" el checklist debe estar
-- completo y la tarea debe tener al menos una foto de evidencia.
create or replace function public.validar_cierre_tarea()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'terminado' and (tg_op = 'INSERT' or old.estado <> 'terminado') then
    if exists (
      select 1 from public.checklist_items
      where tarea_id = new.id and not completado
    ) then
      raise exception 'La tarea tiene ítems del checklist sin completar';
    end if;

    if not exists (select 1 from public.evidencias where tarea_id = new.id) then
      raise exception 'La tarea necesita al menos una foto de evidencia para cerrarse';
    end if;
  end if;
  return new;
end;
$$;

create trigger tareas_validar_cierre
  before insert or update of estado on public.tareas
  for each row execute function public.validar_cierre_tarea();

-- Registrar actividad de tareas: asignaciones, cambios de estado y cierres
create or replace function public.registrar_actividad_tarea()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.asignado_a is not null
     and (tg_op = 'INSERT' or new.asignado_a is distinct from old.asignado_a) then
    insert into public.actividad (tipo, texto, tarea_id, usuario_id, destinatario_id)
    values ('asignacion', format('Se asignó ''%s''', new.titulo), new.id, auth.uid(), new.asignado_a);
  end if;

  if tg_op = 'UPDATE' and new.estado is distinct from old.estado then
    if new.estado = 'terminado' then
      insert into public.actividad (tipo, texto, tarea_id, usuario_id, destinatario_id)
      values ('completada', format('''%s'' fue completada', new.titulo), new.id, auth.uid(), new.asignado_a);
    else
      insert into public.actividad (tipo, texto, tarea_id, usuario_id, destinatario_id)
      values (
        'cambio',
        format('''%s'' pasó a %s', new.titulo,
          case new.estado when 'pendiente' then 'Pendiente' else 'En progreso' end),
        new.id, auth.uid(), new.asignado_a
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger tareas_registrar_actividad
  after insert or update of asignado_a, estado on public.tareas
  for each row execute function public.registrar_actividad_tarea();

-- Registrar actividad cuando se sube una evidencia
create or replace function public.registrar_actividad_evidencia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tarea public.tareas;
begin
  select * into v_tarea from public.tareas where id = new.tarea_id;
  insert into public.actividad (tipo, texto, tarea_id, usuario_id, destinatario_id)
  values ('evidencia', format('Nueva evidencia en ''%s''', v_tarea.titulo), new.tarea_id, auth.uid(), v_tarea.asignado_a);
  return new;
end;
$$;

create trigger evidencias_registrar_actividad
  after insert on public.evidencias
  for each row execute function public.registrar_actividad_evidencia();


-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
-- Visualizador: solo lectura.  Editor: crea, edita, mueve y borra.
-- =============================================================================

alter table public.usuarios        enable row level security;
alter table public.tableros        enable row level security;
alter table public.columnas        enable row level security;
alter table public.tareas          enable row level security;
alter table public.checklist_items enable row level security;
alter table public.evidencias      enable row level security;
alter table public.actividad       enable row level security;
alter table public.invitaciones    enable row level security;

-- usuarios
create policy "usuarios: leer" on public.usuarios
  for select to authenticated using (true);
create policy "usuarios: editar el propio perfil" on public.usuarios
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- tableros
create policy "tableros: leer" on public.tableros
  for select to authenticated using (true);
create policy "tableros: crear (editor)" on public.tableros
  for insert to authenticated with check ((select public.es_editor()) and usuario_id = (select auth.uid()));
create policy "tableros: editar (editor)" on public.tableros
  for update to authenticated using ((select public.es_editor())) with check ((select public.es_editor()));
create policy "tableros: borrar (dueño)" on public.tableros
  for delete to authenticated using (usuario_id = (select auth.uid()));

-- columnas, tareas, checklist_items, evidencias: misma regla
create policy "columnas: leer" on public.columnas
  for select to authenticated using (true);
create policy "columnas: escribir (editor)" on public.columnas
  for all to authenticated using ((select public.es_editor())) with check ((select public.es_editor()));

create policy "tareas: leer" on public.tareas
  for select to authenticated using (true);
create policy "tareas: escribir (editor)" on public.tareas
  for all to authenticated using ((select public.es_editor())) with check ((select public.es_editor()));

create policy "checklist: leer" on public.checklist_items
  for select to authenticated using (true);
create policy "checklist: escribir (editor)" on public.checklist_items
  for all to authenticated using ((select public.es_editor())) with check ((select public.es_editor()));

create policy "evidencias: leer" on public.evidencias
  for select to authenticated using (true);
create policy "evidencias: escribir (editor)" on public.evidencias
  for all to authenticated using ((select public.es_editor())) with check ((select public.es_editor()));

-- invitaciones: todos ven las pendientes; solo editores invitan o cancelan
create policy "invitaciones: leer" on public.invitaciones
  for select to authenticated using (true);
create policy "invitaciones: crear (editor)" on public.invitaciones
  for insert to authenticated
  with check ((select public.es_editor()) and invitado_por = (select auth.uid()));
create policy "invitaciones: cancelar (editor)" on public.invitaciones
  for delete to authenticated using ((select public.es_editor()) and aceptada_en is null);

-- actividad: solo lectura (la escriben los triggers)
create policy "actividad: leer" on public.actividad
  for select to authenticated using (true);


-- =============================================================================
-- 5. STORAGE · fotos de evidencia
-- -----------------------------------------------------------------------------
-- Bucket privado. Ruta sugerida: <tarea_id>/<timestamp>.jpg
-- La app muestra las fotos con supabase.storage.from('evidencias').createSignedUrl()
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "evidencias storage: leer" on storage.objects
  for select to authenticated using (bucket_id = 'evidencias');
create policy "evidencias storage: subir (editor)" on storage.objects
  for insert to authenticated with check (bucket_id = 'evidencias' and (select public.es_editor()));
create policy "evidencias storage: borrar (editor)" on storage.objects
  for delete to authenticated using (bucket_id = 'evidencias' and (select public.es_editor()));


-- =============================================================================
-- 6. REALTIME · sincronización entre dispositivos
-- =============================================================================

-- "full" para recibir la fila anterior completa en UPDATE / DELETE
alter table public.tareas          replica identity full;
alter table public.checklist_items replica identity full;

alter publication supabase_realtime add table
  public.usuarios,
  public.columnas,
  public.tareas,
  public.checklist_items,
  public.evidencias,
  public.actividad,
  public.invitaciones;
