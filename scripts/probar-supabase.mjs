// Prueba de punta a punta contra el proyecto real de Supabase (no usa datos de ejemplo).
// Recorre lo mismo que hace la app con dos cuentas reales: un Editor y un Visualizador.
//
// Uso:  npm run probar:supabase
// Requiere en .env (no se suben a git):
//   EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY (o _PUBLISHABLE_KEY)
//   PRUEBA_EDITOR_CORREO, PRUEBA_EDITOR_CLAVE
//   PRUEBA_VISOR_CORREO,  PRUEBA_VISOR_CLAVE   (cuenta con rol visualizador)
//
// Todo lo que crea lleva el prefijo [PRUEBA] y se elimina al final (también si algo falla).
import { Buffer } from 'node:buffer';

import { createClient } from '@supabase/supabase-js';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY;
const BUCKET = 'evidencias';
const ESPERA_MS = 10_000;

let fallas = 0;
const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const mal = (msg, detalle) => {
  fallas++;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m${detalle ? `\n      → ${detalle}` : ''}`);
};
const titulo = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);
const revisar = (cond, msg, detalle) => (cond ? ok(msg) : mal(msg, detalle));
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

function nuevoCliente() {
  return createClient(URL, CLAVE, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function entrar(correo, clave, nombre) {
  const sb = nuevoCliente();
  const { data, error } = await sb.auth.signInWithPassword({ email: correo, password: clave });
  if (error) throw new Error(`No se pudo iniciar sesión como ${nombre} (${correo}): ${error.message}`);
  const perfil = await sb.from('usuarios').select('id, nombre, rol').eq('id', data.user.id).single();
  return { sb, id: data.user.id, perfil: perfil.data, errorPerfil: perfil.error };
}

// Espera un evento de Realtime que cumpla la condición
function esperarEvento(eventos, cond) {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const t = setInterval(() => {
      const ev = eventos.find(cond);
      if (ev || Date.now() - inicio > ESPERA_MS) {
        clearInterval(t);
        resolve(ev ?? null);
      }
    }, 150);
  });
}

async function main() {
  if (!URL || !CLAVE) throw new Error('Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY en .env');
  const faltan = ['PRUEBA_EDITOR_CORREO', 'PRUEBA_EDITOR_CLAVE', 'PRUEBA_VISOR_CORREO', 'PRUEBA_VISOR_CLAVE'].filter(
    (v) => !process.env[v],
  );
  if (faltan.length) throw new Error(`Faltan en .env: ${faltan.join(', ')}`);

  // ---------------------------------------------------------------------------
  titulo('1. Usuarios y roles');
  const E = await entrar(process.env.PRUEBA_EDITOR_CORREO, process.env.PRUEBA_EDITOR_CLAVE, 'Editor');
  const V = await entrar(process.env.PRUEBA_VISOR_CORREO, process.env.PRUEBA_VISOR_CLAVE, 'Visualizador');
  revisar(!!E.perfil, 'el Editor tiene fila en usuarios (trigger al registrarse)', E.errorPerfil?.message);
  revisar(!!V.perfil, 'el Visualizador tiene fila en usuarios', V.errorPerfil?.message);
  if (!E.perfil || !V.perfil) return;
  revisar(E.perfil.rol === 'editor', `rol de ${E.perfil.nombre} = editor`, `tiene rol "${E.perfil.rol}"`);
  revisar(V.perfil.rol === 'visualizador', `rol de ${V.perfil.nombre} = visualizador`, `tiene rol "${V.perfil.rol}"`);
  if (E.perfil.rol !== 'editor') throw new Error('La cuenta PRUEBA_EDITOR debe tener rol editor para seguir');

  const todos = await V.sb.from('usuarios').select('id');
  revisar((todos.data?.length ?? 0) >= 2, `el Visualizador ve a todo el equipo (${todos.data?.length ?? 0} usuarios)`);

  const autoRol = await V.sb.from('usuarios').update({ rol: 'editor' }).eq('id', V.id).select('rol');
  const sigue = await V.sb.from('usuarios').select('rol').eq('id', V.id).single();
  revisar(
    sigue.data?.rol === 'visualizador',
    'el Visualizador no puede darse el rol de editor a sí mismo',
    autoRol.error?.message,
  );

  // ---------------------------------------------------------------------------
  titulo('2. Tablero compartido');
  let tab = await E.sb.from('tableros').select('id, nombre').order('created_at').limit(1).maybeSingle();
  if (!tab.data) {
    tab = await E.sb
      .from('tableros')
      .insert({ nombre: 'Tablero de hoy', equipo: 'Equipo de desarrollo' })
      .select()
      .single();
    revisar(!tab.error, 'no había tablero: el Editor lo creó', tab.error?.message);
  }
  const tableroId = tab.data.id;
  const tabV = await V.sb.from('tableros').select('id').order('created_at').limit(1).maybeSingle();
  revisar(tabV.data?.id === tableroId, 'Editor y Visualizador abren el mismo tablero');
  const cols = await E.sb.from('columnas').select('id, orden').eq('tablero_id', tableroId).order('orden');
  revisar(cols.data?.length === 3, 'el tablero tiene sus 3 columnas (trigger al crear tablero)');
  const [colPend, , colTerm] = cols.data.map((c) => c.id);

  // ---------------------------------------------------------------------------
  titulo('3. Sincronización en vivo (Realtime)');
  const eventos = [];
  const canal = V.sb
    .channel('prueba-tablero')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, (p) =>
      eventos.push({ t: 'tareas', ...p }),
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, (p) =>
      eventos.push({ t: 'checklist_items', ...p }),
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'evidencias' }, (p) =>
      eventos.push({ t: 'evidencias', ...p }),
    );
  const estado = await new Promise((r) => canal.subscribe((s) => (s !== 'CLOSED' ? r(s) : null)));
  revisar(estado === 'SUBSCRIBED', 'el Visualizador se suscribe a los cambios del tablero', estado);
  await pausa(1000);

  let tareaId = null;
  let ruta = null;
  try {
    // -------------------------------------------------------------------------
    titulo('4. Crear tarea (Editor)');
    const nueva = await E.sb
      .from('tareas')
      .insert({
        titulo: `[PRUEBA] ${new Date().toISOString()}`,
        descripcion: 'Creada por scripts/probar-supabase.mjs',
        prioridad: 'media',
        fecha_limite: new Date(Date.now() + 86_400_000).toISOString(),
        asignado_a: E.id,
        columna_id: colPend,
        estado: 'pendiente',
      })
      .select('id, titulo')
      .single();
    revisar(!nueva.error, 'el Editor crea la tarea', nueva.error?.message);
    if (nueva.error) return;
    tareaId = nueva.data.id;
    const items = await E.sb
      .from('checklist_items')
      .insert([
        { tarea_id: tareaId, descripcion: 'Paso 1', orden: 0 },
        { tarea_id: tareaId, descripcion: 'Paso 2', orden: 1 },
      ])
      .select('id');
    revisar(!items.error && items.data.length === 2, 'se guardan 2 ítems de checklist', items.error?.message);

    const evIns = await esperarEvento(
      eventos,
      (e) => e.t === 'tareas' && e.eventType === 'INSERT' && e.new.id === tareaId,
    );
    revisar(
      !!evIns,
      'el Visualizador recibe la tarea nueva en vivo',
      'no llegó el evento (¿tareas está en la publicación supabase_realtime?)',
    );
    const vista = await V.sb.from('tareas').select('id').eq('id', tareaId).maybeSingle();
    revisar(!!vista.data, 'el Visualizador ve la tarea al consultar');

    // -------------------------------------------------------------------------
    titulo('5. Permisos del Visualizador (RLS)');
    await V.sb.from('tareas').update({ titulo: 'hackeado' }).eq('id', tareaId);
    const intacta = await E.sb.from('tareas').select('titulo').eq('id', tareaId).single();
    revisar(intacta.data.titulo === nueva.data.titulo, 'no puede editar la tarea');
    const aVisor = await E.sb.from('tareas').update({ asignado_a: V.id }).eq('id', tareaId);
    revisar(
      !!aVisor.error && aVisor.error.message.includes('editores'),
      'no se puede asignar una tarea a un Visualizador',
      aVisor.error?.message ?? 'la BD aceptó la asignación (¿supabase/schema.sql está actualizado?)',
    );
    const insV = await V.sb.from('checklist_items').insert({ tarea_id: tareaId, descripcion: 'x', orden: 9 });
    revisar(!!insV.error, 'no puede agregar ítems al checklist');
    const subV = await V.sb.storage
      .from(BUCKET)
      .upload(`${tareaId}/visor.jpg`, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
        contentType: 'image/jpeg',
      });
    revisar(!!subV.error, 'no puede subir fotos');
    if (!subV.error) await E.sb.storage.from(BUCKET).remove([`${tareaId}/visor.jpg`]);

    // -------------------------------------------------------------------------
    titulo('6. Regla de cierre en la base de datos');
    const sinNada = await E.sb.from('tareas').update({ estado: 'terminado', columna_id: colTerm }).eq('id', tareaId);
    revisar(!!sinNada.error, 'no se puede cerrar con el checklist incompleto', 'el trigger no bloqueó el cierre');

    const marcar = await E.sb.from('checklist_items').update({ completado: true }).eq('tarea_id', tareaId).select('id');
    revisar(!marcar.error && marcar.data.length === 2, 'el Editor marca el checklist completo', marcar.error?.message);
    const evItem = await esperarEvento(eventos, (e) => e.t === 'checklist_items' && e.eventType === 'UPDATE');
    revisar(!!evItem, 'el Visualizador recibe el checklist marcado en vivo');
    const itemsV = await V.sb.from('checklist_items').select('completado').eq('tarea_id', tareaId);
    revisar(
      itemsV.data?.every((i) => i.completado),
      'el Visualizador ve los ítems tachados',
    );

    const sinFoto = await E.sb.from('tareas').update({ estado: 'terminado', columna_id: colTerm }).eq('id', tareaId);
    revisar(!!sinFoto.error, 'no se puede cerrar sin foto', 'el trigger no bloqueó el cierre');

    // -------------------------------------------------------------------------
    titulo('7. Foto de evidencia (Storage) visible para todo el equipo');
    // JPEG mínimo de 1×1 px
    const jpeg = Uint8Array.from(
      Buffer.from(
        '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==',
        'base64',
      ),
    );
    ruta = `${tareaId}/${Date.now()}.jpg`;
    const sub = await E.sb.storage.from(BUCKET).upload(ruta, jpeg, { contentType: 'image/jpeg' });
    revisar(!sub.error, 'el Editor sube la foto al bucket privado', sub.error?.message);
    const ev = await E.sb.from('evidencias').insert({ tarea_id: tareaId, url_foto: ruta }).select('id').single();
    revisar(!ev.error, 'se registra la fila en evidencias', ev.error?.message);

    const evFoto = await esperarEvento(eventos, (e) => e.t === 'evidencias' && e.eventType === 'INSERT');
    revisar(!!evFoto, 'el Visualizador recibe la foto nueva en vivo');
    const fotosV = await V.sb.from('evidencias').select('url_foto').eq('tarea_id', tareaId);
    revisar(fotosV.data?.length === 1, 'el Visualizador ve la evidencia en la tarea');
    const firmada = await V.sb.storage.from(BUCKET).createSignedUrl(ruta, 60);
    revisar(!firmada.error, 'el Visualizador obtiene una URL firmada', firmada.error?.message);
    if (firmada.data) {
      const r = await fetch(firmada.data.signedUrl);
      const bytes = new Uint8Array(await r.arrayBuffer());
      revisar(r.ok && bytes.length === jpeg.length, 'el Visualizador descarga la misma foto', `HTTP ${r.status}`);
    }
    const anonimo = await nuevoCliente().storage.from(BUCKET).createSignedUrl(ruta, 60);
    revisar(!!anonimo.error, 'alguien sin sesión no puede ver la foto (bucket privado)');

    // -------------------------------------------------------------------------
    titulo('8. Completar la tarea');
    const cierre = await E.sb.from('tareas').update({ estado: 'terminado', columna_id: colTerm }).eq('id', tareaId);
    revisar(!cierre.error, 'con checklist completo y foto la tarea se cierra', cierre.error?.message);
    const evCierre = await esperarEvento(
      eventos,
      (e) => e.t === 'tareas' && e.eventType === 'UPDATE' && e.new.estado === 'terminado',
    );
    revisar(!!evCierre, 'el Visualizador ve la tarea pasar a Terminado en vivo');

    const act = await V.sb.from('actividad').select('tipo, destinatario_id').eq('tarea_id', tareaId);
    const tipos = new Set(act.data?.map((a) => a.tipo));
    for (const t of ['creada', 'asignacion', 'evidencia', 'completada'])
      revisar(
        tipos.has(t),
        `actividad registra "${t}" (trigger)`,
        `tipos encontrados: ${[...tipos].join(', ') || 'ninguno'}`,
      );
    revisar(
      act.data?.some((a) => a.tipo === 'asignacion' && a.destinatario_id === E.id),
      'la asignación le llega al Editor responsable como destinatario',
    );

    // -------------------------------------------------------------------------
    titulo('9. Comentarios y @menciones');
    const com = await V.sb
      .from('comentarios')
      .insert({ tarea_id: tareaId, texto: `@${E.perfil.nombre} prueba`, menciones: [E.id] })
      .select('id')
      .single();
    if (com.error?.code === 'PGRST205' || com.error?.code === '42P01') {
      mal('la tabla comentarios no existe', 'falta aplicar la sección 7 de supabase/schema.sql');
    } else {
      revisar(!com.error, 'el Visualizador puede comentar', com.error?.message);
      const men = await E.sb
        .from('actividad')
        .select('id')
        .eq('tarea_id', tareaId)
        .eq('tipo', 'mencion')
        .eq('destinatario_id', E.id);
      revisar(men.data?.length === 1, 'la mención genera actividad para el mencionado (trigger)');
      const borrarAjeno = await E.sb.from('comentarios').delete().eq('id', com.data?.id).select('id');
      revisar((borrarAjeno.data?.length ?? 0) === 0, 'nadie puede borrar comentarios de otro');
    }
  } finally {
    // -------------------------------------------------------------------------
    titulo('10. Eliminar (limpieza)');
    if (tareaId) {
      const del = await E.sb.from('tareas').delete().eq('id', tareaId);
      revisar(!del.error, 'el Editor elimina la tarea', del.error?.message);
      const restos = await Promise.all(
        ['checklist_items', 'evidencias', 'actividad'].map((t) =>
          E.sb.from(t).select('id', { count: 'exact', head: true }).eq('tarea_id', tareaId),
        ),
      );
      revisar(
        restos.every((r) => r.count === 0),
        'checklist, evidencias y actividad se borran en cascada',
      );
    }
    if (ruta) {
      const rm = await E.sb.storage.from(BUCKET).remove([ruta]);
      revisar(!rm.error && rm.data?.length === 1, 'la foto se borra del bucket', rm.error?.message);
    }
    await V.sb.removeChannel(canal);
    await Promise.all([E.sb.auth.signOut(), V.sb.auth.signOut()]);
  }
}

main()
  .catch((e) => {
    fallas++;
    console.error(`\n\x1b[31m${e.message}\x1b[0m`);
  })
  .finally(() => {
    console.log(fallas ? `\n\x1b[31m${fallas} problema(s)\x1b[0m` : '\n\x1b[32mTodo funciona en Supabase\x1b[0m');
    process.exit(fallas ? 1 : 0);
  });
